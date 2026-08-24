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
  SKETCH_MAX_PLAYERS,
  SKETCH_MIN_PLAYERS,
  validateSketchConfig,
  type SketchConfig,
} from './config';
import type {
  SketchAction,
  SketchGuess,
  SketchPlayerView,
  SketchState,
  SketchWinner,
} from './state';
import { SKETCH_PROMPTS } from './prompts';

/**
 * Sketch It engine — pure. Built against Taboo's engine.ts, the sibling this
 * shares its shape with: one shared device, one seat holding it at a time, no
 * bots (drawing cannot be simulated on a human's behalf any more than
 * describing a Taboo card can).
 *
 * The single-device constraint shapes the one real design decision here: the
 * word can only ever be private for as long as nobody but the artist is
 * looking at the screen. That is true during `round_intro` (the pass-the-phone
 * moment, everyone else looks away — same convention Taboo's forbidden list
 * relies on) and false the instant `drawing` starts, because from then on the
 * whole room is watching the same screen to see the sketch. So the word is
 * shown once, before the clock starts, and never again — the artist draws
 * from memory, same as the physical game.
 *
 * Scoring is gartic.io-style: the artist taps each correct guess in the order
 * it was shouted out, earlier guesses score higher, and the artist earns
 * points for how much of the table they got across this round.
 */

const PROMPTS_BY_ID = new Map(SKETCH_PROMPTS.map((p) => [p.id, p]));

const GUESS_POINTS = [100, 80, 60, 40, 20];
const pointsForRank = (rank: number): number => GUESS_POINTS[Math.min(rank, GUESS_POINTS.length) - 1];

const clone = (s: SketchState): SketchState => JSON.parse(JSON.stringify(s)) as SketchState;

function pushLog(s: SketchState, kind: string, text: string, at: Millis): void {
  const entry: LogEntry = { id: `l${s.logSeq}`, round: s.round, at, text, kind };
  s.logSeq += 1;
  s.log.push(entry);
}

const secs = (n: number): number => n * 1000;

/**
 * Puts the next prompt in play, reshuffling the discard pile back into the
 * deck first if it has run dry. Called as soon as a round begins (not when
 * drawing starts) so the artist has something to memorise during the intro.
 */
function drawPrompt(s: SketchState, rng: Rng): void {
  if (s.deck.length === 0) {
    s.deck = shuffle(rng, s.discard);
    s.discard = [];
  }
  s.currentPromptId = s.deck.pop() ?? null;
}

function beginRound(s: SketchState, now: Millis, rng: Rng): void {
  s.artistUid = s.order[s.round - 1];
  s.phase = 'round_intro';
  s.deadlineAt = now;
  s.guesses = [];
  drawPrompt(s, rng);
  pushLog(s, 'round_start', `${s.displayNames[s.artistUid]} is up to draw.`, now);
}

/** Ends the active round: scores the artist, banks the recap, and — only on
 *  the final round — decides the game's winner. */
function endRound(s: SketchState, now: Millis): void {
  const prompt = s.currentPromptId ? PROMPTS_BY_ID.get(s.currentPromptId) : undefined;
  const guesserCount = s.order.length - 1;
  const artistPoints = guesserCount > 0 ? Math.round((s.guesses.length / guesserCount) * 100) : 0;

  s.scores[s.artistUid] = (s.scores[s.artistUid] ?? 0) + artistPoints;

  s.lastRound = {
    artistUid: s.artistUid,
    word: prompt?.word ?? '',
    guesses: s.guesses,
    artistPoints,
  };
  if (s.currentPromptId) s.discard.push(s.currentPromptId);
  s.currentPromptId = null;
  s.guesses = [];

  pushLog(
    s,
    'round_end',
    `${s.displayNames[s.artistUid]}'s round ends: +${artistPoints} for the artist.`,
    now,
  );

  if (s.round >= s.totalRounds) s.winner = computeWinner(s);
  s.phase = 'round_recap';
}

function computeWinner(s: SketchState): SketchWinner {
  let best = -Infinity;
  let leaders: Uid[] = [];
  for (const uid of s.order) {
    const score = s.scores[uid] ?? 0;
    if (score > best) {
      best = score;
      leaders = [uid];
    } else if (score === best) {
      leaders.push(uid);
    }
  }
  return leaders.length === 1 ? leaders[0] : 'draw';
}

/* ------------------------------------------------------------------ */
/* engine                                                              */
/* ------------------------------------------------------------------ */

