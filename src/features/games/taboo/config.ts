import { err, ok, type Result } from '../core/types';

/**
 * Taboo configuration schema — same discipline as Vampire Village's config.ts
 * (docs/ARCHITECTURE.md §14): `TABOO_CONFIG_FIELDS` drives a future Game
 * Configuration screen, `validateTabooConfig` validates it, and adding an
 * option never touches UI code.
 */

export interface TabooConfig {
  /** Seconds the describer gets per turn. */
  roundSeconds: number;
  /** Skips allowed per turn — the request that started this game. */
  skipLimit: number;
  /** First team to reach this score wins outright. */
  targetScore: number;
  /** Safety cap: if nobody reaches `targetScore`, the higher score wins here. */
  maxTurns: number;
}

export const TABOO_MIN_PLAYERS = 4;
export const TABOO_MAX_PLAYERS = 8;

export const TABOO_PRESETS: Record<string, TabooConfig> = {
  classic: { roundSeconds: 60, skipLimit: 3, targetScore: 30, maxTurns: 16 },
  quick: { roundSeconds: 45, skipLimit: 2, targetScore: 20, maxTurns: 12 },
};

export const DEFAULT_TABOO_CONFIG: TabooConfig = TABOO_PRESETS.classic;

export const TABOO_CONFIG_FIELDS = [
  { key: 'roundSeconds', label: 'Round length', type: 'seconds', min: 30, max: 120 },
  { key: 'skipLimit', label: 'Skips per turn', type: 'int', min: 0, max: 6 },
  { key: 'targetScore', label: 'Points to win', type: 'int', min: 10, max: 60 },
  { key: 'maxTurns', label: 'Turn limit', type: 'int', min: 4, max: 30 },
] as const;

const isPosInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

export function validateTabooConfig(raw: unknown): Result<TabooConfig> {
  if (typeof raw !== 'object' || raw === null) {
    return err('INVALID_CONFIG', 'Config must be an object.');
  }
  const c = raw as Partial<TabooConfig>;

  if (!isPosInt(c.roundSeconds) || c.roundSeconds < 15) {
    return err('INVALID_CONFIG', 'roundSeconds must be at least 15.');
  }
  if (!isPosInt(c.skipLimit)) {
    return err('INVALID_CONFIG', 'skipLimit must be a non-negative integer.');
  }
  if (!isPosInt(c.targetScore) || c.targetScore < 1) {
    return err('INVALID_CONFIG', 'targetScore must be a positive integer.');
  }
  if (!isPosInt(c.maxTurns) || c.maxTurns < 2) {
    return err('INVALID_CONFIG', 'maxTurns must be at least 2, one per team.');
  }

  return ok({
    roundSeconds: c.roundSeconds,
    skipLimit: c.skipLimit,
    targetScore: c.targetScore,
    maxTurns: c.maxTurns,
  });
}
