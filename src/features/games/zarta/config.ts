import { err, ok, type Result } from '../core/types';

/**
 * Zarta configuration schema — same discipline as every other game's
 * config.ts (docs/ARCHITECTURE.md §14): `ZARTA_CONFIG_FIELDS` drives the Game
 * Configuration screen, `validateZartaConfig` validates it, and adding an
 * option never touches UI code.
 *
 * Two clocks rather than one, because Zarta has two very different jobs to
 * time: writing a bluff takes real thought, reading five short answers and
 * picking one does not. Round count is its own dial too — unlike Sketch It,
 * a round here doesn't map to "one turn per player", so it has no natural
 * default the way Sketch's `totalRounds = playerCount` does.
 */

export interface ZartaConfig {
  /** Seconds each player gets to write their bluff. */
  answerSeconds: number;
  /** Seconds each player gets to vote once the answers are on the table. */
  voteSeconds: number;
  /** How many questions the game plays before the final score stands. */
  totalRounds: number;
}

export const ZARTA_MIN_PLAYERS = 3;
export const ZARTA_MAX_PLAYERS = 10;

export const ZARTA_PRESETS: Record<string, ZartaConfig> = {
  quick: { answerSeconds: 25, voteSeconds: 15, totalRounds: 3 },
  classic: { answerSeconds: 30, voteSeconds: 20, totalRounds: 5 },
  marathon: { answerSeconds: 40, voteSeconds: 25, totalRounds: 8 },
};

export const DEFAULT_ZARTA_CONFIG: ZartaConfig = ZARTA_PRESETS.classic;

export const ZARTA_CONFIG_FIELDS = [
  { key: 'answerSeconds', label: 'Time to write a bluff', type: 'seconds', min: 15, max: 60 },
  { key: 'voteSeconds', label: 'Time to vote', type: 'seconds', min: 10, max: 45 },
  { key: 'totalRounds', label: 'Questions to play', type: 'int', min: 3, max: 10 },
] as const;

const isPosInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

export function validateZartaConfig(raw: unknown): Result<ZartaConfig> {
  if (typeof raw !== 'object' || raw === null) {
    return err('INVALID_CONFIG', 'Config must be an object.');
  }
  const c = raw as Partial<ZartaConfig>;

  if (!isPosInt(c.answerSeconds) || c.answerSeconds < 10) {
    return err('INVALID_CONFIG', 'answerSeconds must be at least 10.');
  }
  if (!isPosInt(c.voteSeconds) || c.voteSeconds < 10) {
    return err('INVALID_CONFIG', 'voteSeconds must be at least 10.');
  }
  if (!isPosInt(c.totalRounds) || c.totalRounds < 1) {
    return err('INVALID_CONFIG', 'totalRounds must be at least 1.');
  }

  return ok({ answerSeconds: c.answerSeconds, voteSeconds: c.voteSeconds, totalRounds: c.totalRounds });
}
