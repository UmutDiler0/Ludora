import { createRng, hashSeed, randomInt } from '@/features/games/core/rng';

import { isEarnedOnly, itemsForSlot } from './catalogue';
import { DEFAULT_AVATAR, SLOT_ORDER, type AvatarConfig, type AvatarSlot } from './types';

/**
 * A whole avatar dealt from a string seed.
 *
 * This exists because screens that show *other* people — the leaderboard
 * podium, and anywhere else a rival appears — need those people to look like
 * distinct individuals, and a real config is not available for them yet. Real
 * players' avatars come from their profile document (`users/{uid}.avatar`,
 * §12); this is what stands in until that read exists, and it should be deleted
 * the moment it does.
 *
 * Deterministic in the seed, so a given uid always wears the same outfit. A
 * `Math.random()` version would re-dress every rival on each render, which reads
 * as a rendering bug rather than as a crowd.
 *
 * Earned items are excluded. A fabricated rival in the King's Crown would
 * advertise a level-50 trophy as something the crowd already has, which is
 * exactly the value `unlockedBy` exists to protect.
 */

/**
 * Odds that an otherwise-empty slot gets filled.
 *
 * Only the three slots with no free default are rolled: they are genuinely
 * optional, and filling all of them every time would make every rival look
 * equally over-accessorised. Slots absent from this map are always chosen.
 */
const CHANCE: Partial<Record<AvatarSlot, number>> = {
  hat: 0.4,
  accessory: 0.35,
  facialHair: 0.25,
};

/** Options a fabricated player may be dealt, per slot. Built once. */
const POOL: Record<AvatarSlot, string[]> = SLOT_ORDER.reduce(
  (acc, slot) => {
    acc[slot] = itemsForSlot(slot)
      .filter((item) => !isEarnedOnly(item))
      .map((item) => item.id);
    return acc;
  },
  {} as Record<AvatarSlot, string[]>,
);

export function avatarFromSeed(seed: string): AvatarConfig {
  const rng = createRng(hashSeed(`avatar:${seed}`));
  const out = { ...DEFAULT_AVATAR };

  // Driven by SLOT_ORDER so the draw order is fixed: consuming the rng in a
  // different sequence would silently change every existing seed's result.
  for (const slot of SLOT_ORDER) {
    const chance = CHANCE[slot];
    const skip = chance !== undefined && rng.next() >= chance;
    const options = POOL[slot];

    out[slot] = skip || options.length === 0 ? null : options[randomInt(rng, options.length)];
  }

  return out;
}
