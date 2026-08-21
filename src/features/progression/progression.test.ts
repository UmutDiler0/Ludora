import { AVATAR_CATALOGUE, isFreeStarter, ownsItem } from '@/features/avatar/catalogue';
import { levelUpGold, goldForReachingLevel } from '@/features/economy/levels';
import {
  ACHIEVEMENTS,
  completionOf,
  fractionOf,
  isComplete,
  newlyUnlocked,
  progressOf,
  type ProgressSnapshot,
} from './achievements';
import { dayKey, formatResetIn, isoWeekKey, msUntilPeriodEnd, periodKey } from './periods';
import {
  applyQuestEvent,
  DAILY_COUNT,
  isClaimable,
  markClaimed,
  pruneProgress,
  questFraction,
  questsForPeriod,
  sortQuestsForDisplay,
  stateFor,
  WEEKLY_COUNT,
  type QuestDef,
  type QuestEvent,
  type QuestProgress,
} from './quests';

const snap = (over: Partial<ProgressSnapshot> = {}): ProgressSnapshot => ({
  level: 1,
  gamesPlayed: 0,
  gamesWon: 0,
  dailyStreak: 0,
  questsCompleted: 0,
  ...over,
});

const finished = (over: Partial<QuestEvent> = {}): QuestEvent => ({
  type: 'game_finished',
  gameId: 'vampireVillage',
  won: false,
  roundsSurvived: 0,
  ...over,
});

/* ------------------------------------------------------------- periods */

describe('period keys', () => {
  it('keys days in UTC', () => {
    expect(dayKey(new Date('2026-03-08T23:30:00Z'))).toBe('2026-03-08');
  });

  it('rolls the day at UTC midnight, not local midnight', () => {
    expect(dayKey(new Date('2026-03-08T23:59:59Z'))).toBe('2026-03-08');
    expect(dayKey(new Date('2026-03-09T00:00:01Z'))).toBe('2026-03-09');
  });

  it('keeps a whole ISO week on one key', () => {
    // Monday through Sunday of the same ISO week.
    const monday = isoWeekKey(new Date('2026-03-02T00:00:00Z'));
    const sunday = isoWeekKey(new Date('2026-03-08T23:59:00Z'));
    expect(monday).toBe(sunday);
  });

  it('starts a new key on Monday', () => {
    const sunday = isoWeekKey(new Date('2026-03-08T12:00:00Z'));
    const monday = isoWeekKey(new Date('2026-03-09T12:00:00Z'));
    expect(monday).not.toBe(sunday);
  });

  it('puts late-December days in the following year when ISO says so', () => {
    // 2025-12-29 is a Monday and belongs to ISO week 1 of 2026. A naive
    // count from January 1st would hand these players two "week 1"s.
    expect(isoWeekKey(new Date('2025-12-29T00:00:00Z'))).toBe('2026-W01');
  });

  it('formats week keys with a padded number', () => {
    expect(isoWeekKey(new Date('2026-01-05T00:00:00Z'))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('routes periodKey to the right scheme', () => {
    const at = new Date('2026-03-08T10:00:00Z');
    expect(periodKey('daily', at)).toBe(dayKey(at));
    expect(periodKey('weekly', at)).toBe(isoWeekKey(at));
  });

  it('counts down to the end of the period', () => {
    const at = new Date('2026-03-08T22:00:00Z');
    expect(msUntilPeriodEnd('daily', at)).toBe(2 * 3_600_000);
    // Sunday 22:00 → Monday 00:00 is also 2h for the weekly window.
    expect(msUntilPeriodEnd('weekly', at)).toBe(2 * 3_600_000);
  });

  it('never reports a negative or zero-looking reset', () => {
    expect(formatResetIn(0)).toBe('1m');
    expect(formatResetIn(90 * 60_000)).toBe('1h');
    expect(formatResetIn(50 * 3_600_000)).toBe('2d');
  });
});

/* -------------------------------------------------------- achievements */

describe('achievement definitions', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only rewards items that cannot also be bought', () => {
    // The whole promise of an earned item is that gold cannot get it.
    for (const def of ACHIEVEMENTS.filter((a) => a.itemId)) {
      const item = AVATAR_CATALOGUE.find((i) => i.id === def.itemId);
      expect(item).toBeDefined();
      expect(item!.price).toBe(0);
      expect(item!.unlockedBy).toBe(def.id);
    }
  });

  it('does not hand earned items to a brand-new account', () => {
    // Earned items are priced 0, so any "free means owned" shortcut would put
    // the King's Crown on a player who has never finished a game.
    const earned = AVATAR_CATALOGUE.filter((i) => i.unlockedBy);
    expect(earned.length).toBeGreaterThan(0);
    for (const item of earned) {
      expect(isFreeStarter(item)).toBe(false);
      expect(ownsItem(item, [])).toBe(false);
      expect(ownsItem(item, [item.id])).toBe(true);
    }
  });

  it('pays more for rarer tiers', () => {
    const cheapest = (tier: string) =>
      Math.min(...ACHIEVEMENTS.filter((a) => a.tier === tier).map((a) => a.gold));
    expect(cheapest('legendary')).toBeGreaterThan(cheapest('epic'));
    expect(cheapest('epic')).toBeGreaterThan(cheapest('rare'));
    expect(cheapest('rare')).toBeGreaterThan(cheapest('common'));
  });
});

