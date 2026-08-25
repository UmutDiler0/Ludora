import type { LogEntry, Millis, Uid } from '../core/types';
import type { ImposterConfig } from './config';

/**
 * Imposter state. Must stay JSON-serialisable — written straight to the RTDB
 * `state` node (docs/ARCHITECTURE.md §6.3), same contract as every other
 * game.
 *
 * One secret value from one category is drawn per game. Everyone but the
 * imposter is told it outright; the imposter is told only the category and
 * has to work out — or blend past — the rest. `role_reveal` is a
 * broadcast-style ack gate like Vampire Village's (everyone acks whenever
 * ready, no queue), but `voting` is a queue like Zarta's `pendingVoters`,
 * because a vote cast by whoever happens to be holding the phone next isn't a
 * vote at all.
 *
 * Deliberately one global clock, not a per-phase one: `deadlineAt` is set
 * once when discussion begins and never reset by `CALL_VOTE` or by a voter's
 * turn starting — calling a vote spends the group's shared time budget, it
 * doesn't pause it. A failed vote (wrong target, or no majority) drops back
 * to `discussion` with the same deadline still running; only a correct vote,
 * a correct guess, or the clock itself ends the game.
 */

export type ImposterPhase = 'role_reveal' | 'discussion' | 'voting' | 'game_over';

export type ImposterWinner = 'crew' | 'imposter' | 'draw';

export interface ImposterState {
  config: ImposterConfig;
  phase: ImposterPhase;
  deadlineAt: Millis;
  order: Uid[];
  displayNames: Record<Uid, string>;
  categoryId: string;
  categoryName: string;
  /** The secret value's pool id — never sent to the imposter's view. */
  valueId: string;
  /** The secret value's display text — never sent to the imposter's view. */
  valueText: string;
  /** Shuffled candidate values for the imposter to guess from, fixed for the game. */
  poolChoices: { id: string; text: string }[];
  imposterUid: Uid;
  /** Role Reveal acknowledgements — everyone acks whenever ready, like Vampire Village's. */
  acked: Uid[];
  /** True once the imposter has spent their one guess and gotten it wrong. */
  imposterGuessedWrong: boolean;
  /** Uids still to vote this round, front of the queue acts next. Empty outside `voting`. */
  pendingVoters: Uid[];
  /** voter uid → accused uid. */
  votes: Record<Uid, Uid>;
  winner: ImposterWinner | null;
  log: LogEntry[];
  logSeq: number;
}

export type ImposterAction =
  | { type: 'ACK_ROLE' }
  | { type: 'CALL_VOTE' }
  | { type: 'SUBMIT_VOTE'; target: Uid }
  | { type: 'GUESS_VALUE'; valueId: string };

/** What a single player is allowed to see. Produced by `projectFor`. */
export interface ImposterPlayerView {
  phase: ImposterPhase;
  deadlineAt: Millis;
  /** The full round budget, for rendering the countdown's progress bar
   *  relative to its starting length rather than just the seconds left. */
  discussionSeconds: number;
  you: {
    uid: Uid;
    isImposter: boolean;
    acked: boolean;
  };
  /** Not secret — the imposter is told the category too, per the game's own
   *  rules — so it's safe to expose alongside `categoryName` for the local
   *  UI to look up the public pool of candidate values from `categories.ts`. */
  categoryId: string;
  categoryName: string;
  /** The secret value — null for the imposter, always. */
  value: string | null;
  /** The imposter's own guess choices — empty for anyone else. */
  poolChoices: { id: string; text: string }[];
  imposterGuessedWrong: boolean;
  players: { uid: Uid; displayName: string }[];
  ackedCount: number;
  /** First seat in `order` that hasn't acked its role yet — null outside
   *  `role_reveal` or once everyone has. Drives the pass-the-phone sequence
   *  the same way Zarta's `pendingWriters[0]` does. */
  nextToRevealUid: Uid | null;
  currentVoterUid: Uid | null;
  currentVoterName: string | null;
  isYourTurnToVote: boolean;
  winner: ImposterWinner | null;
  /** Revealed only once the game is over — see `projectFor`. */
  imposterUidIfOver: Uid | null;
  valueIfOver: string | null;
  log: LogEntry[];
}
