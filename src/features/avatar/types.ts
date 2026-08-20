/**
 * Avatar slot model (docs/ARCHITECTURE.md §12).
 *
 * An avatar is a slot map, never an image. Adding a slot later is an edit to
 * `SLOT_ORDER` plus catalogue rows — no schema migration — which is what spec
 * §20 means by "must allow additional cosmetic slots to be introduced later".
 *
 * `SLOT_ORDER` is also the z-order the compositor draws in: background first,
 * accessory last.
 */

export const SLOT_ORDER = [
  'background',
  'body',
  'face',
  'eyes',
  'mouth',
  'hair',
  'clothes',
  'hat',
  'accessory',
] as const;

export type AvatarSlot = (typeof SLOT_ORDER)[number];

/** A null slot renders nothing — not every slot is filled. */
export type AvatarConfig = Record<AvatarSlot, string | null>;

export const DEFAULT_AVATAR: AvatarConfig = {
  background: 'bg_01',
  body: 'body_01',
  face: 'face_01',
  eyes: 'eyes_01',
  mouth: 'mouth_01',
  hair: 'hair_01',
  clothes: 'tee_01',
  hat: null,
  accessory: null,
};

/** Slots the customizer exposes as editable tabs, in the order shown. */
export const EDITABLE_SLOTS: AvatarSlot[] = [
  'body',
  'face',
  'eyes',
  'hair',
  'clothes',
  'hat',
  'accessory',
  'background',
];

export const SLOT_LABELS: Record<AvatarSlot, string> = {
  background: 'Background',
  body: 'Body',
  face: 'Face',
  eyes: 'Eyes',
  mouth: 'Mouth',
  hair: 'Hair',
  clothes: 'Clothes',
  hat: 'Hat',
  accessory: 'Accessory',
};
