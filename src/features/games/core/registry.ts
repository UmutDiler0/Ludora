import type { GameId } from './types';

/**
 * Game registry (docs/ARCHITECTURE.md §9.2).
 *
 * Adding a game is: write the engine, write its config schema, add screens,
 * add one line here, add a `game_definitions/{gameId}` document. Nothing in
 * rooms, lobby, matchmaking or economy changes.
 *
 * Engines are lazily imported so a session only loads the game it is playing.
 */
export const GAME_REGISTRY = {
  vampireVillage: () => import('../vampireVillage/engine'),
  taboo: () => import('../taboo/engine'),
  drawingGuess: () => import('../sketchIt/engine'),
  zarta: () => import('../zarta/engine'),
  imposter: () => import('../imposter/engine'),
} as const satisfies Partial<Record<GameId, () => Promise<unknown>>>;

export type RegisteredGameId = keyof typeof GAME_REGISTRY;

export const isRegistered = (id: string): id is RegisteredGameId => id in GAME_REGISTRY;

/**
 * Catalogue metadata mirrored from `game_definitions`. Kept here so the
 * client can render the browser and selection screens before Firestore
 * exists; Firestore is authoritative once it does.
 *
 * Premium flags follow decisions D7–D9 (§21):
 *   Vampire Village free · Sketch It premium · Trivia Blitz registered but off.
 */

/**
 * Which way a game is actually played. Independent of `enabled` — a game can
 * be built and still only ever local (Taboo's forbidden list only stays
 * secret because it's one shared device), the same way a game can be
 * designed online-only before any online infrastructure exists (Sketch It,
 * Zarta): the label states intent, not what's shipped, matching every other
 * catalogue field here (`isPremium` predates a paywall, `minPlayers` predates
 * a lobby).
 */
export type GameMode = 'local' | 'online';

/**
 * `name` and `category` used to live here as plain strings; they moved to
 * `i18n/en/catalogue.ts` (and its `tr` counterpart) once the app needed more
 * than one language, keyed by `id` the same way `GAME_MODE_LABEL` used to key
 * mode labels before that moved too. This interface stays the single source
 * of truth for everything that isn't locale-dependent.
 */
export interface GameCatalogueEntry {
  id: GameId;
  isPremium: boolean;
  enabled: boolean;
  minPlayers: number;
  maxPlayers: number;
  modes: GameMode[];
}

export const GAME_CATALOGUE: GameCatalogueEntry[] = [
  {
    id: 'vampireVillage',
    isPremium: false,
    enabled: true,
    minPlayers: 4,
    maxPlayers: 12,
    modes: ['local', 'online'],
  },
  {
    id: 'taboo',
    isPremium: false,
    enabled: true,
    minPlayers: 4,
    maxPlayers: 8,
    modes: ['local'],
  },
  {
    id: 'drawingGuess',
    isPremium: true,
    enabled: true,
    minPlayers: 3,
    maxPlayers: 8,
    modes: ['online'],
  },
  {
    id: 'zarta',
    isPremium: false,
    enabled: true,
    minPlayers: 3,
    maxPlayers: 10,
    modes: ['online'],
  },
  {
    // Not in GAME_REGISTRY — like Detective, this is a content-driven game
    // (a fragment to read, not a stateful engine), so it routes straight to
    // /complete-the-story instead of a setup screen.
    id: 'story',
    isPremium: false,
    enabled: true,
    minPlayers: 1,
    maxPlayers: 10,
    modes: ['local'],
  },
  {
    // Not in GAME_REGISTRY on purpose — Detective is cooperative, not a
    // competitive engine like the other four: no rounds, no scoring, no
    // config screen, just a case to read and solve together. It routes
    // straight to /detective-stories instead of a setup screen (see
    // Play.tsx's and Home's routing). `isPremium` is false at this level
    // because opening the game is free; individual cases carry their own
    // free/paid flag instead (features/games/detective/stories.ts).
    id: 'detective',
    isPremium: false,
    enabled: true,
    minPlayers: 1,
    maxPlayers: 6,
    modes: ['local'],
  },
  {
    // Two separate catalogue entries, not one game with two roles — Agent
    // and Imposter are different games (corrected from an earlier combined
    // "Agent & Imposter" entry). Agent still has no rules and no
    // GAME_REGISTRY entry — only the catalogue entry and key art exist so
    // far. Category/headcount/modes are placeholders until real rules land.
    id: 'agent',
    isPremium: false,
    enabled: false,
    minPlayers: 5,
    maxPlayers: 10,
    modes: ['local', 'online'],
  },
  {
    // Real rules, real engine (features/games/imposter). One category, one
    // secret value; everyone but the imposter is told it. Pass-and-play on
    // one device the same way Taboo and Zarta are, hence `local` only —
    // there's no networked lobby for it yet.
    id: 'imposter',
    isPremium: false,
    enabled: true,
    minPlayers: 4,
    maxPlayers: 10,
    modes: ['local'],
  },
];
