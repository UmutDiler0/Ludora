import { err, ok, type Result } from '../core/types';

/**
 * Imposter configuration schema — same discipline as every other game's
 * config.ts (docs/ARCHITECTURE.md §14): `IMPOSTER_CONFIG_FIELDS` drives the
 * Game Configuration screen, `validateImposterConfig` validates it.
 *
 * One dial only: the single shared clock covers discussion and voting both
 * (see engine.ts's file header for why there's no separate vote timer) — the
 * user's own spec calls it out as one 5-minute budget, not two.
 */

export interface ImposterConfig {
  /** Seconds the whole round gets, start to finish. */
  discussionSeconds: number;
}

export const IMPOSTER_MIN_PLAYERS = 4;
export const IMPOSTER_MAX_PLAYERS = 10;

export const IMPOSTER_PRESETS: Record<string, ImposterConfig> = {
  quick: { discussionSeconds: 180 },
  classic: { discussionSeconds: 300 },
  extended: { discussionSeconds: 420 },
};

export const DEFAULT_IMPOSTER_CONFIG: ImposterConfig = IMPOSTER_PRESETS.classic;

export const IMPOSTER_CONFIG_FIELDS = [
  { key: 'discussionSeconds', label: 'Time to find the imposter', type: 'seconds', min: 60, max: 600 },
] as const;

const isPosInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

export function validateImposterConfig(raw: unknown): Result<ImposterConfig> {
  if (typeof raw !== 'object' || raw === null) {
    return err('INVALID_CONFIG', 'Config must be an object.');
  }
  const c = raw as Partial<ImposterConfig>;

  if (!isPosInt(c.discussionSeconds) || c.discussionSeconds < 30) {
    return err('INVALID_CONFIG', 'discussionSeconds must be at least 30.');
  }

  return ok({ discussionSeconds: c.discussionSeconds });
}