describe('achievement progress', () => {
  it('caps progress at the target so a bar never overfills', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'games_10')!;
    expect(progressOf(def, snap({ gamesPlayed: 999 }))).toBe(10);
    expect(fractionOf(def, snap({ gamesPlayed: 999 }))).toBe(1);
  });

  it('completes on reaching the target, not after it', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'level_5')!;
    expect(isComplete(def, snap({ level: 4 }))).toBe(false);
    expect(isComplete(def, snap({ level: 5 }))).toBe(true);
  });

  it('counts completion for the profile header', () => {
    expect(completionOf([])).toEqual({ done: 0, total: ACHIEVEMENTS.length });
    expect(completionOf(['first_game', 'first_win']).done).toBe(2);
  });

  it('ignores unlocked ids that are not real achievements', () => {
    expect(completionOf(['nonsense']).done).toBe(0);
  });
});

describe('newlyUnlocked', () => {
  it('returns nothing for a fresh account', () => {
    expect(newlyUnlocked(snap(), [])).toEqual([]);
  });

  it('finds everything that just became true', () => {
    const ids = newlyUnlocked(snap({ gamesPlayed: 1, gamesWon: 1 }), []).map((a) => a.id);
    expect(ids).toContain('first_game');
    expect(ids).toContain('first_win');
  });

  it('never returns something already recorded', () => {
    const ids = newlyUnlocked(snap({ gamesPlayed: 1 }), ['first_game']).map((a) => a.id);
    expect(ids).not.toContain('first_game');
  });

  it('returns several tiers at once when a jump earns them together', () => {
    // A big payout can cross more than one threshold; all of them are owed.
    const ids = newlyUnlocked(snap({ gamesPlayed: 100 }), []).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['first_game', 'games_10', 'games_50', 'games_100']));
  });

  it('is idempotent once the results are recorded', () => {
    const first = newlyUnlocked(snap({ gamesPlayed: 10 }), []).map((a) => a.id);
    expect(newlyUnlocked(snap({ gamesPlayed: 10 }), first)).toEqual([]);
  });
});

/* --------------------------------------------------------------- quests */

