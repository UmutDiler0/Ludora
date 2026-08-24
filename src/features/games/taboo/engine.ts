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
import {
  TABOO_MAX_PLAYERS,
  TABOO_MIN_PLAYERS,
  validateTabooConfig,
  type TabooConfig,
} from './config';
import type {
  TabooAction,
  TabooState,
  TabooTeam,
  TabooTeamId,
  TabooPlayerView,
  TabooWinner,
} from './state';
import { TABOO_WORDS } from './words';

/**
 * Taboo engine — pure. See docs/ARCHITECTURE.md §9, and engine.ts in
 * vampireVillage for the sibling this was built against.
 *
 * The one piece of hidden information is the current card, held by whoever is
 * describing. Everything else — scores, team rosters, turn order, the recap of
 * a finished turn — is public, because the game itself is played out loud in
 * the room; the app is scorekeeper and clock, not a source of secrets.
 *
 * Deliberate simplification from the physical game: the describer operates all
 * three buttons themselves (Correct / Taboo / Skip) rather than an opposing
 * team judging with a duplicate card. On one shared device passed hand to hand,
 * the describer is the only person who can see the forbidden list to judge
 * against — anyone else pressing Taboo would be guessing. It runs on honesty,
 * same as the describer not glancing ahead at the next card.
 */

const CARDS_BY_ID = new Map(TABOO_WORDS.map((c) => [c.id, c]));

const clone = (s: TabooState): TabooState => JSON.parse(JSON.stringify(s)) as TabooState;

function pushLog(s: TabooState, kind: string, text: string, at: Millis): void {
  const entry: LogEntry = { id: `l${s.logSeq}`, round: s.turn, at, text, kind };
  s.logSeq += 1;
  s.log.push(entry);
}

const secs = (n: number): number => n * 1000;

const otherTeam = (id: TabooTeamId): TabooTeamId => (id === 'A' ? 'B' : 'A');

function teamOf(s: TabooState, uid: Uid): TabooTeamId | null {
  if (s.teams.A.memberUids.includes(uid)) return 'A';
  if (s.teams.B.memberUids.includes(uid)) return 'B';
  return null;
}

/**
 * Puts the next card in play, reshuffling the discard pile back into the deck
 * first if it has run dry. With 30 starter cards against a skip limit of 3 and
 * a 60-second turn this essentially never happens, but a real deck must not
 * assume its own size.
 */
function drawCard(s: TabooState, rng: Rng): void {
  if (s.deck.length === 0) {
    s.deck = shuffle(rng, s.discard);
    s.discard = [];
  }
  s.currentCardId = s.deck.pop() ?? null;
}

/** Ends the active turn: banks the recap, rotates to the next describer, and
 *  decides — but does not yet apply — whether the game is over. */
function endTurn(s: TabooState, now: Millis): void {
  const team = s.teams[s.activeTeam];

  s.lastTurnTeam = s.activeTeam;
  s.lastTurnGained = s.turnEvents.filter((e) => e.result === 'correct').length -
    s.turnEvents.filter((e) => e.result === 'tabu').length;
  s.lastTurnEvents = s.turnEvents;
  s.turnEvents = [];
  s.currentCardId = null;

  // Round-robin describer within the team, so the same person is not asked to
  // perform every single time it comes back around to their side.
  team.nextDescriberIndex = (team.nextDescriberIndex + 1) % team.memberUids.length;

  pushLog(
    s,
    'turn_end',
    `Team ${team.name}'s turn ends: ${s.lastTurnGained >= 0 ? '+' : ''}${s.lastTurnGained} this turn.`,
    now,
  );

  s.winner = computeWinner(s);
  s.phase = 'turn_recap';
}

function computeWinner(s: TabooState): TabooWinner | null {
  const { A, B } = s.teams;
  const reachedTarget = A.score >= s.config.targetScore || B.score >= s.config.targetScore;
  const outOfTurns = s.turn >= s.config.maxTurns;
  if (!reachedTarget && !outOfTurns) return null;
  if (A.score === B.score) return 'draw';
  return A.score > B.score ? 'A' : 'B';
}

