/**
 * Avatar slot model (docs/ARCHITECTURE.md §12).
 *
 * An avatar is a slot map, never an image. Adding a slot later is an edit to
 * `SLOT_ORDER` plus catalogue rows — no schema migration — which is what spec
 * §20 means by "must allow additional cosmetic slots to be introduced later".
 * `pants` and `shoes` were added exactly that way.
 *
 * `SLOT_ORDER` is also the z-order the compositor draws in: background first,
 * accessory last. `build` is the one member that draws nothing — it is a
 * silhouette modifier the body, clothes and pants all read, and it lives in
 * the slot map so that persistence, the shop and the customizer can treat it
 * like any other choice instead of needing a parallel code path.
 */

export const SLOT_ORDER = [
  'background',
  'build',
  'body',
  'pants',
  'shoes',
  'clothes',
  'face',
  'eyes',
  // Before the mouth on purpose: a full beard should frame it, not cover it.
  'facialHair',
  'mouth',
  'hair',
  'hat',
  'accessory',
] as const;

export type AvatarSlot = (typeof SLOT_ORDER)[number];

/** A null slot renders nothing — not every slot is filled. */
export type AvatarConfig = Record<AvatarSlot, string | null>;

/**
 * Body silhouette.
 *
 * This is a shape choice, not a permission: every hair, garment and accessory
 * in the catalogue is available on every build. It exists because players ask
 * to look like themselves, and it is a normal editable slot afterwards rather
 * than a one-time question at sign-up.
 */
export type BuildVariant = 'neutral' | 'feminine' | 'masculine';

export const DEFAULT_AVATAR: AvatarConfig = {
  background: 'bg_01',
  build: 'build_neutral',
  body: 'body_01',
  pants: 'jeans_01',
  shoes: 'sneaker_01',
  clothes: 'tee_01',
  face: 'face_01',
  eyes: 'eyes_01',
  facialHair: null,
  mouth: 'mouth_01',
  hair: 'hair_01',
  hat: null,
  accessory: null,
};

/** Slots the customizer exposes as editable tabs, in the order shown. */
export const EDITABLE_SLOTS: AvatarSlot[] = [
  'build',
  'body',
  'face',
  'eyes',
  'mouth',
  'hair',
  'facialHair',
  'clothes',
  'pants',
  'shoes',
  'hat',
  'accessory',
  'background',
];

/**
 * `SLOT_LABELS` used to live here as plain English strings; it moved to
 * `i18n/en(or tr)/avatar.ts`'s `slotLabel` once the shop/customizer/creation
 * tab rows needed to follow the app's language.
 */

/** Slots where wearing nothing is a real choice rather than a missing piece. */
export const OPTIONAL_SLOTS: AvatarSlot[] = ['hat', 'accessory', 'face', 'facialHair'];

/**
 * Fills in slots a stored config predates.
 *
 * Profiles saved before `pants`, `shoes` and `build` existed have those keys
 * missing, which would render a barefoot, trouserless avatar rather than an
 * obviously broken one — the worst kind of bug, because it looks deliberate.
 */
export function normalizeAvatar(config: Partial<AvatarConfig> | undefined | null): AvatarConfig {
  const out = { ...DEFAULT_AVATAR };
  if (!config) return out;
  for (const slot of SLOT_ORDER) {
    // `null` is meaningful (deliberately empty), so only `undefined` falls back.
    if (config[slot] !== undefined) out[slot] = config[slot] as string | null;
  }
  return out;
}
