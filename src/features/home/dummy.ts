import { GAME_CATALOGUE, type GameCatalogueEntry } from '@/features/games/core/registry';
import type { GameId } from '@/features/games/core/types';

/**
 * Placeholder data for the Home dashboard.
 *
 * ⚠️ Everything exported here is fake and deliberately quarantined in one file.
 * Each block names the real source it stands in for, so replacing it is a
 * single import change per section rather than a hunt through the screen:
 *
 *   champions     → `leaderboards/daily` (Firestore, §8 scheduled job)
 *   playersNow    → `presence/{gameId}` (RTDB counter, §12)
 *
 * Taglines used to live here too, but a locale-dependent string can't be
 * baked into a plain object at module-load time — they moved to
 * `i18n/en(or tr)/home.ts`'s `tagline` map, read reactively by `TrendingCard`
 * at render time instead. Once `game_definitions/{gameId}` is real, both this
 * file's counters and that map's source change, not the screen.
 *
 * The screen imports only these functions, never literals, so nothing in the
 * UI has to change when the data becomes real.
 */

export interface Champion {
  rank: 1 | 2 | 3;
  uid: string;
  displayName: string;
  /** Leaderboard score for the current daily period. */
  score: number;
}

/**
 * Top three of today's board. Real source: the `leaderboards/daily` document
 * written by the scheduled aggregation job.
 */
export const DUMMY_CHAMPIONS: Champion[] = [
  { rank: 1, uid: 'u_blazequeen', displayName: 'BlazeQueen', score: 12_480 },
  { rank: 2, uid: 'u_shadowninja', displayName: 'ShadowNinja', score: 11_905 },
  { rank: 3, uid: 'u_trashpanda', displayName: 'TrashPanda', score: 10_240 },
];

export interface TrendingGame extends GameCatalogueEntry {
  /** Live player count. Real source: the RTDB presence counter. */
  playersNow: number;
}

/** Fake presence counts. Stable per game so the UI does not flicker. */
const PLAYERS_NOW: Record<GameId, number> = {
  vampireVillage: 128,
  taboo: 342,
  drawingGuess: 87,
  zarta: 64,
  story: 41,
  detective: 96,
  agent: 12,
  imposter: 9,
};

/**
 * Trending strip. Enabled games sort first — a playable game should never
 * rank below one the player cannot open, however busy it looks.
 */
export function trendingGames(): TrendingGame[] {
  return GAME_CATALOGUE.map((game) => ({
    ...game,
    playersNow: PLAYERS_NOW[game.id],
  })).sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return b.playersNow - a.playersNow;
  });
}
