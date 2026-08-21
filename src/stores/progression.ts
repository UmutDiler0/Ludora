import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { awardForGame, levelForXp, levelUpGold } from '@/features/economy/levels';
import type { GameId } from '@/features/games/core/types';
import {
  newlyUnlocked,
  type AchievementDef,
  type ProgressSnapshot,
} from '@/features/progression/achievements';
import { periodKey } from '@/features/progression/periods';
import {
  applyQuestEvent,
  isClaimable,
  markClaimed,
  pruneProgress,
  questsForPeriod,
  stateFor,
  type QuestDef,
  type QuestEvent,
  type QuestProgress,
} from '@/features/progression/quests';
import { useProfile } from './profile';

/**
 * Progression: quests, achievements, and everything that pays gold
 * (docs/ARCHITECTURE.md §24).
 *
 * ⚠️ Like `profile.ts`, every payout here is a **local mirror** of an operation
 * the spec requires to run server-side. It exists so the loop can be built and
 * felt now; when Cloud Functions land, this store becomes a listener on their
 * results rather than the thing deciding them. The rules it applies are the
 * pure modules under `features/progression/`, which the server will run too —
 * so the decisions survive the move even though the writes do not.
 *
 * Active quests are *derived* from the period key rather than stored, so there
 * is no chosen-quest list to drift out of sync with the day it belongs to.
 */

interface ProgressionState {
  /** Achievement ids already earned and paid. */
  unlocked: string[];
  /** Lifetime count, which is itself an achievement metric. */
  questsCompleted: number;

  dailyKey: string;
  weeklyKey: string;
  questProgress: QuestProgress;

  /** Achievements waiting to be announced by the banner, oldest first. */
  banners: AchievementDef[];

  /** Roll the period over if the clock has moved on. Safe to call often. */
  refresh: () => void;
  /** Settle a finished game: stats, XP, gold, quests, achievements. */
  recordGameFinished: (input: { gameId: GameId; won: boolean; roundsSurvived: number }) => void;
  claimQuest: (questId: string) => void;
  dismissBanner: () => void;
  /** Re-evaluate achievements against the current profile. */
  settleAchievements: () => void;
}

const snapshotOf = (questsCompleted: number): ProgressSnapshot => {
  const profile = useProfile.getState();
  return {
    level: levelForXp(profile.xp),
    gamesPlayed: profile.stats.gamesPlayed,
    gamesWon: profile.stats.gamesWon,
    dailyStreak: profile.dailyStreak,
    questsCompleted,
  };
};

/** Pay XP and gold, and add the level-up bonus for any levels that crossed. */
function payAward(xp: number, gold: number) {
  const profile = useProfile.getState();
  const before = levelForXp(profile.xp);
  profile.applyAward({ xp, gold });

  const after = levelForXp(useProfile.getState().xp);
  const bonus = levelUpGold(before, after);
  if (bonus > 0) useProfile.getState().applyAward({ xp: 0, gold: bonus });
}