export const sketchItEngine: GameEngine<SketchState, SketchConfig, SketchAction, SketchPlayerView> = {
  id: 'drawingGuess',

  meta: { minPlayers: SKETCH_MIN_PLAYERS, maxPlayers: SKETCH_MAX_PLAYERS, isPremium: true },

  validateConfig(raw: unknown): Result<SketchConfig> {
    return validateSketchConfig(raw);
  },

  createInitialState(
    players: PlayerSeat[],
    config: SketchConfig,
    rng: Rng,
    now: Millis,
  ): Result<SketchState> {
    if (players.length < SKETCH_MIN_PLAYERS) {
      return err('NOT_ENOUGH_PLAYERS', `Sketch It needs at least ${SKETCH_MIN_PLAYERS} players.`);
    }
    if (players.length > SKETCH_MAX_PLAYERS) {
      return err('TOO_MANY_PLAYERS', `Sketch It allows at most ${SKETCH_MAX_PLAYERS} players.`);
    }

    const order = shuffle(rng, players).map((p) => p.uid);
    const displayNames: Record<Uid, string> = {};
    const scores: Record<Uid, number> = {};
    for (const p of players) {
      displayNames[p.uid] = p.displayName;
      scores[p.uid] = 0;
    }

    const state: SketchState = {
      config,
      phase: 'round_intro',
      round: 1,
      totalRounds: players.length,
      displayNames,
      order,
      scores,
      artistUid: order[0],
      deck: shuffle(rng, SKETCH_PROMPTS.map((p) => p.id)),
      discard: [],
      currentPromptId: null,
      deadlineAt: now,
      guesses: [],
      lastRound: null,
      log: [],
      logSeq: 0,
      winner: null,
    };

    pushLog(state, 'game_start', `${players.length} players, everyone draws once.`, now);
    drawPrompt(state, rng);
    pushLog(state, 'round_start', `${displayNames[order[0]]} is up to draw.`, now);
    return ok(state);
  },

  reduce(state: SketchState, action: SketchAction, ctx: EngineCtx): Result<SketchState> {
    const s = clone(state);

    switch (action.type) {
      case 'START_ROUND': {
        if (s.phase !== 'round_intro') return err('WRONG_PHASE', 'This round has already started.');
        if (ctx.uid !== s.artistUid) return err('NOT_YOUR_TURN', 'Only the artist can start the clock.');
        s.phase = 'drawing';
        s.deadlineAt = ctx.now + secs(s.config.roundSeconds);
        s.guesses = [];
        return ok(s);
      }

      case 'MARK_GUESS': {
        if (s.phase !== 'drawing') return err('WRONG_PHASE', 'No prompt is in play.');
        if (ctx.uid !== s.artistUid) return err('NOT_YOUR_TURN', 'Only the artist marks a guess.');
        if (action.uid === s.artistUid) {
          return err('INVALID_TARGET', 'The artist cannot guess their own drawing.');
        }
        if (!s.order.includes(action.uid)) return err('NOT_A_PLAYER', 'That player is not in this game.');
        if (s.guesses.some((g) => g.uid === action.uid)) {
          return err('ALREADY_ACTED', 'That player already guessed correctly this round.');
        }

        const rank = s.guesses.length + 1;
        const guess: SketchGuess = { uid: action.uid, rank, points: pointsForRank(rank) };
        s.guesses.push(guess);
        s.scores[action.uid] = (s.scores[action.uid] ?? 0) + guess.points;

        // Once everyone else has it, there is nothing left to guess.
        if (s.guesses.length >= s.order.length - 1) endRound(s, ctx.now);
        return ok(s);
      }

      case 'CONTINUE': {
        if (s.phase !== 'round_recap') return err('WRONG_PHASE', 'There is nothing to continue past.');
        if (!s.order.includes(ctx.uid)) return err('NOT_A_PLAYER', 'You are not in this game.');

        if (s.winner) {
          s.phase = 'game_over';
          pushLog(
            s,
            'game_over',
            s.winner === 'draw' ? 'Scores are tied. It ends a draw.' : `${s.displayNames[s.winner]} wins.`,
            ctx.now,
          );
          return ok(s);
        }

        s.round += 1;
        beginRound(s, ctx.now, ctx.rng);
        return ok(s);
      }

      default:
        return err('WRONG_PHASE', 'Unknown action.');
    }
  },

  /** Deadline-driven: a drawing round that runs out the clock ends itself,
   *  the same way Taboo's turn and Vampire Village's night and vote do. */
  tick(state: SketchState, now: Millis): SketchState {
    const s = clone(state);
    if (s.phase === 'drawing' && now >= s.deadlineAt) endRound(s, now);
    return s;
  },

  projectFor(state: SketchState, uid: Uid): SketchPlayerView {
    const isArtist = uid === state.artistUid;
    const showWord = isArtist && state.phase === 'round_intro' && !!state.currentPromptId;
    const word = showWord ? (PROMPTS_BY_ID.get(state.currentPromptId as string)?.word ?? null) : null;

    const guessedUids = new Set(state.guesses.map((g) => g.uid));
    const waitingOn = state.order
      .filter((u) => u !== state.artistUid && !guessedUids.has(u))
      .map((u) => ({ uid: u, displayName: state.displayNames[u] }));

    const leaderboard = state.order
      .map((u) => ({ uid: u, displayName: state.displayNames[u], score: state.scores[u] ?? 0 }))
      .sort((a, b) => b.score - a.score);

    return {
      phase: state.phase,
      round: state.round,
      totalRounds: state.totalRounds,
      deadlineAt: state.deadlineAt,
      roundSeconds: state.config.roundSeconds,
      artistUid: state.artistUid,
      artistName: state.displayNames[state.artistUid],
      you: { uid },
      isArtist,
      word,
      guessers: state.guesses.map((g) => ({
        uid: g.uid,
        displayName: state.displayNames[g.uid],
        rank: g.rank,
        points: g.points,
      })),
      waitingOn,
      leaderboard,
      lastRound: state.lastRound
        ? {
            artistUid: state.lastRound.artistUid,
            artistName: state.displayNames[state.lastRound.artistUid],
            word: state.lastRound.word,
            artistPoints: state.lastRound.artistPoints,
            guesses: state.lastRound.guesses.map((g) => ({
              uid: g.uid,
              displayName: state.displayNames[g.uid],
              rank: g.rank,
              points: g.points,
            })),
          }
        : null,
      winner: state.winner,
    };
  },

  isFinished(state: SketchState): boolean {
    return state.phase === 'game_over';
  },

  calculateResults(state: SketchState): GameResults {
    const winner = state.winner ?? 'draw';
    const players: GameResults['players'] = state.order.map((uid) => ({
      uid,
      role: 'player',
      survived: true,
      won: winner !== 'draw' && winner === uid,
    }));
    return { winner, rounds: state.totalRounds, players };
  },
};

export default sketchItEngine;
