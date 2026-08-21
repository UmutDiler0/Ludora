import { AVATAR_CATALOGUE, getAvatarItem } from './catalogue';
import { avatarFromSeed } from './seeded';
import { SLOT_ORDER } from './types';

const SEEDS = ['u_blazequeen', 'u_shadowninja', 'u_trashpanda', 'u_glowmoth', '', 'x'];

describe('avatarFromSeed', () => {
  it('is deterministic in the seed', () => {
    for (const seed of SEEDS) {
      expect(avatarFromSeed(seed)).toEqual(avatarFromSeed(seed));
    }
  });

  it('gives different seeds different faces', () => {
    // Not a guarantee for any *particular* pair — it is a crowd check. A
    // generator that collapsed to one outfit would still pass every other test
    // here while making the leaderboard look broken.
    const distinct = new Set(SEEDS.map((s) => JSON.stringify(avatarFromSeed(s))));
    expect(distinct.size).toBe(SEEDS.length);
  });

  it('only ever picks real catalogue items, into their own slot', () => {
    for (const seed of SEEDS) {
      const config = avatarFromSeed(seed);
      for (const slot of SLOT_ORDER) {
        const id = config[slot];
        if (id === null) continue;
        expect(getAvatarItem(id)?.slot).toBe(slot);
      }
    }
  });

  it('never dresses a fabricated player in an earned item', () => {
    // The whole point of `unlockedBy` is that seeing the item means someone
    // earned it. A crowd of fake rivals wearing the King's Crown would undo
    // that quietly, so this is checked against every seed rather than trusted.
    const earned = new Set(AVATAR_CATALOGUE.filter((i) => i.unlockedBy).map((i) => i.id));
    expect(earned.size).toBeGreaterThan(0);

    for (let i = 0; i < 500; i++) {
      const config = avatarFromSeed(`seed_${i}`);
      for (const slot of SLOT_ORDER) {
        expect(earned.has(config[slot] ?? '')).toBe(false);
      }
    }
  });

  it('always fills the slots that have no "wearing nothing" option', () => {
    // Empty here would render a barefoot, trouserless figure — the failure that
    // looks deliberate rather than broken.
    for (let i = 0; i < 200; i++) {
      const config = avatarFromSeed(`seed_${i}`);
      for (const slot of ['background', 'build', 'body', 'clothes', 'pants', 'shoes', 'eyes', 'mouth', 'hair'] as const) {
        expect(config[slot]).not.toBeNull();
      }
    }
  });
});