export const useProgression = create<ProgressionState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      questsCompleted: 0,
      dailyKey: periodKey('daily'),
      weeklyKey: periodKey('weekly'),
      questProgress: {},
      banners: [],

      refresh: () => {
        const daily = periodKey('daily');
        const weekly = periodKey('weekly');
        const { dailyKey, weeklyKey, questProgress } = get();
        if (daily === dailyKey && weekly === weeklyKey) return;

        // Prune against the *new* period's quests, which drops anything the
        // rollover retired and keeps whatever is still offered.
        const active = [...questsForPeriod('daily', daily), ...questsForPeriod('weekly', weekly)];
        set({ dailyKey: daily, weeklyKey: weekly, questProgress: pruneProgress(active, questProgress) });
      },

      recordGameFinished: ({ gameId, won, roundsSurvived }) => {
        get().refresh();

        // Stats first: achievements measure them, and the award below can
        // level the player up into one.
        useProfile.getState().recordGame(won);

        const award = awardForGame({ won, isFirstGameOfDay: false });
        payAward(award.xp, award.gold);

        const { dailyKey, weeklyKey, questProgress } = get();
        const active = activeQuests(dailyKey, weeklyKey);
        const event: QuestEvent = { type: 'game_finished', gameId, won, roundsSurvived };
        set({ questProgress: applyQuestEvent(active, questProgress, event) });

        get().settleAchievements();
      },

      claimQuest: (questId) => {
        get().refresh();
        const { dailyKey, weeklyKey, questProgress, questsCompleted } = get();
        const def = activeQuests(dailyKey, weeklyKey).find((q) => q.id === questId);
        if (!def) return;

        // Re-checked rather than trusting the button: the period can roll over
        // between render and tap, and a claim must not outlive its quest.
        if (!isClaimable(def, stateFor(questProgress, questId))) return;

        set({
          questProgress: markClaimed(questProgress, questId),
          questsCompleted: questsCompleted + 1,
        });
        payAward(def.xp, def.gold);
        get().settleAchievements();
      },

      settleAchievements: () => {
        // A payout can raise a level, which can unlock an achievement, which
        // pays again. Loop until it settles rather than assuming one pass —
        // but bounded, so a bad definition cannot spin forever.
        const earned: AchievementDef[] = [];

        for (let pass = 0; pass < 8; pass++) {
          const { unlocked, questsCompleted } = get();
          const fresh = newlyUnlocked(snapshotOf(questsCompleted), unlocked);
          if (fresh.length === 0) break;

          set({ unlocked: [...unlocked, ...fresh.map((a) => a.id)] });

          for (const def of fresh) {
            if (def.itemId) useProfile.getState().grantItem(def.itemId);
            if (def.gold > 0 || def.xp > 0) payAward(def.xp, def.gold);
          }
          earned.push(...fresh);
        }

        if (earned.length > 0) set((s) => ({ banners: [...s.banners, ...earned] }));
      },

      dismissBanner: () => set((s) => ({ banners: s.banners.slice(1) })),
    }),
    {
      name: 'ludora.progression.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Banners are a UI queue, not a fact about the account. Persisting them
      // would replay old celebrations on the next cold start.
      partialize: (s) => ({
        unlocked: s.unlocked,
        questsCompleted: s.questsCompleted,
        dailyKey: s.dailyKey,
        weeklyKey: s.weeklyKey,
        questProgress: s.questProgress,
      }),
    },
  ),
);

/** The quests on offer right now, daily first. */
export const activeQuests = (dailyKey: string, weeklyKey: string): QuestDef[] => [
  ...questsForPeriod('daily', dailyKey),
  ...questsForPeriod('weekly', weeklyKey),
];

/** Derived view for the home screen and the quest list. */
export function useActiveQuests(): { daily: QuestDef[]; weekly: QuestDef[] } {
  const dailyKey = useProgression((s) => s.dailyKey);
  const weeklyKey = useProgression((s) => s.weeklyKey);
  return {
    daily: questsForPeriod('daily', dailyKey),
    weekly: questsForPeriod('weekly', weeklyKey),
  };
}

/** How many quests are finished and waiting to be collected. */
export function useClaimableCount(): number {
  const dailyKey = useProgression((s) => s.dailyKey);
  const weeklyKey = useProgression((s) => s.weeklyKey);
  const progress = useProgression((s) => s.questProgress);
  return activeQuests(dailyKey, weeklyKey).filter((q) => isClaimable(q, stateFor(progress, q.id)))
    .length;
}

/** The snapshot the achievements screen renders against. */
export function useProgressSnapshot(): ProgressSnapshot {
  const questsCompleted = useProgression((s) => s.questsCompleted);
  const xp = useProfile((s) => s.xp);
  const stats = useProfile((s) => s.stats);
  const dailyStreak = useProfile((s) => s.dailyStreak);
  return {
    level: levelForXp(xp),
    gamesPlayed: stats.gamesPlayed,
    gamesWon: stats.gamesWon,
    dailyStreak,
    questsCompleted,
  };
}
