/**
 * Core game-engine contract. See docs/ARCHITECTURE.md §9.
 *
 * Everything in this file and in every engine implementing it is PURE:
 * no Firebase, no React, no Date.now(), no Math.random(). Time and randomness
 * arrive through EngineCtx so that a game can be replayed deterministically
 * from its seed plus its action log — which is how the server validates a
 * client-reported result (§10.4).
 */

export type Uid = string;
export type Millis = number;
export type GameId = 'vampireVillage' | 'taboo' | 'zarta' | 'story' | 'detective' | 'drawingGuess';

/** Deterministic random source. Injected — never Math.random(). */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
}

export interface PlayerSeat {
  uid: Uid;
  displayName: string;
  /**
   * Optional team hint for games with a fixed team structure (Taboo). Games
   * without teams (Vampire Village) never read it. It lives on the shared
   * seat shape rather than a per-game wrapper so one roster serves every
   * game's `createInitialState`, the same way `displayName` already does —
   * a team-based engine honours it when every seat carries one and falls
   * back to its own default split otherwise.
   */
  team?: string;
}

export interface EngineCtx {
  /** The player this action is attributed to. */
  uid: Uid;
  /** Server time. Injected — never Date.now(). */
  now: Millis;
  rng: Rng;
}

export type EngineErrorCode =
  | 'WRONG_PHASE'
  | 'NOT_YOUR_TURN'
  | 'NOT_A_PLAYER'
  | 'PLAYER_ELIMINATED'
  | 'INVALID_TARGET'
  | 'ALREADY_ACTED'
  | 'INVALID_CONFIG'
  | 'NOT_ENOUGH_PLAYERS'
  | 'TOO_MANY_PLAYERS';

export interface EngineError {
  code: EngineErrorCode;
  message: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T>(code: EngineErrorCode, message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});

/** One entry in the public, all-players-can-see event log (the Game Log screen). */
export interface LogEntry {
  id: string;
  round: number;
  at: Millis;
  /** Rendered per the §22.2 disclosure policy. Never contains hidden information. */
  text: string;
  kind: string;
}

export interface GameMeta {
  minPlayers: number;
  maxPlayers: number;
  isPremium: boolean;
}

export interface PlayerResult {
  uid: Uid;
  won: boolean;
  /** Role id at game end. Safe to expose — the game is over. */
  role: string;
  survived: boolean;
}

export interface GameResults {
  winner: string;
  players: PlayerResult[];
  rounds: number;
}

/**
 * The contract every game implements. TState must be JSON-serialisable —
 * it is written straight to RTDB.
 */
export interface GameEngine<TState, TConfig, TAction, TView> {
  readonly id: GameId;
  readonly meta: GameMeta;

  validateConfig(config: unknown): Result<TConfig>;

  createInitialState(players: PlayerSeat[], config: TConfig, rng: Rng, now: Millis): Result<TState>;

  /** Pure reducer. Same inputs always produce the same output. */
  reduce(state: TState, action: TAction, ctx: EngineCtx): Result<TState>;

  /** Deadline-driven transitions. Called on a timer; must be idempotent for a given `now`. */
  tick(state: TState, now: Millis): TState;

  /**
   * What this player is allowed to see. The anti-cheat primitive (§9.1) —
   * a client can never read what was never sent to it.
   */
  projectFor(state: TState, uid: Uid): TView;

  isFinished(state: TState): boolean;

  calculateResults(state: TState): GameResults;
}