describe('quest selection', () => {
  it('offers a fixed number per period', () => {
    expect(questsForPeriod('daily', '2026-03-08')).toHaveLength(DAILY_COUNT);
    expect(questsForPeriod('weekly', '2026-W10')).toHaveLength(WEEKLY_COUNT);
  });

  it('is deterministic in the period key', () => {
    // Two devices on the same day must offer the same quests, and a reinstall
    // must not reroll them.
    const a = questsForPeriod('daily', '2026-03-08').map((q) => q.id);
    const b = questsForPeriod('daily', '2026-03-08').map((q) => q.id);
    expect(a).toEqual(b);
  });

  it('varies across periods', () => {
    const days = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'];
    const sets = days.map((d) => questsForPeriod('daily', d).map((q) => q.id).join(','));
    expect(new Set(sets).size).toBeGreaterThan(1);
  });

  it('never repeats a quest within one period', () => {
    const ids = questsForPeriod('daily', '2026-03-08').map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only offers quests belonging to that period', () => {
    expect(questsForPeriod('daily', '2026-03-08').every((q) => q.period === 'daily')).toBe(true);
    expect(questsForPeriod('weekly', '2026-W10').every((q) => q.period === 'weekly')).toBe(true);
  });

  it('pays more for weeklies than dailies', () => {
    // The whole reason to attempt the harder set.
    const bestDaily = Math.max(...questsForPeriod('daily', '2026-03-08').map((q) => q.gold));
    const worstWeekly = Math.min(...questsForPeriod('weekly', '2026-W10').map((q) => q.gold));
    expect(worstWeekly).toBeGreaterThan(bestDaily);
  });
});

describe('quest progress', () => {
  const play: QuestDef = { id: 'q', period: 'daily', name: '', description: '', icon: '', metric: 'play', goal: 2, gold: 10, xp: 10 };
  const win: QuestDef = { ...play, id: 'w', metric: 'win' };
  const distinct: QuestDef = { ...play, id: 'd', metric: 'distinct' };
  const survive: QuestDef = { ...play, id: 's', metric: 'survive', goal: 5 };

  it('counts every finished game for play quests', () => {
    let p = applyQuestEvent([play], {}, finished());
    p = applyQuestEvent([play], p, finished());
    expect(stateFor(p, 'q').count).toBe(2);
    expect(isClaimable(play, stateFor(p, 'q'))).toBe(true);
  });

  it('counts only wins for win quests', () => {
    let p = applyQuestEvent([win], {}, finished({ won: false }));
    expect(stateFor(p, 'w').count).toBe(0);
    p = applyQuestEvent([win], p, finished({ won: true }));
    expect(stateFor(p, 'w').count).toBe(1);
  });

  it('does not let one game satisfy a "different games" quest', () => {
    let p = applyQuestEvent([distinct], {}, finished({ gameId: 'vampireVillage' }));
    p = applyQuestEvent([distinct], p, finished({ gameId: 'vampireVillage' }));
    expect(stateFor(p, 'd').count).toBe(1);

    p = applyQuestEvent([distinct], p, finished({ gameId: 'taboo' }));
    expect(stateFor(p, 'd').count).toBe(2);
  });

  it('accumulates rounds for survival quests', () => {
    let p = applyQuestEvent([survive], {}, finished({ roundsSurvived: 3 }));
    p = applyQuestEvent([survive], p, finished({ roundsSurvived: 4 }));
    expect(stateFor(p, 's').count).toBe(7);
  });

  it('stops counting once claimed', () => {
    // Otherwise passing the goal a second time would look claimable again.
    let p = applyQuestEvent([play], {}, finished());
    p = applyQuestEvent([play], p, finished());
    p = markClaimed(p, 'q');
    p = applyQuestEvent([play], p, finished());

    expect(stateFor(p, 'q').count).toBe(2);
    expect(isClaimable(play, stateFor(p, 'q'))).toBe(false);
  });

  it('is not claimable before the goal', () => {
    const p = applyQuestEvent([play], {}, finished());
    expect(isClaimable(play, stateFor(p, 'q'))).toBe(false);
  });

  it('clamps the displayed fraction', () => {
    const p = { q: { count: 99, seen: [], claimed: false } };
    expect(questFraction(play, stateFor(p, 'q'))).toBe(1);
  });

  it('leaves untouched quests alone', () => {
    const p = applyQuestEvent([play, win], {}, finished({ won: false }));
    expect(stateFor(p, 'w')).toEqual({ count: 0, seen: [], claimed: false });
  });
});

