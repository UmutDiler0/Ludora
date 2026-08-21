import type { Rng } from './types';

/**
 * Seeded, deterministic PRNG (mulberry32).
 *
 * Determinism is a correctness requirement, not a convenience: the server
 * replays a finished game from its seed and action log to validate the
 * reported result (docs/ARCHITECTURE.md §10.4). Math.random() would make
 * that replay impossible.
 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next(): number {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/**
 * Stable 32-bit hash (FNV-1a), for turning a string key into a seed.
 *
 * Stable across runs and platforms by construction — no `Math.random`, no
 * `Object.keys` ordering, no locale. That is what lets a period key, a uid or a
 * match id always produce the same draw.
 */
export function hashSeed(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Integer in [0, maxExclusive). */
export function randomInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng.next() * maxExclusive);
}

/** Fisher–Yates. Returns a new array; does not mutate the input. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
