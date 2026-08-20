import type { AvatarSlot } from './types';

/**
 * Cosmetic item catalogue (docs/ARCHITECTURE.md §12, §22.4 placeholder tier).
 *
 * Real source is Firestore `items/{itemId}` with art in Storage. This stands
 * in for that during Phase 1–3: `variant` + `color` are render hints
 * `AvatarRenderer`/`pieces.tsx` use to draw a deterministic geometric piece —
 * the SVG equivalent of the Skia placeholder tier the docs describe. Swapping
 * in real art later touches only the renderer, never the catalogue shape or
 * the shop/customizer screens.
 *
 * The six items in `DEFAULT_AVATAR` (types.ts) are priced free and already in
 * every profile's `ownedItemIds` (profile.ts) — everyone starts dressed.
 */

export interface AvatarItem {
  id: string;
  slot: AvatarSlot;
  name: string;
  price: number;
  /** Player level required to buy, independent of price. */
  requiredLevel?: number;
  variant: string;
  color: string;
}

export const AVATAR_CATALOGUE: AvatarItem[] = [
  // background — always one equipped, never null
  { id: 'bg_01', slot: 'background', name: 'Paper', price: 0, variant: 'solid', color: '#FFE9C7' },
  { id: 'bg_02', slot: 'background', name: 'Sunset', price: 150, variant: 'solid', color: '#FF9F6B' },
  { id: 'bg_03', slot: 'background', name: 'Lagoon', price: 150, variant: 'solid', color: '#7FE3E8' },
  { id: 'bg_04', slot: 'background', name: 'Grape', price: 200, variant: 'solid', color: '#C9A6FF' },

  // body — base tone
  { id: 'body_01', slot: 'body', name: 'Classic', price: 0, variant: 'round', color: '#F2C39B' },
  { id: 'body_02', slot: 'body', name: 'Almond', price: 100, variant: 'round', color: '#C88855' },
  { id: 'body_03', slot: 'body', name: 'Cocoa', price: 100, variant: 'round', color: '#8B5A38' },

  // face — accent overlay
  { id: 'face_01', slot: 'face', name: 'Plain', price: 0, variant: 'none', color: 'transparent' },
  { id: 'face_02', slot: 'face', name: 'Freckles', price: 80, variant: 'freckles', color: '#8B5A38' },
  { id: 'face_03', slot: 'face', name: 'Blush', price: 80, variant: 'blush', color: '#FF8FA3' },

  // eyes
  { id: 'eyes_01', slot: 'eyes', name: 'Round', price: 0, variant: 'round', color: '#2E2545' },
  { id: 'eyes_02', slot: 'eyes', name: 'Happy', price: 60, variant: 'happy', color: '#2E2545' },
  { id: 'eyes_03', slot: 'eyes', name: 'Sparkle', price: 90, variant: 'sparkle', color: '#2E2545' },

  // hair
  { id: 'hair_01', slot: 'hair', name: 'Short', price: 0, variant: 'short', color: '#3A2B22' },
  { id: 'hair_02', slot: 'hair', name: 'Curly', price: 120, variant: 'curly', color: '#7A4B2A' },
  { id: 'hair_03', slot: 'hair', name: 'Mohawk', price: 150, variant: 'mohawk', color: '#FF3B8D' },
  { id: 'hair_04', slot: 'hair', name: 'Long', price: 140, variant: 'long', color: '#F0C93C' },

  // clothes
  { id: 'tee_01', slot: 'clothes', name: 'Tee', price: 0, variant: 'tee', color: '#7C4DFF' },
  { id: 'hoodie_01', slot: 'clothes', name: 'Hoodie', price: 130, variant: 'hoodie', color: '#16C4E8' },
  { id: 'jacket_01', slot: 'clothes', name: 'Jacket', price: 160, variant: 'jacket', color: '#FF5B4A' },
  { id: 'tank_01', slot: 'clothes', name: 'Tank', price: 110, variant: 'tank', color: '#2FCB74' },

  // hat — no default equipped (null)
  { id: 'cap_01', slot: 'hat', name: 'Cap', price: 90, variant: 'cap', color: '#FF5B4A' },
  { id: 'beanie_01', slot: 'hat', name: 'Beanie', price: 90, variant: 'beanie', color: '#16C4E8' },
  { id: 'party_01', slot: 'hat', name: 'Party Hat', price: 120, variant: 'party', color: '#FFC93C' },
  { id: 'crown_01', slot: 'hat', name: 'Crown', price: 300, requiredLevel: 10, variant: 'crown', color: '#FFC93C' },

  // accessory — no default equipped (null)
  { id: 'glasses_01', slot: 'accessory', name: 'Glasses', price: 100, variant: 'glasses', color: '#2E2545' },
  { id: 'star_01', slot: 'accessory', name: 'Star Sticker', price: 80, variant: 'star', color: '#FFC93C' },
  { id: 'scarf_01', slot: 'accessory', name: 'Scarf', price: 110, variant: 'scarf', color: '#FF5B4A' },
];

const BY_ID = new Map(AVATAR_CATALOGUE.map((item) => [item.id, item]));

export const getAvatarItem = (id: string | null): AvatarItem | undefined =>
  id ? BY_ID.get(id) : undefined;

export const itemsForSlot = (slot: AvatarSlot): AvatarItem[] =>
  AVATAR_CATALOGUE.filter((item) => item.slot === slot);
