import {
  err,
  ok,
  type EngineCtx,
  type GameEngine,
  type GameResults,
  type LogEntry,
  type Millis,
  type PlayerSeat,
  type Result,
  type Rng,
  type Uid,
} from '../core/types';
import { shuffle } from '../core/rng';
import { ROLES, type Alignment, type RoleId } from './roles';
import {
  autoVampireCount,
  validateVVConfig,
  VV_MAX_PLAYERS,
  VV_MIN_PLAYERS,
  type VVConfig,
} from './config';
import type { VVAction, VVPlayer, VVPlayerView, VVState } from './state';

/**
 * Vampire Village engine — pure. See docs/ARCHITECTURE.md §9.
 *
 * No imports from firebase, react, or any I/O. `now` and `rng` are always
 * supplied by the caller so a finished game replays identically from its seed
 * plus its action log, which is how the server validates results (§10.4).
 */

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** State is JSON-serialisable by contract (§6.3), so this is a safe deep clone. */
const clone = (s: VVState): VVState => JSON.parse(JSON.stringify(s)) as VVState;

const seatsOf = (s: VVState): VVPlayer[] => s.order.map((uid) => s.players[uid]);
const alive = (s: VVState): VVPlayer[] => seatsOf(s).filter((p) => p.alive);
const aliveWithRole = (s: VVState, role: RoleId): VVPlayer[] =>
  alive(s).filter((p) => p.role === role);

function pushLog(s: VVState, kind: string, text: string, at: Millis): void {
  const entry: LogEntry = { id: `l${s.logSeq}`, round: s.round, at, text, kind };
  s.logSeq += 1;
  s.log.push(entry);
}

const secs = (n: number): number => n * 1000;

/* ------------------------------------------------------------------ */
/* phase transitions                                                   */
/* ------------------------------------------------------------------ */

function beginNight(s: VVState, now: Millis): void {
  s.phase = 'night';
  s.nightActions = {};
  s.deadlineAt = now + secs(s.config.durations.night);
  pushLog(s, 'night_start', `Night ${s.round} falls over the village.`, now);
}

function beginDayDiscussion(s: VVState, now: Millis): void {
  s.phase = 'day_discussion';
  s.votes = {};
  s.deadlineAt = now + secs(s.config.durations.dayDiscussion);
}

function beginDayVote(s: VVState, now: Millis): void {
  s.phase = 'day_vote';
  s.deadlineAt = now + secs(s.config.durations.dayVote);
}

function endGame(s: VVState, winner: Alignment, now: Millis): void {
  s.phase = 'game_over';
  s.winner = winner;
  s.deadlineAt = now;
  pushLog(
    s,
    'game_over',
    winner === 'village'
      ? 'The village survives. Every vampire has been exiled.'
      : 'The vampires now outnumber the living. The village falls.',
    now,
  );
}

/** Returns the winning alignment, or null if the game continues. */
function checkWin(s: VVState): Alignment | null {
  const living = alive(s);
  const vampires = living.filter((p) => ROLES[p.role].alignment === 'vampires').length;
  const villagers = living.length - vampires;
  if (vampires === 0) return 'village';
  if (vampires >= villagers) return 'vampires';
  return null;
}

/** Advance out of night: resolve all collected actions simultaneously. */
function resolveNight(s: VVState, now: Millis): void {
  const kill = s.nightActions.vampire;
  const guard = s.nightActions.protector;
  const look = s.nightActions.investigator;

  // Seer — private result, deliberately anonymous in the public log (§22.2).
  if (look) {
    const target = s.players[look.target];
    if (target) {
      const list = s.visions[look.actor] ?? [];
      list.push({
        round: s.round,
        target: target.uid,
        targetName: target.displayName,
        alignment: ROLES[target.role].alignment,
      });
      s.visions[look.actor] = list;
    }
    pushLog(s, 'seer_acted', 'The Seer received a vision.', now);
  }

  if (guard) {
    pushLog(s, 'guard_acted', 'The Bodyguard stood watch.', now);
  }

  if (kill) {
    const victim = s.players[kill.target];
    if (victim && victim.alive) {
      if (guard && guard.target === victim.uid) {
        pushLog(s, 'kill_blocked', `${victim.displayName} was attacked but survived.`, now);
      } else {
        victim.alive = false;
        victim.eliminatedRound = s.round;
        victim.eliminatedBy = 'vampires';
        pushLog(
          s,
          'kill',
          `${victim.displayName} was found drained. They were a ${ROLES[victim.role].name}.`,
          now,
        );
      }
    }
  } else {
    pushLog(s, 'quiet_night', 'The night passed without bloodshed.', now);
  }

  const winner = checkWin(s);
  if (winner) {
    endGame(s, winner, now);
    return;
  }
  beginDayDiscussion(s, now);
}

