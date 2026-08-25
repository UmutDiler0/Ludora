import type { GameId } from '@/features/games/core/types';
import type { GameMode } from '@/features/games/core/registry';

/**
 * Game names, categories, and mode labels — moved out of `registry.ts` so
 * they can vary by locale. `registry.ts`'s `GameId` stays the stable
 * identifier everywhere else in the codebase (routes, content decks,
 * `HOW_TO_PLAY` keys); only the human-facing label lives here.
 */
export const catalogue = {
  name: {
    vampireVillage: 'Vampire Village',
    taboo: 'Taboo Words',
    drawingGuess: 'Sketch It',
    zarta: 'Zarta',
    story: 'Complete the Story',
    detective: 'Detective',
    agent: 'Agent',
    imposter: 'Imposter',
  } satisfies Record<GameId, string>,
  category: {
    vampireVillage: 'Social Deduction',
    taboo: 'Word Game',
    drawingGuess: 'Drawing',
    zarta: 'Party',
    story: 'Creative',
    detective: 'Mystery',
    agent: 'Social Deduction',
    imposter: 'Social Deduction',
  } satisfies Record<GameId, string>,
  mode: {
    local: 'Local',
    online: 'Online',
  } satisfies Record<GameMode, string>,
};