function beginTurn(s: TabooState, team: TabooTeamId, now: Millis): void {
  s.activeTeam = team;
  s.describerUid = s.teams[team].memberUids[s.teams[team].nextDescriberIndex];
  s.phase = 'turn_intro';
  s.deadlineAt = now;
  pushLog(s, 'turn_start', `Team ${s.teams[team].name} is up.`, now);
}

/* ------------------------------------------------------------------ */
/* engine                                                              */
/* ------------------------------------------------------------------ */

export const tabooEngine: GameEngine<TabooState, TabooConfig, TabooAction, TabooPlayerView> = {
  id: 'taboo',

  meta: { minPlayers: TABOO_MIN_PLAYERS, maxPlayers: TABOO_MAX_PLAYERS, isPremium: false },

  validateConfig(raw: unknown): Result<TabooConfig> {
    return validateTabooConfig(raw);
  },

  createInitialState(
    players: PlayerSeat[],
    config: TabooConfig,
    rng: Rng,
    now: Millis,
  ): Result<TabooState> {
    if (players.length < TABOO_MIN_PLAYERS) {
      return err('NOT_ENOUGH_PLAYERS', `Taboo needs at least ${TABOO_MIN_PLAYERS} players.`);
    }
    if (players.length > TABOO_MAX_PLAYERS) {
      return err('TOO_MANY_PLAYERS', `Taboo allows at most ${TABOO_MAX_PLAYERS} players.`);
    }

    // A room owner who picked teams by hand gets exactly that roster, in the
    // order they built it — no reshuffling their choice. Only when nobody
    // specified a team (the quick-play path, where every seat is generic) does
    // the engine fall back to dealing teams itself.
    const explicit = players.every((p) => p.team === 'A' || p.team === 'B');
    let teamA: Uid[] = [];
    let teamB: Uid[] = [];
    if (explicit) {
      teamA = players.filter((p) => p.team === 'A').map((p) => p.uid);
      teamB = players.filter((p) => p.team === 'B').map((p) => p.uid);
      if (teamA.length === 0 || teamB.length === 0) {
        return err('INVALID_CONFIG', 'Each team needs at least one player.');
      }
    } else {
      const seated = shuffle(rng, players);
      seated.forEach((p, i) => (i % 2 === 0 ? teamA : teamB).push(p.uid));
    }

    const makeTeam = (id: TabooTeamId, name: string, memberUids: Uid[]): TabooTeam => ({
      id,
      name,
      score: 0,
      memberUids,
      nextDescriberIndex: 0,
    });

    const displayNames: Record<Uid, string> = {};
    for (const p of players) displayNames[p.uid] = p.displayName;

    const state: TabooState = {
      config,
      phase: 'turn_intro',
      turn: 1,
      displayNames,
      teams: { A: makeTeam('A', 'Red', teamA), B: makeTeam('B', 'Blue', teamB) },
      activeTeam: 'A',
      describerUid: teamA[0],
      deck: shuffle(rng, TABOO_WORDS.map((c) => c.id)),
      discard: [],
      currentCardId: null,
      skipsUsed: 0,
      deadlineAt: now,
      turnEvents: [],
      lastTurnTeam: null,
      lastTurnGained: 0,
      lastTurnEvents: [],
      log: [],
      logSeq: 0,
      winner: null,
    };

    pushLog(
      state,
      'game_start',
      `Two teams, ${players.length} players. First to ${config.targetScore} wins.`,
      now,
    );
    return ok(state);
  },

  reduce(state: TabooState, action: TabooAction, ctx: EngineCtx): Result<TabooState> {
    const s = clone(state);

    switch (action.type) {
      case 'START_TURN': {
        if (s.phase !== 'turn_intro') return err('WRONG_PHASE', 'This turn has already started.');
        if (ctx.uid !== s.describerUid) {
          return err('NOT_YOUR_TURN', 'Only the describer can start the clock.');
        }
        s.phase = 'describing';
        s.deadlineAt = ctx.now + secs(s.config.roundSeconds);
        s.skipsUsed = 0;
        s.turnEvents = [];
        drawCard(s, ctx.rng);
        return ok(s);
      }

      case 'MARK': {
        if (s.phase !== 'describing') return err('WRONG_PHASE', 'No card is in play.');
        if (ctx.uid !== s.describerUid) {
          return err('NOT_YOUR_TURN', 'Only the describer marks a card.');
        }
        if (!s.currentCardId) return err('WRONG_PHASE', 'No card is in play.');
        if (action.result === 'skip' && s.skipsUsed >= s.config.skipLimit) {
          return err('ALREADY_ACTED', 'No skips left this turn.');
        }

        const card = CARDS_BY_ID.get(s.currentCardId);
        if (!card) return err('WRONG_PHASE', 'That card no longer exists.');

        const team = s.teams[s.activeTeam];
        if (action.result === 'correct') team.score += 1;
        if (action.result === 'tabu') team.score = Math.max(0, team.score - 1);
        if (action.result === 'skip') s.skipsUsed += 1;

        s.turnEvents.push({ cardId: card.id, word: card.word, result: action.result });
        s.discard.push(card.id);
        drawCard(s, ctx.rng);

        // The deck can only run out if the discard pile is also empty, which
        // only happens if the whole 30-card deck was played in one turn —
        // effectively unreachable, but ending the turn is the honest response
        // rather than leaving the describer stuck with no card.
        if (!s.currentCardId) endTurn(s, ctx.now);
        return ok(s);
      }

      case 'CONTINUE': {
        if (s.phase !== 'turn_recap') return err('WRONG_PHASE', 'There is nothing to continue past.');
        if (!teamOf(s, ctx.uid)) return err('NOT_A_PLAYER', 'You are not in this game.');

        if (s.winner) {
          s.phase = 'game_over';
          pushLog(
            s,
            'game_over',
            s.winner === 'draw'
              ? 'The scores are tied. It ends a draw.'
              : `Team ${s.teams[s.winner].name} wins.`,
            ctx.now,
          );
          return ok(s);
        }

        s.turn += 1;
        beginTurn(s, otherTeam(s.activeTeam), ctx.now);
        return ok(s);
      }

      default:
        return err('WRONG_PHASE', 'Unknown action.');
    }
  },

  /** Deadline-driven: a describing turn that runs out the clock ends itself,
   *  the same way night and voting do in Vampire Village. */
  tick(state: TabooState, now: Millis): TabooState {
    const s = clone(state);
    if (s.phase === 'describing' && now >= s.deadlineAt) endTurn(s, now);
    return s;
  },

  projectFor(state: TabooState, uid: Uid): TabooPlayerView {
    const team = teamOf(state, uid) ?? 'A';
    const isDescriber = uid === state.describerUid;
    const live = state.phase === 'describing';

    const card =
      isDescriber && live && state.currentCardId
        ? (() => {
            const c = CARDS_BY_ID.get(state.currentCardId as string);
            return c ? { word: c.word, forbidden: c.forbidden } : null;
          })()
        : null;

    return {
      phase: state.phase,
      turn: state.turn,
      deadlineAt: state.deadlineAt,
      teams: (['A', 'B'] as TabooTeamId[]).map((id) => ({
        id,
        name: state.teams[id].name,
        score: state.teams[id].score,
        members: state.teams[id].memberUids.map((u) => ({
          uid: u,
          displayName: state.displayNames[u],
        })),
      })),
      activeTeam: state.activeTeam,
      describerUid: state.describerUid,
      describerName: state.displayNames[state.describerUid],
      you: { uid, team },
      isDescriber,
      card,
      skipsUsed: state.skipsUsed,
      skipLimit: state.config.skipLimit,
      roundSeconds: state.config.roundSeconds,
      turnEvents: isDescriber ? state.turnEvents : [],
      lastTurn:
        state.lastTurnTeam !== null
          ? { team: state.lastTurnTeam, gained: state.lastTurnGained, events: state.lastTurnEvents }
          : null,
      targetScore: state.config.targetScore,
      winner: state.winner,
    };
  },

  isFinished(state: TabooState): boolean {
    return state.phase === 'game_over';
  },

  calculateResults(state: TabooState): GameResults {
    const winner = state.winner ?? 'draw';
    const players: GameResults['players'] = [];
    for (const id of ['A', 'B'] as TabooTeamId[]) {
      for (const uid of state.teams[id].memberUids) {
        players.push({ uid, role: id, survived: true, won: winner !== 'draw' && winner === id });
      }
    }
    return { winner, rounds: state.turn, players };
  },
};

export default tabooEngine;
