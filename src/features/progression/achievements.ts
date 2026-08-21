/**
 * Achievements (docs/ARCHITECTURE.md §22.5, §24).
 *
 * Pure: definitions plus functions over a snapshot of the player's counters.
 * No store, no clock, no Firebase — the same rule the game engines follow, and
 * for the same reason. When Cloud Functions own the economy, the server runs
 * exactly this file to decide what unlocked, so client and server can never
 * disagree about whether someone earned a crown.
 */

/**
 * Every counter an achievement can be measured against.
 *
 * A metric is a key of this snapshot rather than a free string, so a typo in a
 * definition is a compile error instead of an achievement that silently never
 * unlocks.
 */
export interface ProgressSnapshot {
  level: number;
  gamesPlayed: number;
  gamesWon: number;
  dailyStreak: number;
  questsCompleted: number;
}

export type AchievementMetric = keyof ProgressSnapshot;

/** Rarity tiers, matching the designed LEGENDARY / EPIC / RARE / COMMON chips. */
export type AchievementTier = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  /** Ionicons glyph name. Kept as a string so this module imports nothing. */
  icon: string;
  tier: AchievementTier;
  metric: AchievementMetric;
  target: number;
  gold: number;
  xp: number;
  /**
   * Cosmetic granted on unlock. Items referenced here are priced 0 and carry
   * `unlockedBy` in the avatar catalogue, so the shop never offers them —
   * earning is the only way in.
   */
  itemId?: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // First steps
  { id: 'first_game', name: 'First Blood', description: 'Finish your first game.', icon: 'flag', tier: 'common', metric: 'gamesPlayed', target: 1, gold: 50, xp: 25 },
  { id: 'first_win', name: 'Winner', description: 'Win your first game.', icon: 'trophy', tier: 'common', metric: 'gamesWon', target: 1, gold: 75, xp: 40 },

  // Volume
  { id: 'games_10', name: 'Regular', description: 'Play 10 games.', icon: 'game-controller', tier: 'common', metric: 'gamesPlayed', target: 10, gold: 120, xp: 80 },
  { id: 'games_50', name: 'Devoted', description: 'Play 50 games.', icon: 'game-controller', tier: 'rare', metric: 'gamesPlayed', target: 50, gold: 350, xp: 200 },
  {
    id: 'games_100',
    name: 'Centurion',
    description: 'Play 100 games.',
    icon: 'medal',
    tier: 'epic',
    metric: 'gamesPlayed',
    target: 100,
    gold: 800,
    xp: 400,
    itemId: 'shades_gold',
  },

  // Winning
  { id: 'wins_10', name: 'Contender', description: 'Win 10 games.', icon: 'ribbon', tier: 'rare', metric: 'gamesWon', target: 10, gold: 250, xp: 150 },
  {
    id: 'wins_50',
    name: 'Champion',
    description: 'Win 50 games.',
    icon: 'flame',
    tier: 'epic',
    metric: 'gamesWon',
    target: 50,
    gold: 900,
    xp: 500,
    itemId: 'bg_champion',
  },

  // Levels
  { id: 'level_5', name: 'Getting Started', description: 'Reach level 5.', icon: 'trending-up', tier: 'common', metric: 'level', target: 5, gold: 100, xp: 0 },
  { id: 'level_10', name: 'Seasoned', description: 'Reach level 10.', icon: 'trending-up', tier: 'rare', metric: 'level', target: 10, gold: 250, xp: 0 },
  { id: 'level_25', name: 'Veteran', description: 'Reach level 25.', icon: 'shield', tier: 'epic', metric: 'level', target: 25, gold: 600, xp: 0 },
  {
    id: 'level_50',
    name: 'Royalty',
    description: 'Reach level 50.',
    icon: 'diamond',
    tier: 'legendary',
    metric: 'level',
    target: 50,
    gold: 2_000,
    xp: 0,
    itemId: 'crown_01',
  },

  // Habits
  { id: 'streak_3', name: 'Three in a Row', description: 'Claim the daily reward 3 days running.', icon: 'calendar', tier: 'common', metric: 'dailyStreak', target: 3, gold: 100, xp: 50 },
  { id: 'streak_7', name: 'Week Strong', description: 'Claim the daily reward 7 days running.', icon: 'calendar', tier: 'rare', metric: 'dailyStreak', target: 7, gold: 300, xp: 150 },

  // Quests
  { id: 'quests_10', name: 'Errand Runner', description: 'Complete 10 quests.', icon: 'checkmark-done', tier: 'common', metric: 'questsCompleted', target: 10, gold: 150, xp: 75 },
  { id: 'quests_50', name: 'Taskmaster', description: 'Complete 50 quests.', icon: 'checkmark-done', tier: 'epic', metric: 'questsCompleted', target: 50, gold: 700, xp: 350 },
];

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
export const getAchievement = (id: string): AchievementDef | undefined => BY_ID.get(id);

/** Counter value, capped at the target so a finished bar never overfills. */
export const progressOf = (def: AchievementDef, snapshot: ProgressSnapshot): number =>
  Math.min(snapshot[def.metric], def.target);

export const isComplete = (def: AchievementDef, snapshot: ProgressSnapshot): boolean =>
  snapshot[def.metric] >= def.target;

/** 0–1, for the progress bars on the achievements screen. */
export const fractionOf = (def: AchievementDef, snapshot: ProgressSnapshot): number =>
  def.target <= 0 ? 1 : progressOf(def, snapshot) / def.target;

/**
 * Everything that just became true and was not already recorded.
 *
 * Returned in definition order so a player who jumps several tiers at once —
 * ten levels from one big quest payout, say — sees the banners in the order
 * they earned them rather than in whatever order the array happened to be.
 */
export function newlyUnlocked(
  snapshot: ProgressSnapshot,
  alreadyUnlocked: readonly string[],
): AchievementDef[] {
  const have = new Set(alreadyUnlocked);
  return ACHIEVEMENTS.filter((def) => !have.has(def.id) && isComplete(def, snapshot));
}

/** Total unlocked, for the "12 / 16" counter on the profile. */
export const completionOf = (unlocked: readonly string[]): { done: number; total: number } => ({
  done: ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).length,
  total: ACHIEVEMENTS.length,
});