describe('quest display order', () => {
  const quest = (id: string, goal: number): QuestDef => ({
    id, period: 'daily', name: id, description: '', icon: '', metric: 'play', goal, gold: 10, xp: 10,
  });

  const at = (count: number, claimed = false) => ({ count, seen: [], claimed });
  const ids = (defs: QuestDef[]) => defs.map((d) => d.id);

  const a = quest('a', 10);
  const b = quest('b', 10);
  const c = quest('c', 10);

  it('puts the closest to done at the top', () => {
    const progress: QuestProgress = { a: at(1), b: at(9), c: at(5) };
    expect(ids(sortQuestsForDisplay([a, b, c], progress))).toEqual(['b', 'c', 'a']);
  });

  it('sinks collected quests to the bottom however far along the rest are', () => {
    // The collected one is at 100% and would otherwise sort first — it is the
    // one row on the board with nothing left to do.
    const progress: QuestProgress = { a: at(10, true), b: at(1), c: at(0) };
    expect(ids(sortQuestsForDisplay([a, b, c], progress))).toEqual(['b', 'c', 'a']);
  });

  it('keeps a finished-but-unclaimed quest at the very top', () => {
    // Where the gold is. Falls out of sorting by progress, with no special case.
    const progress: QuestProgress = { a: at(2), b: at(10), c: at(9) };
    expect(ids(sortQuestsForDisplay([a, b, c], progress))[0]).toBe('b');
  });

  it('compares by fraction, not by raw count', () => {
    // 3/5 beats 4/10 despite being the smaller number.
    const small = quest('small', 5);
    const big = quest('big', 10);
    const progress: QuestProgress = { small: at(3), big: at(4) };
    expect(ids(sortQuestsForDisplay([big, small], progress))).toEqual(['small', 'big']);
  });

  it('holds untouched quests in their drawn order', () => {
    // No progress anywhere: rows must not swap places between renders.
    const order = ids(sortQuestsForDisplay([a, b, c], {}));
    expect(order).toEqual(['a', 'b', 'c']);
    expect(ids(sortQuestsForDisplay([a, b, c], {}))).toEqual(order);
  });

  it('does not mutate the list it was given', () => {
    const input = [a, b, c];
    sortQuestsForDisplay(input, { b: at(9) });
    expect(ids(input)).toEqual(['a', 'b', 'c']);
  });
});

describe('rollover', () => {
  it('drops progress for quests no longer offered', () => {
    const stale = { old_quest: { count: 5, seen: [], claimed: false } };
    const active = questsForPeriod('daily', '2026-03-08');
    expect(pruneProgress(active, stale)).toEqual({});
  });

  it('keeps progress for quests that are still live', () => {
    const active = questsForPeriod('daily', '2026-03-08');
    const kept = { [active[0].id]: { count: 1, seen: [], claimed: false } };
    expect(pruneProgress(active, kept)).toEqual(kept);
  });
});

/* ---------------------------------------------------------- level gold */

describe('level-up gold', () => {
  it('pays more at higher levels', () => {
    expect(goldForReachingLevel(20)).toBeGreaterThan(goldForReachingLevel(2));
  });

  it('pays nothing when the level did not change', () => {
    expect(levelUpGold(7, 7)).toBe(0);
  });

  it('pays every level crossed in one jump', () => {
    // A quest payout can cross several levels at once; none may be skipped.
    expect(levelUpGold(3, 6)).toBe(
      goldForReachingLevel(4) + goldForReachingLevel(5) + goldForReachingLevel(6),
    );
  });

  it('never pays for going backwards', () => {
    expect(levelUpGold(9, 4)).toBe(0);
  });
});
