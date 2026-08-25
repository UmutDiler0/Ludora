import type { GameId } from '@/features/games/core/types';

export const home = {
  openProfile: 'Open profile',
  level: (n: number) => `Lv ${n}`,
  welcomeBack: 'Welcome back',
  xpToLevelUp: (xp: string, level: number) => `${xp} XP to level ${level}`,
  quickPlay: 'Quick Play',
  quickPlaySubtitle: 'Vampire Village · hot-seat on this device',
  createGame: 'Create Game',
  joinGame: 'Join Game',
  quests: 'Quests',
  questsReady: (n: number) => `${n} ready`,
  champions: 'Champions',
  viewAll: 'View all',
  trendingNow: 'Trending now',
  playingNow: (n: string) => `${n} playing now`,
  dailyRewardReady: 'Daily reward ready',
  dailyStreakDay: (day: number) => `Day ${day} of your streak`,
  dailyStreakStart: 'Start a streak today',
  plusGold: (n: number) => `+${n} gold`,
  claimGold: (gold: number) => `Claim ${gold} gold`,
  /**
   * Taglines belong to `game_definitions` once Firestore exists; they live
   * here only so the trending cards are not blank in the meantime — see
   * `features/home/dummy.ts`'s file header for why this moved out of that
   * (locale-independent) file.
   */
  tagline: {
    vampireVillage: 'Trust nobody. Someone at this table feeds at night.',
    taboo: 'Describe the word without ever saying the word.',
    drawingGuess: 'Draw badly, guess fast, argue about it afterwards.',
    zarta: 'Quick-fire rounds where hesitating costs you everything.',
    story: 'One or two sentences is all you get. Uncover the rest.',
    detective: 'Read the room, follow the evidence, name the culprit.',
    agent: 'Everyone claims to be one. Only some of them are telling the truth.',
    imposter: 'Blend in, stay quiet, and hope nobody looks too closely.',
  } satisfies Record<GameId, string>,
};
