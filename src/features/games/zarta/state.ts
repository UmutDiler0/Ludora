import type { LogEntry, Millis, Uid } from '../core/types';
import type { ZartaConfig } from './config';

/**
 * Zarta state. Must stay JSON-serialisable — written straight to the RTDB
 * `state` node (docs/ARCHITECTURE.md §6.3), same contract as every other
 * game.
 *
 * Shaped differently from Taboo/Sketch It's "one active seat per round"
 * engines, because Zarta genuinely has no single active seat: every player
 * writes a bluff and every player votes, every round. `pendingWriters` and
 * `pendingVoters` are queues the engine drains one uid at a time — whoever is
 * at the front is the only one allowed to act, and everyone else is exactly
 * as blind to their answer/vote as if the phone had been physically passed,
 * because `projectFor` never includes another seat's in-progress answer or
 * anyone's vote before the round is scored.
 *
 * The one thing every option's identity hides until `round_recap`: who wrote
 * it. `authorUids` exists in state from the moment options are built (right
 * after writing ends), but `projectFor` only ever surfaces it once the round
 * is over — during `voting`, a player sees text and nothing else.
 */

export type ZartaPhase = 'writing' | 'voting' | 'round_recap' | 'game_over';

/**
 * One answer on the table. Submitted texts that normalise to the same thing
 * (including a guess that happens to land on the truth) are merged into one
 * option shared by every author who wrote it — so if it gets picked, every
 * one of them is credited, and nobody can vote for an option they helped
 * write.
 */
export interface ZartaOption {
  id: string;
  text: string;
  isCorrect: boolean;
  authorUids: Uid[];
}

export interface ZartaVoteRecord {
  voterUid: Uid;
  optionId: string;
}

/** A finished round, safe to show in full — every vote is already cast. */
export interface ZartaRoundEvent {
  question: string;
  correctAnswer: string;
  options: ZartaOption[];
  votes: ZartaVoteRecord[];
  pointsThisRound: Record<Uid, number>;
}

export type ZartaWinner = Uid | 'draw';

export interface ZartaState {
  config: ZartaConfig;
  phase: ZartaPhase;
  /** 1-based. */
  round: number;
  totalRounds: number;
  displayNames: Record<Uid, string>;
  order: Uid[];
  scores: Record<Uid, number>;
  /** Shuffled question ids still to be drawn this game. */
  deck: string[];
  /** Questions already played, reshuffled into `deck` when it runs dry. */
  discard: string[];
  currentQuestionId: string | null;
  /** Uids still to submit a bluff this round, front of the queue acts next. */
  pendingWriters: Uid[];
  /** Raw submitted text, filled in as each writer finishes. */
  answers: Record<Uid, string>;
  /** Built once writing ends; null for the whole `writing` phase. */
  options: ZartaOption[] | null;
  /** Uids still to vote this round, front of the queue acts next. */
  pendingVoters: Uid[];
  votes: ZartaVoteRecord[];
  /** Whether the player at the front of the active queue has confirmed
   *  they're looking at the screen and started their own clock (`READY`).
   *  False the instant a new writer/voter reaches the front — the "pass the
   *  phone" moment shouldn't eat into their time, the same reason Taboo's
   *  clock doesn't start until the describer taps "start" themselves. */
  turnStarted: boolean;
  /** The current writer's or voter's own deadline. Only meaningful once
   *  `turnStarted` is true. */
  deadlineAt: Millis;
  /** The round that just ended, held for the recap screen. */
  lastRound: ZartaRoundEvent | null;
  log: LogEntry[];
  logSeq: number;
  /** Set the moment the final round ends, one phase before `game_over` is
   *  actually shown — see `endRound` in engine.ts for why. */
  winner: ZartaWinner | null;
}

export type ZartaAction =
  /** The player at the front of the active queue confirms they're looking
   *  at the screen — starts their own clock. */
  | { type: 'READY' }
  | { type: 'SUBMIT_ANSWER'; text: string }
  | { type: 'SUBMIT_VOTE'; optionId: string }
  | { type: 'CONTINUE' };

/** What a single player is allowed to see. Produced by `projectFor`. */
export interface ZartaPlayerView {
  phase: ZartaPhase;
  round: number;
  totalRounds: number;
  /** Only meaningful once `turnStarted` is true. */
  deadlineAt: Millis;
  /** Whether the active seat's clock has started — see `ZartaState`'s own
   *  field for why this exists. False means show the "pass the phone"
   *  curtain, not a countdown. */
  turnStarted: boolean;
  answerSeconds: number;
  voteSeconds: number;
  question: string;
  you: { uid: Uid };
  /** Whoever's turn it is to write right now — null outside `writing`. */
  currentWriterUid: Uid | null;
  currentWriterName: string | null;
  isYourTurnToWrite: boolean;
  /** Whoever's turn it is to vote right now — null outside `voting`. */
  currentVoterUid: Uid | null;
  currentVoterName: string | null;
  isYourTurnToVote: boolean;
  /** This voter's own choices — shuffled, text only, anything they helped
   *  author already excluded. Empty outside `voting`. */
  voteChoices: { id: string; text: string }[];
  leaderboard: { uid: Uid; displayName: string; score: number }[];
  lastRound: {
    question: string;
    correctAnswer: string;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
      authorNames: string[];
      voterNames: string[];
    }[];
    pointsThisRound: { uid: Uid; displayName: string; points: number }[];
  } | null;
  winner: ZartaWinner | null;
}
