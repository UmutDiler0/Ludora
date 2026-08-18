import type { LogEntry, Millis, Uid } from '../core/types';
import type { Alignment, RoleId } from './roles';
import type { VVConfig } from './config';

/**
 * Vampire Village state. Must stay JSON-serialisable — it is written straight
 * to the RTDB `state` node (docs/ARCHITECTURE.md §6.3).
 *
 * Hidden information (live roles, seer visions, night targets) lives here on
 * the server and is stripped by `projectFor` before it ever reaches a client.
 */

export type VVPhase =
  | 'role_reveal'
  | 'night'
  | 'day_discussion'
  | 'day_vote'
  | 'game_over';

export type EliminationCause = 'vote' | 'vampires';

export interface VVPlayer {
  uid: Uid;
  displayName: string;
  role: RoleId;
  alive: boolean;
  eliminatedRound: number | null;
  eliminatedBy: EliminationCause | null;
}

export interface VVNightAction {
  actor: Uid;
  target: Uid;
}

/** Private to the Seer. Never leaves the server for anyone else. */
export interface VVVision {
  round: number;
  target: Uid;
  targetName: string;
  alignment: Alignment;
}

export interface VVState {
  config: VVConfig;
  phase: VVPhase;
  /** 1-based. Night 1 is round 1. */
  round: number;
  deadlineAt: Millis;
  /** Stable seat order, for deterministic rendering and tie-breaks. */
  order: Uid[];
  players: Record<Uid, VVPlayer>;
  /** Role Reveal acknowledgements for the current reveal. */
  acked: Uid[];
  nightActions: Partial<Record<RoleId, VVNightAction>>;
  /** voter uid → target uid. Absent means abstained. */
  votes: Record<Uid, Uid>;
  log: LogEntry[];
  /** Seer uid → their visions. */
  visions: Record<Uid, VVVision[]>;
  winner: Alignment | null;
  /** Monotonic counter so log ids are deterministic without a clock. */
  logSeq: number;
}

export type VVAction =
  | { type: 'ACK_ROLE' }
  | { type: 'NIGHT_ACTION'; target: Uid }
  | { type: 'VOTE'; target: Uid }
  | { type: 'ABSTAIN' };

/** What a single player is allowed to see. Produced by `projectFor`. */
export interface VVPlayerView {
  phase: VVPhase;
  round: number;
  deadlineAt: Millis;
  you: {
    uid: Uid;
    role: RoleId;
    roleName: string;
    blurb: string;
    alignment: Alignment;
    alive: boolean;
  };
  players: {
    uid: Uid;
    displayName: string;
    alive: boolean;
    /** Only populated once eliminated, or when the game is over (§22.2). */
    role: RoleId | null;
  }[];
  /** Fellow vampires. Non-vampires always get null. */
  coven: Uid[] | null;
  /** True when this player has a night action available right now. */
  canActNow: boolean;
  yourNightTarget: Uid | null;
  yourVote: Uid | null;
  /** Live tally, only during day_vote. Votes are public in this game. */
  voteCounts: Record<Uid, number> | null;
  /** Only your own. */
  visions: VVVision[];
  log: LogEntry[];
  winner: Alignment | null;
}
