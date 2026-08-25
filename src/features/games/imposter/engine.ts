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
import { randomInt, shuffle } from '../core/rng';
import { IMPOSTER_CATEGORIES } from './categories';
import {
  IMPOSTER_MAX_PLAYERS,
  IMPOSTER_MIN_PLAYERS,
  validateImposterConfig,
  type ImposterConfig,
} from './config';
import type { ImposterAction, ImposterPlayerView, ImposterState, ImposterWinner } from './state';

/**
 * Imposter engine — pure. One category, one secret value, one imposter who
 * doesn't know it. Structurally a cross between Vampire Village and Zarta:
 * `role_reveal` is a broadcast ack gate like VV's (everyone acks whenever
 * ready, no order to it), `voting` is a drained queue like Zarta's
 * `pendingVoters` (one uid acts at a time, `projectFor` never leaks another
 * seat's in-flight vote).
 *
 * The one clock that makes this game what it is: `deadlineAt` is set once,
 * when discussion opens, and nothing resets it — calling a vote or a wrong
 * guess spends the group's shared time, it doesn't pause it. Only a correct
 * vote, a correct guess, or the clock running out ends the game; a failed
 * vote just drops back to `discussion` with the same deadline still ticking,
 * which is what makes "if they couldn't find it before time's up, it's a
 * draw" literally true instead of "first wrong guess loses".
 */

const clone = (s: ImposterState): ImposterState => JSON.parse(JSON.stringify(s)) as ImposterState;

function pushLog(s: ImposterState, kind: string, text: string, at: Millis): void {
  const entry: LogEntry = { id: `l${s.logSeq}`, round: 1, at, text, kind };
  s.logSeq += 1;
  s.log.push(entry);
}

const secs = (n: number): number => n * 1000;

function beginDiscussion(s: ImposterState, now: Millis): void {
  s.phase = 'discussion';
  s.deadlineAt = now + secs(s.config.discussionSeconds);
  pushLog(s, 'discussion_start', `Category: ${s.categoryName}. The clock is running.`, now);
}

function beginVoting(s: ImposterState, now: Millis): void {
  s.phase = 'voting';
  s.pendingVoters = [...s.order];
  s.votes = {};
  pushLog(s, 'vote_called', 'A vote has been called.', now);
}

function endGame(s: ImposterState, winner: ImposterWinner, now: Millis): void {
  s.phase = 'game_over';
  s.winner = winner;
  s.deadlineAt = now;
  const text =
    winner === 'crew'
      ? `${s.displayNames[s.imposterUid]} was caught. The crew wins.`
      : winner === 'imposter'
        ? `${s.displayNames[s.imposterUid]} fooled everyone and wins.`
        : "Time's up. Nobody found out — it's a draw.";
  pushLog(s, 'game_over', text, now);
}

/** Tallies the round's votes and either ends the game (a correct majority
 *  caught the imposter) or drops back to discussion — see the file header
 *  for why a wrong or tied vote doesn't end the game on its own. */
function resolveVote(s: ImposterState, now: Millis): void {
  const tally: Record<Uid, number> = {};
  for (const target of Object.values(s.votes)) tally[target] = (tally[target] ?? 0) + 1;

  let top: Uid | null = null;
  let topCount = 0;
  let tied = false;
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

  if (top !== null && !tied && top === s.imposterUid) {
    endGame(s, 'crew', now);
    return;
  }

  pushLog(
    s,
    'vote_failed',
    tied || top === null
      ? 'No consensus. Back to discussion.'
      : `${s.displayNames[top]} was accused, but wasn't the imposter. Back to discussion.`,
    now,
  );
  s.phase = 'discussion';
  s.votes = {};
  s.pendingVoters = [];
}

/* ------------------------------------------------------------------ */
/* engine                                                              */
/* ------------------------------------------------------------------ */

