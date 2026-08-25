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
export interface GameCatalogueEntry {
  id: GameId;
  name: string;
  category: string;
  isPremium: boolean;
  enabled: boolean;
  minPlayers: number;
  maxPlayers: number;
}

export const GAME_CATALOGUE: GameCatalogueEntry[] = [
  {
    id: 'vampireVillage',
    name: 'Vampire Village',
    category: 'Social Deduction',
    isPremium: false,
    enabled: true,
    minPlayers: 4,
    maxPlayers: 12,
  },
  {
    id: 'taboo',
    name: 'Taboo Words',
    category: 'Word Game',
    isPremium: false,
    enabled: true,
    minPlayers: 4,
    maxPlayers: 8,
  },
  {
    id: 'drawingGuess',
    name: 'Sketch It',
    category: 'Drawing',
    isPremium: true,
    enabled: true,
    minPlayers: 3,
    maxPlayers: 8,
  },
  {
    id: 'zarta',
    name: 'Zarta',
    category: 'Party',
    isPremium: false,
    enabled: true,
    minPlayers: 3,
    maxPlayers: 10,
  },
  {
    id: 'story',
    name: 'Complete the Story',
    category: 'Creative',
    isPremium: false,
    enabled: false,
    minPlayers: 3,
    maxPlayers: 10,
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
    name: 'Detective',
    category: 'Mystery',
    isPremium: false,
    enabled: true,
    minPlayers: 1,
    maxPlayers: 6,
  },
];
