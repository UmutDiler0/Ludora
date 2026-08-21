import { createRng, hashSeed } from '@/features/games/core/rng';
import type { GameId } from '@/features/games/core/types';
import type { QuestPeriod } from './periods';

/**
 * Daily and weekly quests (docs/ARCHITECTURE.md §24).
 *
 * Pure, like achievements. The store owns persistence and the clock; this file
 * owns what a quest is, how an event moves it, and which quests a given period
 * offers.
 *
 * Which quests appear is *derived from the period key*, not stored. Two players
 * on the same day get the same dailies, the set survives a reinstall, and there
 * is no "chosen quests" array to migrate or to fall out of sync with the key it
 * was chosen for.
 */

export type QuestMetric = 'play' | 'win' | 'distinct' | 'survive';

export interface QuestDef {
  id: string;
  period: QuestPeriod;
  name: string;
  description: string;
  /** Ionicons glyph name, as a string so this module imports nothing. */
  icon: string;
  metric: QuestMetric;
  goal: number;
  gold: number;
  xp: number;
}

/** What the app reports when something happens worth counting. */
export type QuestEvent = {
  type: 'game_finished';
  gameId: GameId;
  won: boolean;
  /** Rounds the player was still alive for — feeds the `survive` metric. */
  roundsSurvived: number;
};

export interface QuestState {
  count: number;
  /** Distinct game ids seen, for `distinct` quests. Empty for the rest. */
  seen: string[];
  claimed: boolean;
}

export type QuestProgress = Record<string, QuestState>;

export const EMPTY_QUEST_STATE: QuestState = { count: 0, seen: [], claimed: false };

/**
 * Dailies are deliberately small. They should be finished by someone who sat
 * down to play anyway, not become a second job — the weekly set is where the
 * effort and the real gold live.
 */
const DAILY_POOL: QuestDef[] = [
  { id: 'd_play_1', period: 'daily', name: 'Warm Up', description: 'Finish one game.', icon: 'play', metric: 'play', goal: 1, gold: 60, xp: 40 },
  { id: 'd_play_3', period: 'daily', name: 'Triple Threat', description: 'Finish three games.', icon: 'albums', metric: 'play', goal: 3, gold: 120, xp: 90 },
  { id: 'd_win_1', period: 'daily', name: 'Take One', description: 'Win a game.', icon: 'trophy', metric: 'win', goal: 1, gold: 90, xp: 60 },
  { id: 'd_distinct_2', period: 'daily', name: 'Mix It Up', description: 'Play two different games.', icon: 'shuffle', metric: 'distinct', goal: 2, gold: 110, xp: 70 },
  { id: 'd_survive_3', period: 'daily', name: 'Still Standing', description: 'Survive three rounds in one game.', icon: 'shield-checkmark', metric: 'survive', goal: 3, gold: 100, xp: 65 },
];

/** Weeklies ask for a week's worth of play and pay accordingly. */
const WEEKLY_POOL: QuestDef[] = [
  { id: 'w_play_15', period: 'weekly', name: 'Marathon', description: 'Finish fifteen games.', icon: 'infinite', metric: 'play', goal: 15, gold: 600, xp: 400 },
  { id: 'w_win_7', period: 'weekly', name: 'On a Roll', description: 'Win seven games.', icon: 'flame', metric: 'win', goal: 7, gold: 750, xp: 500 },
  { id: 'w_distinct_4', period: 'weekly', name: 'Well Rounded', description: 'Play four different games.', icon: 'grid', metric: 'distinct', goal: 4, gold: 700, xp: 450 },
  { id: 'w_survive_20', period: 'weekly', name: 'Hard to Kill', description: 'Survive twenty rounds in total.', icon: 'fitness', metric: 'survive', goal: 20, gold: 650, xp: 420 },
];

export const DAILY_COUNT = 3;
export const WEEKLY_COUNT = 2;

/** Fisher–Yates against the injected rng — the same determinism rule as §9. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const rng = createRng(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The quests this period offers. Deterministic in `key`. */
export function questsForPeriod(period: QuestPeriod, key: string): QuestDef[] {
  const pool = period === 'daily' ? DAILY_POOL : WEEKLY_POOL;
  const take = period === 'daily' ? DAILY_COUNT : WEEKLY_COUNT;
  return shuffled(pool, hashSeed(`${period}:${key}`)).slice(0, take);
}

export const stateFor = (progress: QuestProgress, questId: string): QuestState =>
  progress[questId] ?? EMPTY_QUEST_STATE;

export const isQuestComplete = (def: QuestDef, state: QuestState): boolean =>
  state.count >= def.goal;

export const questFraction = (def: QuestDef, state: QuestState): number =>
  def.goal <= 0 ? 1 : Math.min(1, state.count / def.goal);

/** Ready to hand over gold: finished, and not already paid out. */
export const isClaimable = (def: QuestDef, state: QuestState): boolean =>
  isQuestComplete(def, state) && !state.claimed;

/** How much one event moves a single quest. */
function advance(def: QuestDef, state: QuestState, event: QuestEvent): QuestState {
  switch (def.metric) {
    case 'play':
      return { ...state, count: state.count + 1 };

    case 'win':
      return event.won ? { ...state, count: state.count + 1 } : state;

    case 'distinct': {
      // Counting plays instead of distinct ids would let one game finish a
      // "play different games" quest, which is the opposite of the point.
      if (state.seen.includes(event.gameId)) return state;
      const seen = [...state.seen, event.gameId];
      return { ...state, seen, count: seen.length };
    }

    case 'survive':
      return { ...state, count: state.count + event.roundsSurvived };
  }
}

/**
 * Apply one event to every active quest.
 *
 * Claimed quests stop counting: letting them run on would make a re-claim look
 * available the moment the goal is passed a second time.
 */
export function applyQuestEvent(
  defs: readonly QuestDef[],
  progress: QuestProgress,
  event: QuestEvent,
): QuestProgress {
  const next: QuestProgress = { ...progress };
  for (const def of defs) {
    const state = stateFor(progress, def.id);
    if (state.claimed) continue;
    next[def.id] = advance(def, state, event);
  }
  return next;
}

/** Mark one quest paid. Callers check `isClaimable` first. */
export const markClaimed = (progress: QuestProgress, questId: string): QuestProgress => ({
  ...progress,
  [questId]: { ...stateFor(progress, questId), claimed: true },
});

/**
 * Drop progress belonging to quests that are no longer offered.
 *
 * Called on rollover. Without it the map grows forever, and a quest id that
 * comes back around in a later period would resume from a stale count.
 */
export function pruneProgress(active: readonly QuestDef[], progress: QuestProgress): QuestProgress {
  const live = new Set(active.map((d) => d.id));
  const next: QuestProgress = {};
  for (const [id, state] of Object.entries(progress)) {
    if (live.has(id)) next[id] = state;
  }
  return next;
}
