/**
 * XP curve and award table — the single source of truth (spec §24 forbids
 * scattering level maths). Imported by both the app and the Cloud Functions
 * package so client and server can never disagree.
 *
 * Decision D13 (docs/ARCHITECTURE.md §22.3): the curve is derived from the
 * Player Profile design, which shows `12,450 / 15,000 XP` at level 42.
 */

/** XP required to move from `level` to `level + 1`. */
export const xpToNext = (level: number): number => 300 + 350 * level;

/** Cumulative XP required to reach `level` from zero. Level 1 is the floor. */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNext(l);
  return total;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP needed to complete the current level. */
  xpForLevel: number;
  xpToLevelUp: number;
  /** 0–1, for the Home and Profile progress bars. */
  fraction: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level += 1;
  }
  const xpForLevel = xpToNext(level);
  return {
    level,
    xpIntoLevel: remaining,
    xpForLevel,
    xpToLevelUp: xpForLevel - remaining,
    fraction: xpForLevel === 0 ? 0 : remaining / xpForLevel,
  };
}

export const levelForXp = (totalXp: number): number => levelProgress(totalXp).level;

/**
 * Award table — decision D12 (§22.3). Totals match the designed Recent
 * History (`+120 XP / +45 gold` win, `+30 / +10` loss) while staying
 * additive, as spec §24 describes.
 *
 * These are defaults; per-game overrides live in `game_definitions.awards`
 * so balance can be tuned without shipping a release.
 */
export const AWARDS = {
  participation: { xp: 30, gold: 10 },
  winBonus: { xp: 90, gold: 35 },
  firstGameOfDay: { xp: 25, gold: 0 },
  dailyReward: { xp: 0, gold: 50 },
  rewardedAd: { xp: 0, gold: 20 },
} as const;

/**
 * Gold paid for reaching `level`.
 *
 * Rises with level so the curve keeps paying as it slows down — later levels
 * cost far more XP (`xpToNext` is linear in level), so a flat reward would make
 * every level-up feel worse than the last.
 */
export const goldForReachingLevel = (level: number): number => 40 + 10 * level;

/** Total level-up gold for crossing from one level to another. */
export function levelUpGold(fromLevel: number, toLevel: number): number {
  let total = 0;
  for (let level = fromLevel + 1; level <= toLevel; level++) total += goldForReachingLevel(level);
  return total;
}

export interface AwardInput {
  won: boolean;
  isFirstGameOfDay: boolean;
}

export interface Award {
  xp: number;
  gold: number;
}

/**
 * Pure. The server calls this after validating a game result; the client
 * calls it only to preview. Never trust a client-computed award (§10.1).
 */
export function awardForGame({ won, isFirstGameOfDay }: AwardInput): Award {
  let xp = AWARDS.participation.xp;
  let gold = AWARDS.participation.gold;
  if (won) {
    xp += AWARDS.winBonus.xp;
    gold += AWARDS.winBonus.gold;
  }
  if (isFirstGameOfDay) {
    xp += AWARDS.firstGameOfDay.xp;
    gold += AWARDS.firstGameOfDay.gold;
  }
  return { xp, gold };
}