export const imposterEngine: GameEngine<ImposterState, ImposterConfig, ImposterAction, ImposterPlayerView> = {
  id: 'imposter',

  meta: { minPlayers: IMPOSTER_MIN_PLAYERS, maxPlayers: IMPOSTER_MAX_PLAYERS, isPremium: false },

  validateConfig(raw: unknown): Result<ImposterConfig> {
    return validateImposterConfig(raw);
  },

  createInitialState(
    players: PlayerSeat[],
    config: ImposterConfig,
    rng: Rng,
    now: Millis,
  ): Result<ImposterState> {
    if (players.length < IMPOSTER_MIN_PLAYERS) {
      return err('NOT_ENOUGH_PLAYERS', `Imposter needs at least ${IMPOSTER_MIN_PLAYERS} players.`);
    }
    if (players.length > IMPOSTER_MAX_PLAYERS) {
      return err('TOO_MANY_PLAYERS', `Imposter allows at most ${IMPOSTER_MAX_PLAYERS} players.`);
    }

    const order = players.map((p) => p.uid);
    const displayNames: Record<Uid, string> = {};
    for (const p of players) displayNames[p.uid] = p.displayName;

    const category = IMPOSTER_CATEGORIES[randomInt(rng, IMPOSTER_CATEGORIES.length)];
    const value = category.values[randomInt(rng, category.values.length)];
    const imposterUid = shuffle(rng, order)[0];
    const poolChoices = shuffle(rng, category.values).map((v) => ({ id: v.id, text: v.text }));

    const state: ImposterState = {
      config,
      phase: 'role_reveal',
      // Generous, per-seat allowance to pass the phone and read your role —
      // same fallback-only role reflex Vampire Village's role_reveal keeps.
      deadlineAt: now + secs(20) * players.length,
      order,
      displayNames,
      categoryId: category.id,
      categoryName: category.name,
      valueId: value.id,
      valueText: value.text,
      poolChoices,
      imposterUid,
      acked: [],
      imposterGuessedWrong: false,
      pendingVoters: [],
      votes: {},
      winner: null,
      log: [],
      logSeq: 0,
    };

    pushLog(state, 'game_start', `${players.length} players. One of them is the imposter.`, now);
    return ok(state);
  },

  reduce(state: ImposterState, action: ImposterAction, ctx: EngineCtx): Result<ImposterState> {
    if (!state.order.includes(ctx.uid)) return err('NOT_A_PLAYER', 'You are not in this game.');

    const s = clone(state);

    switch (action.type) {
      case 'ACK_ROLE': {
        if (s.phase !== 'role_reveal') return err('WRONG_PHASE', 'Roles are no longer being revealed.');
        if (!s.acked.includes(ctx.uid)) s.acked.push(ctx.uid);
        if (s.order.every((uid) => s.acked.includes(uid))) beginDiscussion(s, ctx.now);
        return ok(s);
      }

      case 'CALL_VOTE': {
        if (s.phase !== 'discussion') return err('WRONG_PHASE', 'A vote cannot be called right now.');
        beginVoting(s, ctx.now);
        return ok(s);
      }

      case 'SUBMIT_VOTE': {
        if (s.phase !== 'voting') return err('WRONG_PHASE', 'Voting is not open.');
        const current = s.pendingVoters[0];
        if (!current) return err('WRONG_PHASE', 'Nobody is waiting to vote.');
        if (ctx.uid !== current) return err('NOT_YOUR_TURN', 'It is not your turn to vote.');
        if (action.target === ctx.uid) return err('INVALID_TARGET', 'You cannot vote for yourself.');
        if (!s.order.includes(action.target)) return err('INVALID_TARGET', 'That player is not seated here.');

        s.votes[ctx.uid] = action.target;
        s.pendingVoters.shift();
        if (s.pendingVoters.length === 0) resolveVote(s, ctx.now);
        return ok(s);
      }

      case 'GUESS_VALUE': {
        if (ctx.uid !== s.imposterUid) return err('NOT_YOUR_TURN', 'Only the imposter guesses the value.');
        if (s.phase !== 'discussion' && s.phase !== 'voting') {
          return err('WRONG_PHASE', 'There is nothing to guess right now.');
        }
        if (s.imposterGuessedWrong) return err('ALREADY_ACTED', 'You already used your guess.');

        if (action.valueId === s.valueId) {
          endGame(s, 'imposter', ctx.now);
          return ok(s);
        }

        s.imposterGuessedWrong = true;
        pushLog(s, 'guess_wrong', 'The imposter guessed — and got it wrong.', ctx.now);
        return ok(s);
      }

      default:
        return err('WRONG_PHASE', 'Unknown action.');
    }
  },

  /** Deadline-driven: `role_reveal` force-advances if not everyone acked in
   *  time (Vampire Village's own precedent for that phase); `discussion` and
   *  `voting` both end the game as a draw the instant the shared clock runs
   *  out, regardless of a vote mid-flight — the deadline is authoritative. */
  tick(state: ImposterState, now: Millis): ImposterState {
    const s = clone(state);

    if (s.phase === 'role_reveal' && now >= s.deadlineAt) {
      beginDiscussion(s, now);
      return s;
    }

    if ((s.phase === 'discussion' || s.phase === 'voting') && now >= s.deadlineAt) {
      endGame(s, 'draw', now);
      return s;
    }

    return s;
  },

  projectFor(state: ImposterState, uid: Uid): ImposterPlayerView {
    const isImposter = uid === state.imposterUid;
    const over = state.phase === 'game_over';
    const currentVoterUid = state.phase === 'voting' ? (state.pendingVoters[0] ?? null) : null;

    return {
      phase: state.phase,
      deadlineAt: state.deadlineAt,
      discussionSeconds: state.config.discussionSeconds,
      you: { uid, isImposter, acked: state.acked.includes(uid) },
      categoryId: state.categoryId,
      categoryName: state.categoryName,
      value: isImposter ? null : state.valueText,
      poolChoices: isImposter && !over ? state.poolChoices : [],
      imposterGuessedWrong: state.imposterGuessedWrong,
      players: state.order.map((u) => ({ uid: u, displayName: state.displayNames[u] })),
      ackedCount: state.acked.length,
      nextToRevealUid:
        state.phase === 'role_reveal' ? (state.order.find((u) => !state.acked.includes(u)) ?? null) : null,
      currentVoterUid,
      currentVoterName: currentVoterUid ? state.displayNames[currentVoterUid] : null,
      isYourTurnToVote: currentVoterUid === uid,
      winner: state.winner,
      imposterUidIfOver: over ? state.imposterUid : null,
      valueIfOver: over ? state.valueText : null,
      log: state.log,
    };
  },

  isFinished(state: ImposterState): boolean {
    return state.phase === 'game_over';
  },

  calculateResults(state: ImposterState): GameResults {
    const winner: ImposterWinner = state.winner ?? 'draw';
    const players: GameResults['players'] = state.order.map((uid) => {
      const isImposter = uid === state.imposterUid;
      const won =
        winner === 'draw' ? false : winner === 'imposter' ? isImposter : !isImposter;
      return { uid, role: isImposter ? 'imposter' : 'crew', survived: true, won };
    });
    return { winner, rounds: 1, players };
  },
};

export default imposterEngine;
