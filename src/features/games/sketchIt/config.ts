import { err, ok, type Result } from '../core/types';

/**
 * Sketch It configuration schema — same discipline as Taboo's and Vampire
 * Village's config.ts (docs/ARCHITECTURE.md §14): `SKETCH_CONFIG_FIELDS`
 * drives the Game Configuration screen, `validateSketchConfig` validates it,
 * and adding an option never touches UI code.
 *
 * Only one rule to configure — how long each artist gets — which is exactly
 * the "drawing minute" dial that was asked for. Player count is not part of
 * this config: it lives on the roster the setup screen builds, the same
 * split every other game's config keeps.
 */

export interface SketchConfig {
  /** Seconds each artist gets to draw before the round ends. */
  roundSeconds: number;
}

export const SKETCH_MIN_PLAYERS = 3;
export const SKETCH_MAX_PLAYERS = 8;

export const SKETCH_PRESETS: Record<string, SketchConfig> = {
  quick: { roundSeconds: 60 },
  classic: { roundSeconds: 90 },
  marathon: { roundSeconds: 150 },
};

export const DEFAULT_SKETCH_CONFIG: SketchConfig = SKETCH_PRESETS.classic;

export const SKETCH_CONFIG_FIELDS = [
  { key: 'roundSeconds', label: 'Drawing time', type: 'seconds', min: 30, max: 180 },
] as const;

const isPosInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

export function validateSketchConfig(raw: unknown): Result<SketchConfig> {
  if (typeof raw !== 'object' || raw === null) {
    return err('INVALID_CONFIG', 'Config must be an object.');
  }
  const c = raw as Partial<SketchConfig>;

  if (!isPosInt(c.roundSeconds) || c.roundSeconds < 15) {
    return err('INVALID_CONFIG', 'roundSeconds must be at least 15.');
  }

  return ok({ roundSeconds: c.roundSeconds });
}
