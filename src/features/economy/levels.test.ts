import { AWARDS, awardForGame, levelForXp, levelProgress, totalXpForLevel, xpToNext } from './levels';

describe('xp curve', () => {
  it('matches the Player Profile design exactly', () => {
    // The design shows "12,450 / 15,000 XP" and "2,550 XP to Level 43" at level 42.
    expect(xpToNext(42)).toBe(15_000);
    const progress = levelProgress(totalXpForLevel(42) + 12_450);
    expect(progress.level).toBe(42);
    expect(progress.xpIntoLevel).toBe(12_450);
    expect(progress.xpForLevel).toBe(15_000);
    expect(progress.xpToLevelUp).toBe(2_550);
  });

  it('matches the Home Dashboard level', () => {
    expect(xpToNext(18)).toBe(6_600);
    expect(levelForXp(totalXpForLevel(18))).toBe(18);
  });

  it('starts every player at level 1', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelProgress(0).xpIntoLevel).toBe(0);
  });

  it('levels up exactly on the threshold, not before', () => {
    const need = xpToNext(1);
    expect(levelForXp(need - 1)).toBe(1);
    expect(levelForXp(need)).toBe(2);
  });

  it('is monotonic and self-consistent across a long run', () => {
    let last = 0;
    for (let level = 1; level <= 60; level++) {
      const at = totalXpForLevel(level);
      expect(at).toBeGreaterThanOrEqual(last);
      expect(levelForXp(at)).toBe(level);
      last = at;
    }
  });

  it('clamps negative and fractional xp', () => {
    expect(levelForXp(-500)).toBe(1);
    expect(levelProgress(10.9).xpIntoLevel).toBe(10);
  });
});

describe('awards', () => {
  it('totals match the designed Recent History rows', () => {
    // Design: victory "+45 gold / +120 XP", defeat "+10 gold / +30 XP".
    expect(awardForGame({ won: true, isFirstGameOfDay: false })).toEqual({ xp: 120, gold: 45 });
    expect(awardForGame({ won: false, isFirstGameOfDay: false })).toEqual({ xp: 30, gold: 10 });
  });

  it('adds the first-game-of-day bonus on top', () => {
    expect(awardForGame({ won: true, isFirstGameOfDay: true })).toEqual({
      xp: 120 + AWARDS.firstGameOfDay.xp,
      gold: 45,
    });
  });

  it('never awards a negative amount', () => {
    for (const won of [true, false]) {
      for (const first of [true, false]) {
        const a = awardForGame({ won, isFirstGameOfDay: first });
        expect(a.xp).toBeGreaterThan(0);
        expect(a.gold).toBeGreaterThan(0);
      }
    }
  });
});
