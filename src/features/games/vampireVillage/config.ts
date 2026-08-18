import { err, ok, type Result } from '../core/types';

/**
 * Vampire Village configuration schema.
 *
 * Spec §14 requires per-game config rather than one universal screen. This
 * module is the schema: the Game Configuration route renders from `VV_CONFIG_FIELDS`
 * and validates through `validateConfig`, so adding an option never touches UI code.
 */

export interface VVConfig {
  /** 0 means "derive from player count". */
  vampireCount: number;
  enableSeer: boolean;
  enableBodyguard: boolean;
  /** Seconds. The Lobby's "Turns: 60s" chip is `night`. */
  durations: {
    roleReveal: number;
    night: number;
    dayDiscussion: number;
    dayVote: number;
  };
  maxRounds: number;
}

export const VV_MIN_PLAYERS = 4;
export const VV_MAX_PLAYERS = 12;

/** "Roles: Classic" in the Multiplayer Lobby design. */
export const VV_PRESETS: Record<string, VVConfig> = {
  classic: {
    vampireCount: 0,
    enableSeer: true,
    enableBodyguard: true,
    durations: { roleReveal: 15, night: 60, dayDiscussion: 120, dayVote: 45 },
    maxRounds: 12,
  },
  quick: {
    vampireCount: 0,
    enableSeer: true,
    enableBodyguard: false,
    durations: { roleReveal: 10, night: 30, dayDiscussion: 60, dayVote: 30 },
    maxRounds: 8,
  },
};

export const DEFAULT_VV_CONFIG: VVConfig = VV_PRESETS.classic;

/** Drives the dynamic Game Configuration screen (spec §14). */
export const VV_CONFIG_FIELDS = [
  { key: 'vampireCount', label: 'Vampires', type: 'int', min: 0, max: 4, hint: '0 = automatic' },
  { key: 'enableSeer', label: 'Include Seer', type: 'bool' },
  { key: 'enableBodyguard', label: 'Include Bodyguard', type: 'bool' },
  { key: 'durations.night', label: 'Night length', type: 'seconds', min: 15, max: 180 },
  { key: 'durations.dayDiscussion', label: 'Discussion length', type: 'seconds', min: 30, max: 300 },
  { key: 'durations.dayVote', label: 'Voting length', type: 'seconds', min: 15, max: 120 },
  { key: 'maxRounds', label: 'Round limit', type: 'int', min: 3, max: 20 },
] as const;

/**
 * Vampire count when config leaves it automatic: roughly a quarter of the
 * table, at least one, and always leaving the village in the majority at
 * the start (otherwise the game is over before it begins).
 */
export function autoVampireCount(playerCount: number): number {
  return Math.max(1, Math.min(Math.floor(playerCount / 4), Math.floor((playerCount - 1) / 2)));
}

const isPosInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

export function validateVVConfig(raw: unknown): Result<VVConfig> {
  if (typeof raw !== 'object' || raw === null) {
    return err('INVALID_CONFIG', 'Config must be an object.');
  }
  const c = raw as Partial<VVConfig>;
  const d = c.durations;

  if (!isPosInt(c.vampireCount) || c.vampireCount > 4) {
    return err('INVALID_CONFIG', 'vampireCount must be an integer between 0 and 4.');
  }
  if (typeof c.enableSeer !== 'boolean' || typeof c.enableBodyguard !== 'boolean') {
    return err('INVALID_CONFIG', 'enableSeer and enableBodyguard must be booleans.');
  }
  if (!d || !isPosInt(d.roleReveal) || !isPosInt(d.night) || !isPosInt(d.dayDiscussion) || !isPosInt(d.dayVote)) {
    return err('INVALID_CONFIG', 'All durations must be non-negative integers (seconds).');
  }
  if (d.night < 10 || d.dayVote < 10) {
    return err('INVALID_CONFIG', 'Night and voting phases must be at least 10 seconds.');
  }
  if (!isPosInt(c.maxRounds) || c.maxRounds < 3 || c.maxRounds > 20) {
    return err('INVALID_CONFIG', 'maxRounds must be between 3 and 20.');
  }

  return ok({
    vampireCount: c.vampireCount,
    enableSeer: c.enableSeer,
    enableBodyguard: c.enableBodyguard,
    durations: {
      roleReveal: d.roleReveal,
      night: d.night,
      dayDiscussion: d.dayDiscussion,
      dayVote: d.dayVote,
    },
    maxRounds: c.maxRounds,
  });
}
