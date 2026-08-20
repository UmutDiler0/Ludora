import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_AVATAR, type AvatarConfig } from '@/features/avatar/types';
import { levelProgress, type Award } from '@/features/economy/levels';

/**
 * The player's own profile.
 *
 * ⚠️ Every mutation below is a **local mirror** of an operation that spec §22,
 * §24 and §29 require to run server-side. `applyAward` and `spendGold` exist so
 * the UI can be built and demoed; when Cloud Functions land they become
 * listeners on the Firestore document rather than writers. Nothing here is a
 * security boundary, and it is not pretending to be one — see §10.1.
 */

export interface ProfileState {
  displayName: string;
  handle: string;
  avatar: AvatarConfig;
  xp: number;
  gold: number;
  isPremium: boolean;
  ownedItemIds: string[];
  stats: { gamesPlayed: number; gamesWon: number };
  /** ISO date (UTC) of the last claimed daily reward, or null. */
  lastDailyClaim: string | null;
  /** Consecutive days claimed. Resets to 1 when a day is missed. */
  dailyStreak: number;

  setDisplayName: (name: string) => void;
  setAvatar: (avatar: AvatarConfig) => void;
  applyAward: (award: Award) => void;
  recordGame: (won: boolean) => void;
  spendGold: (amount: number) => boolean;
  grantItem: (itemId: string) => void;
  claimDaily: (gold: number) => boolean;
  hydrateFrom: (displayName: string) => void;
  reset: () => void;
}

/**
 * Seed values match the Player Profile design (level 42, 12,450 / 15,000 XP)
 * so the screens can be judged against the mockups rather than against zeroes.
 * Real accounts start from the `hydrateFrom` path instead.
 */
const SEED = {
  /** totalXpForLevel(42) === 313,650, plus the designed 12,450 into the level. */
  xp: 326_100,
  gold: 2_450,
  stats: { gamesPlayed: 184, gamesWon: 97 },
};

const todayUtc = () => new Date().toISOString().slice(0, 10);

const yesterdayUtc = () => new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

const initial = {
  displayName: 'Player_One',
  handle: '@player_one',
  avatar: DEFAULT_AVATAR,
  xp: SEED.xp,
  gold: SEED.gold,
  isPremium: false,
  ownedItemIds: [] as string[],
  stats: SEED.stats,
  lastDailyClaim: null as string | null,
  dailyStreak: 0,
};

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      ...initial,

      setDisplayName: (displayName) => set({ displayName, handle: `@${displayName.toLowerCase()}` }),
      setAvatar: (avatar) => set({ avatar }),

      applyAward: ({ xp, gold }) => set((s) => ({ xp: s.xp + xp, gold: s.gold + gold })),

      recordGame: (won) =>
        set((s) => ({
          stats: {
            gamesPlayed: s.stats.gamesPlayed + 1,
            gamesWon: s.stats.gamesWon + (won ? 1 : 0),
          },
        })),

      spendGold: (amount) => {
        if (amount <= 0 || get().gold < amount) return false;
        set((s) => ({ gold: s.gold - amount }));
        return true;
      },

      grantItem: (itemId) =>
        set((s) =>
          s.ownedItemIds.includes(itemId)
            ? s
            : { ownedItemIds: [...s.ownedItemIds, itemId] },
        ),

      claimDaily: (gold) => {
        const today = todayUtc();
        const { lastDailyClaim, dailyStreak } = get();
        if (lastDailyClaim === today) return false;
        // Consecutive only if the previous claim was literally yesterday;
        // any longer gap starts the streak over at one.
        const continues = lastDailyClaim === yesterdayUtc();
        set((s) => ({
          gold: s.gold + gold,
          lastDailyClaim: today,
          dailyStreak: continues ? dailyStreak + 1 : 1,
        }));
        return true;
      },

      /** Called once when a fresh account signs in for the first time. */
      hydrateFrom: (displayName) =>
        set({ ...initial, displayName, handle: `@${displayName.toLowerCase()}` }),

      reset: () => set(initial),
    }),
    { name: 'ludora.profile', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** Derived level view for the Home header, Profile card and leaderboard rows. */
export const useLevel = () => levelProgress(useProfile((s) => s.xp));

/**
 * Whether today's reward is still unclaimed. Local clock only — the real
 * check belongs server-side (§10.1), or the device date can be rolled back.
 */
export const useDailyClaimable = () => useProfile((s) => s.lastDailyClaim !== todayUtc());

export const useWinRate = () => {
  const { gamesPlayed, gamesWon } = useProfile((s) => s.stats);
  return gamesPlayed === 0 ? 0 : Math.round((gamesWon / gamesPlayed) * 100);
};
