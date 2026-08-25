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
 *   taglines      → `game_definitions/{gameId}` (Firestore, §9.2)
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
  /** One-line hook shown under the title. */
  tagline: string;
  /** Live player count. Real source: the RTDB presence counter. */
  playersNow: number;
}

/**
 * Taglines belong to `game_definitions` once Firestore exists; they live here
 * only so the cards are not blank in the meantime.
 */
const TAGLINES: Record<GameId, string> = {
  vampireVillage: 'Trust nobody. Someone at this table feeds at night.',
  taboo: 'Describe the word without ever saying the word.',
  drawingGuess: 'Draw badly, guess fast, argue about it afterwards.',
  zarta: 'Quick-fire rounds where hesitating costs you everything.',
  // Rewritten to match the redefined mechanic (a purchased fragment, not a
  // round-robin sentence game) — see features/games/story/stories.ts.
  story: 'One or two sentences is all you get. Uncover the rest.',
  detective: 'Read the room, follow the evidence, name the culprit.',
  agentImposter: 'Everyone claims to be an agent. Not everyone is telling the truth.',
};

/** Fake presence counts. Stable per game so the UI does not flicker. */
const PLAYERS_NOW: Record<GameId, number> = {
  vampireVillage: 128,
  taboo: 342,
  drawingGuess: 87,
  zarta: 64,
  story: 41,
  detective: 96,
  agentImposter: 19,
};

/**
 * Trending strip. Enabled games sort first — a playable game should never
 * rank below one the player cannot open, however busy it looks.
 */
export function trendingGames(): TrendingGame[] {
  return GAME_CATALOGUE.map((game) => ({
    ...game,
    tagline: TAGLINES[game.id],
    playersNow: PLAYERS_NOW[game.id],
  })).sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return b.playersNow - a.playersNow;
  });
}
