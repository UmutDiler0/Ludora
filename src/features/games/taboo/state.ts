import type { LogEntry, Millis, Uid } from '../core/types';
import type { TabooConfig } from './config';

/**
 * Taboo state. Must stay JSON-serialisable — written straight to the RTDB
 * `state` node (docs/ARCHITECTURE.md §6.3), same contract as Vampire Village.
 *
 * The hidden information is one thing: the current card. `projectFor` (§9.1)
 * only ever puts it in the describer's own view — everyone else is guessing
 * out loud in the room, and the app must never be the thing that spoils it.
 */

export type TabooTeamId = 'A' | 'B';
export type TabooPhase = 'turn_intro' | 'describing' | 'turn_recap' | 'game_over';
export type TabooCardResult = 'correct' | 'tabu' | 'skip';
export type TabooWinner = TabooTeamId | 'draw';

export interface TabooTeam {
  id: TabooTeamId;
  name: string;
  score: number;
  memberUids: Uid[];
  /** Index into `memberUids` of who describes next time this team is up. */
  nextDescriberIndex: number;
}

/** One card as it was resolved. Safe to show once the turn is over — by then
 *  the whole room has already heard it said out loud. */
export interface TabooTurnEvent {
  cardId: string;
  word: string;
  result: TabooCardResult;
}

export interface TabooState {
  config: TabooConfig;
  phase: TabooPhase;
  /** 1-based, counts individual turns across both teams (not full rounds). */
  turn: number;
  /** Display names, indexed by uid. Kept separate from `TabooTeam` (which
   *  only carries ids) so team membership stays a plain list to shuffle,
   *  reorder and round-robin through without dragging identity along. */
  displayNames: Record<Uid, string>;
  teams: Record<TabooTeamId, TabooTeam>;
  activeTeam: TabooTeamId;
  describerUid: Uid;
  /** Shuffled card ids still to be drawn this game. */
  deck: string[];
  /** Cards already played, reshuffled into `deck` when it runs dry. */
  discard: string[];
  currentCardId: string | null;
  skipsUsed: number;
  deadlineAt: Millis;
  /** This turn's results so far, oldest first. Cleared when a new turn starts. */
  turnEvents: TabooTurnEvent[];
  /** The turn that just ended, held for the recap screen. */
  lastTurnTeam: TabooTeamId | null;
  lastTurnGained: number;
  lastTurnEvents: TabooTurnEvent[];
  log: LogEntry[];
  logSeq: number;
  /** Set the moment a turn ends the game, one phase before `game_over` is
   *  actually shown — see `resolveTurnEnd` in engine.ts for why. */
  winner: TabooWinner | null;
}

export type TabooAction =
  | { type: 'START_TURN' }
  | { type: 'MARK'; result: TabooCardResult }
  | { type: 'CONTINUE' };

/** What a single player is allowed to see. Produced by `projectFor`. */
export interface TabooPlayerView {
  phase: TabooPhase;
  turn: number;
  deadlineAt: Millis;
  teams: {
    id: TabooTeamId;
    name: string;
    score: number;
    members: { uid: Uid; displayName: string }[];
  }[];
  activeTeam: TabooTeamId;
  describerUid: Uid;
  describerName: string;
  you: { uid: Uid; team: TabooTeamId };
  isDescriber: boolean;
  /** Only populated for the describer, and only once the turn is live. */
  card: { word: string; forbidden: string[] } | null;
  skipsUsed: number;
  skipLimit: number;
  /** The configured turn length, so the clock's progress bar reads against the
   *  actual round length rather than an assumed constant. */
  roundSeconds: number;
  /** The describer's own scrollback for this turn. Empty for everyone else —
   *  not a secret, just noise nobody else needs mid-turn. */
  turnEvents: TabooTurnEvent[];
  lastTurn: { team: TabooTeamId; gained: number; events: TabooTurnEvent[] } | null;
  targetScore: number;
  winner: TabooWinner | null;
}
