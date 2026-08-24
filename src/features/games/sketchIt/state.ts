import type { LogEntry, Millis, Uid } from '../core/types';
import type { SketchConfig } from './config';

/**
 * Sketch It state. Must stay JSON-serialisable — written straight to the
 * RTDB `state` node (docs/ARCHITECTURE.md §6.3), same contract as Vampire
 * Village and Taboo.
 *
 * Deliberately absent: the drawing itself. Strokes are ephemeral, local-only
 * UI state (see screens/Canvas.tsx) rather than part of the engine — the
 * game's outcome never depends on the pixels, only on who guessed and in
 * what order, so there is nothing here for a replay to need. A real
 * multiplayer build would stream strokes over their own realtime channel, the
 * same way chat got its own RTDB path instead of living on this state node
 * (docs/firebase.md §4.1) — not a fact this engine needs to know.
 *
 * The hidden information is one thing: the current prompt, and only for as
 * long as the artist is meant to be memorising it. `projectFor` only ever
 * puts the word in the artist's own view, and only during `round_intro` —
 * once drawing starts nobody's screen shows the word at all, artist included,
 * because every seat is watching the same physical device draw it and the
 * app must never be the thing that spoils it for the room.
 */

export type SketchPhase = 'round_intro' | 'drawing' | 'round_recap' | 'game_over';

/** One correct guess, in the order the artist called it out. Rank drives the
 *  gartic.io-style decaying point value — first guess is worth the most. */
export interface SketchGuess {
  uid: Uid;
  rank: number;
  points: number;
}

/** A finished round, safe to show in full — the whole room already watched
 *  it happen live. */
export interface SketchRoundEvent {
  artistUid: Uid;
  word: string;
  guesses: SketchGuess[];
  artistPoints: number;
}

export type SketchWinner = Uid | 'draw';

export interface SketchState {
  config: SketchConfig;
  phase: SketchPhase;
  /** 1-based, one round per player — see `totalRounds`. */
  round: number;
  totalRounds: number;
  /** Display names, indexed by uid. */
  displayNames: Record<Uid, string>;
  /** Draw order for the whole game, decided once at kickoff. */
  order: Uid[];
  scores: Record<Uid, number>;
  artistUid: Uid;
  /** Shuffled prompt ids still to be drawn this game. */
  deck: string[];
  /** Prompts already played, reshuffled into `deck` when it runs dry. */
  discard: string[];
  currentPromptId: string | null;
  deadlineAt: Millis;
  /** This round's guesses so far, oldest first. Cleared when a new round starts. */
  guesses: SketchGuess[];
  /** The round that just ended, held for the recap screen. */
  lastRound: SketchRoundEvent | null;
  log: LogEntry[];
  logSeq: number;
  /** Set the moment the final round ends, one phase before `game_over` is
   *  actually shown — see `endRound` in engine.ts for why. */
  winner: SketchWinner | null;
}

export type SketchAction =
  | { type: 'START_ROUND' }
  | { type: 'MARK_GUESS'; uid: Uid }
  | { type: 'CONTINUE' };

/** What a single player is allowed to see. Produced by `projectFor`. */
export interface SketchPlayerView {
  phase: SketchPhase;
  round: number;
  totalRounds: number;
  deadlineAt: Millis;
  roundSeconds: number;
  artistUid: Uid;
  artistName: string;
  you: { uid: Uid };
  isArtist: boolean;
  /** Only populated for the artist, and only during `round_intro`. */
  word: string | null;
  /** This round's correct guesses so far, in the order they were marked. */
  guessers: { uid: Uid; displayName: string; rank: number; points: number }[];
  /** Everyone still eligible to guess this round — the artist's tap targets. */
  waitingOn: { uid: Uid; displayName: string }[];
  leaderboard: { uid: Uid; displayName: string; score: number }[];
  lastRound: {
    artistUid: Uid;
    artistName: string;
    word: string;
    artistPoints: number;
    guesses: { uid: Uid; displayName: string; rank: number; points: number }[];
  } | null;
  winner: SketchWinner | null;
}