/** Advance out of the vote: tally, exile or not, then next night. */
function resolveVote(s: VVState, now: Millis): void {
  const tally: Record<Uid, number> = {};
  for (const target of Object.values(s.votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }

  let top: Uid | null = null;
  let topCount = 0;
  let tied = false;
  // Iterate seat order so ties are detected deterministically.
  for (const uid of s.order) {
    const count = tally[uid] ?? 0;
    if (count === 0) continue;
    if (count > topCount) {
      top = uid;
      topCount = count;
      tied = false;
    } else if (count === topCount) {
      tied = true;
    }
  }

  if (top === null || tied) {
    pushLog(s, 'no_exile', 'The village could not agree. No one was exiled.', now);
  } else {
    const victim = s.players[top];
    victim.alive = false;
    victim.eliminatedRound = s.round;
    victim.eliminatedBy = 'vote';
    pushLog(
      s,
      'exile',
      `${victim.displayName} was exiled by vote. They were a ${ROLES[victim.role].name}.`,
      now,
    );
  }

  const winner = checkWin(s);
  if (winner) {
    endGame(s, winner, now);
    return;
  }

  if (s.round >= s.config.maxRounds) {
    pushLog(s, 'round_limit', 'Dawn breaks on the final day.', now);
    endGame(s, 'village', now);
    return;
  }

  s.round += 1;
  beginNight(s, now);
}

/** Roles that still owe a night action, given who is alive. */
function pendingNightRoles(s: VVState): RoleId[] {
  const pending: RoleId[] = [];
  for (const role of ['vampire', 'investigator', 'protector'] as RoleId[]) {
    if (aliveWithRole(s, role).length > 0 && !s.nightActions[role]) pending.push(role);
  }
  return pending;
}

/* ------------------------------------------------------------------ */
/* role assignment                                                     */
/* ------------------------------------------------------------------ */

export function buildRoleDeck(playerCount: number, config: VVConfig): RoleId[] {
  const vampires =
    config.vampireCount > 0
      ? Math.min(config.vampireCount, Math.floor((playerCount - 1) / 2))
      : autoVampireCount(playerCount);

  const deck: RoleId[] = [];
  for (let i = 0; i < vampires; i++) deck.push('vampire');
  if (config.enableSeer && deck.length < playerCount) deck.push('investigator');
  if (config.enableBodyguard && deck.length < playerCount) deck.push('protector');
  while (deck.length < playerCount) deck.push('villager');
  return deck;
}

/* ------------------------------------------------------------------ */
/* engine                                                              */
/* ------------------------------------------------------------------ */

export const vampireVillageEngine: GameEngine<VVState, VVConfig, VVAction, VVPlayerView> = {
  id: 'vampireVillage',

  // Decision D7 (§21): free. It is the only game with session designs and the
  // whole of Phase 3 — gating it would paywall the MVP's only playable game.
  meta: { minPlayers: VV_MIN_PLAYERS, maxPlayers: VV_MAX_PLAYERS, isPremium: false },

  validateConfig(raw: unknown): Result<VVConfig> {
    return validateVVConfig(raw);
  },

  createInitialState(
    players: PlayerSeat[],
    config: VVConfig,
    rng: Rng,
    now: Millis,
  ): Result<VVState> {
    if (players.length < VV_MIN_PLAYERS) {
      return err('NOT_ENOUGH_PLAYERS', `Vampire Village needs at least ${VV_MIN_PLAYERS} players.`);
    }
    if (players.length > VV_MAX_PLAYERS) {
      return err('TOO_MANY_PLAYERS', `Vampire Village allows at most ${VV_MAX_PLAYERS} players.`);
    }

    const deck = shuffle(rng, buildRoleDeck(players.length, config));
    const seated = shuffle(rng, players);

    const state: VVState = {
      config,
      phase: 'role_reveal',
      round: 1,
      deadlineAt: now + secs(config.durations.roleReveal),
      order: seated.map((p) => p.uid),
      players: {},
      acked: [],
      nightActions: {},
      votes: {},
      log: [],
      visions: {},
      winner: null,
      logSeq: 0,
    };

    seated.forEach((seat, i) => {
      state.players[seat.uid] = {
        uid: seat.uid,
        displayName: seat.displayName,
        role: deck[i],
        alive: true,
        eliminatedRound: null,
        eliminatedBy: null,
      };
    });

    pushLog(state, 'game_start', `The village gathers. ${players.length} souls, and not all are human.`, now);
    return ok(state);
  },

  reduce(state: VVState, action: VVAction, ctx: EngineCtx): Result<VVState> {
    const actor = state.players[ctx.uid];
    if (!actor) return err('NOT_A_PLAYER', 'You are not in this game.');

    const s = clone(state);
    const me = s.players[ctx.uid];

    switch (action.type) {
      case 'ACK_ROLE': {
        if (s.phase !== 'role_reveal') return err('WRONG_PHASE', 'Roles are no longer being revealed.');
        if (!s.acked.includes(ctx.uid)) s.acked.push(ctx.uid);
        if (alive(s).every((p) => s.acked.includes(p.uid))) beginNight(s, ctx.now);
        return ok(s);
      }

      case 'NIGHT_ACTION': {
        if (s.phase !== 'night') return err('WRONG_PHASE', 'It is not night.');
        if (!me.alive) return err('PLAYER_ELIMINATED', 'The dead do not act.');

        const ability = ROLES[me.role].night;
        if (ability === null) return err('NOT_YOUR_TURN', 'Your role has no night action.');

        const target = s.players[action.target];
        if (!target || !target.alive) return err('INVALID_TARGET', 'That player cannot be targeted.');

        // Vampires cannot drain their own coven; the Seer learns nothing from
        // reading themselves. The Bodyguard may guard themselves.
        if (me.role === 'vampire' && ROLES[target.role].alignment === 'vampires') {
          return err('INVALID_TARGET', 'Vampires do not feed on their own.');
        }
        if (me.role === 'investigator' && target.uid === me.uid) {
          return err('INVALID_TARGET', 'You already know your own soul.');
        }

        s.nightActions[me.role] = { actor: me.uid, target: target.uid };

        if (pendingNightRoles(s).length === 0) resolveNight(s, ctx.now);
        return ok(s);
      }

      case 'VOTE': {
        if (s.phase !== 'day_vote') return err('WRONG_PHASE', 'Voting is not open.');
        if (!me.alive) return err('PLAYER_ELIMINATED', 'The dead do not vote.');
        const target = s.players[action.target];
        if (!target || !target.alive) return err('INVALID_TARGET', 'That player cannot be voted for.');

        s.votes[ctx.uid] = target.uid;
        if (alive(s).every((p) => s.votes[p.uid] !== undefined)) resolveVote(s, ctx.now);
        return ok(s);
      }

      case 'ABSTAIN': {
        if (s.phase !== 'day_vote') return err('WRONG_PHASE', 'Voting is not open.');
        if (!me.alive) return err('PLAYER_ELIMINATED', 'The dead do not vote.');
        delete s.votes[ctx.uid];
        return ok(s);
      }

      default:
        return err('WRONG_PHASE', 'Unknown action.');
    }
  },

  /**
   * Deadline-driven advance. Loops because a reconnecting client may call
   * this long after several deadlines have passed; the cap prevents a runaway
   * if a phase were ever configured with zero duration.
   */
  tick(state: VVState, now: Millis): VVState {
    let s = clone(state);
    for (let guard = 0; guard < 64; guard++) {
      if (s.phase === 'game_over' || now < s.deadlineAt) break;
      switch (s.phase) {
        case 'role_reveal':
          beginNight(s, now);
          break;
        case 'night':
          // Missing actions are treated as passes (§7.1 auto-pass on disconnect).
          resolveNight(s, now);
          break;
        case 'day_discussion':
          beginDayVote(s, now);
          break;
        case 'day_vote':
          // Absent votes abstain.
          resolveVote(s, now);
          break;
      }
    }
    return s;
  },

  projectFor(state: VVState, uid: Uid): VVPlayerView {
    const me = state.players[uid];
    const over = state.phase === 'game_over';
    const iAmVampire = me ? ROLES[me.role].alignment === 'vampires' : false;

    const voteCounts =
      state.phase === 'day_vote'
        ? Object.values(state.votes).reduce<Record<Uid, number>>((acc, t) => {
            acc[t] = (acc[t] ?? 0) + 1;
            return acc;
          }, {})
        : null;

    return {
      phase: state.phase,
      round: state.round,
      deadlineAt: state.deadlineAt,
      you: {
        uid,
        role: me.role,
        roleName: ROLES[me.role].name,
        blurb: ROLES[me.role].blurb,
        alignment: ROLES[me.role].alignment,
        alive: me.alive,
      },
      players: state.order.map((u) => {
        const p = state.players[u];
        return {
          uid: p.uid,
          displayName: p.displayName,
          alive: p.alive,
          // Roles surface only on elimination or at game end (§22.2).
          role: !p.alive || over ? p.role : null,
        };
      }),
      coven: iAmVampire
        ? state.order.filter((u) => ROLES[state.players[u].role].alignment === 'vampires')
        : null,
      canActNow: state.phase === 'night' && me.alive && ROLES[me.role].night !== null,
      yourNightTarget: state.nightActions[me.role]?.target ?? null,
      yourVote: state.votes[uid] ?? null,
      voteCounts,
      visions: state.visions[uid] ?? [],
      log: state.log,
      winner: state.winner,
    };
  },

  isFinished(state: VVState): boolean {
    return state.phase === 'game_over';
  },

  calculateResults(state: VVState): GameResults {
    const winner = state.winner ?? 'village';
    return {
      winner,
      rounds: state.round,
      players: state.order.map((uid) => {
        const p = state.players[uid];
        return {
          uid,
          role: p.role,
          survived: p.alive,
          won: ROLES[p.role].alignment === winner,
        };
      }),
    };
  },
};

export default vampireVillageEngine;
