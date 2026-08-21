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
 * Everything in `DEFAULT_AVATAR` (types.ts) is priced free and already in every
 * profile's `ownedItemIds` (profile.ts) — everyone starts dressed, including
 * bottoms and shoes.
 *
 * Builds are free, all three of them. A body shape is not a cosmetic to be
 * sold, and charging for one would make some players pay to look like
 * themselves.
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
  // build — free, and changeable at any time
  { id: 'build_neutral', slot: 'build', name: 'Neutral', price: 0, variant: 'neutral', color: 'transparent' },
  { id: 'build_fem', slot: 'build', name: 'Feminine', price: 0, variant: 'feminine', color: 'transparent' },
  { id: 'build_masc', slot: 'build', name: 'Masculine', price: 0, variant: 'masculine', color: 'transparent' },

  // background — always one equipped, never null
  { id: 'bg_01', slot: 'background', name: 'Paper', price: 0, variant: 'solid', color: '#FFE9C7' },
  { id: 'bg_02', slot: 'background', name: 'Sunset', price: 150, variant: 'solid', color: '#FF9F6B' },
  { id: 'bg_03', slot: 'background', name: 'Lagoon', price: 150, variant: 'solid', color: '#7FE3E8' },
  { id: 'bg_04', slot: 'background', name: 'Grape', price: 200, variant: 'solid', color: '#C9A6FF' },
  { id: 'bg_05', slot: 'background', name: 'Mint', price: 150, variant: 'solid', color: '#A6E9C1' },
  { id: 'bg_06', slot: 'background', name: 'Bubblegum', price: 180, variant: 'solid', color: '#FFB3D1' },
  { id: 'bg_07', slot: 'background', name: 'Midnight', price: 250, variant: 'solid', color: '#3B3170' },
  { id: 'bg_08', slot: 'background', name: 'Sand', price: 150, variant: 'solid', color: '#EBD3A5' },

  // body — skin tone
  { id: 'body_01', slot: 'body', name: 'Classic', price: 0, variant: 'round', color: '#F2C39B' },
  { id: 'body_02', slot: 'body', name: 'Almond', price: 100, variant: 'round', color: '#C88855' },
  { id: 'body_03', slot: 'body', name: 'Cocoa', price: 100, variant: 'round', color: '#8B5A38' },
  { id: 'body_04', slot: 'body', name: 'Porcelain', price: 100, variant: 'round', color: '#FBDCC4' },
  { id: 'body_05', slot: 'body', name: 'Honey', price: 100, variant: 'round', color: '#E0A870' },
  { id: 'body_06', slot: 'body', name: 'Umber', price: 100, variant: 'round', color: '#6B4028' },
  { id: 'body_07', slot: 'body', name: 'Olive', price: 100, variant: 'round', color: '#D2A579' },

  // face — accent overlay
  { id: 'face_01', slot: 'face', name: 'Plain', price: 0, variant: 'none', color: 'transparent' },
  { id: 'face_02', slot: 'face', name: 'Freckles', price: 80, variant: 'freckles', color: '#8B5A38' },
  { id: 'face_03', slot: 'face', name: 'Blush', price: 80, variant: 'blush', color: '#FF8FA3' },
  { id: 'face_04', slot: 'face', name: 'Beauty Spot', price: 80, variant: 'beauty', color: '#4A3326' },

  // eyes
  { id: 'eyes_01', slot: 'eyes', name: 'Round', price: 0, variant: 'round', color: '#2E2545' },
  { id: 'eyes_02', slot: 'eyes', name: 'Happy', price: 60, variant: 'happy', color: '#2E2545' },
  { id: 'eyes_03', slot: 'eyes', name: 'Sparkle', price: 90, variant: 'sparkle', color: '#2E2545' },
  { id: 'eyes_04', slot: 'eyes', name: 'Wink', price: 70, variant: 'wink', color: '#2E2545' },
  { id: 'eyes_05', slot: 'eyes', name: 'Sleepy', price: 60, variant: 'sleepy', color: '#2E2545' },
  { id: 'eyes_06', slot: 'eyes', name: 'Wide', price: 90, variant: 'wide', color: '#2E2545' },

  // mouth
  { id: 'mouth_01', slot: 'mouth', name: 'Smile', price: 0, variant: 'smile', color: '#2E2545' },
  { id: 'mouth_02', slot: 'mouth', name: 'Grin', price: 70, variant: 'grin', color: '#2E2545' },
  { id: 'mouth_03', slot: 'mouth', name: 'Smirk', price: 70, variant: 'smirk', color: '#2E2545' },
  { id: 'mouth_04', slot: 'mouth', name: 'Gasp', price: 70, variant: 'open', color: '#2E2545' },
  { id: 'mouth_05', slot: 'mouth', name: 'Deadpan', price: 70, variant: 'flat', color: '#2E2545' },

  // hair
  { id: 'hair_01', slot: 'hair', name: 'Short', price: 0, variant: 'short', color: '#3A2B22' },
  { id: 'hair_02', slot: 'hair', name: 'Curly', price: 120, variant: 'curly', color: '#7A4B2A' },
  { id: 'hair_03', slot: 'hair', name: 'Mohawk', price: 150, variant: 'mohawk', color: '#FF3B8D' },
  { id: 'hair_04', slot: 'hair', name: 'Long', price: 140, variant: 'long', color: '#F0C93C' },
  { id: 'hair_05', slot: 'hair', name: 'Buzz', price: 90, variant: 'buzz', color: '#2E2545' },
  { id: 'hair_06', slot: 'hair', name: 'Bun', price: 140, variant: 'bun', color: '#5B3A24' },
  { id: 'hair_07', slot: 'hair', name: 'Ponytail', price: 150, variant: 'ponytail', color: '#C9622E' },
  { id: 'hair_08', slot: 'hair', name: 'Bob', price: 130, variant: 'bob', color: '#1F1A2E' },
  { id: 'hair_09', slot: 'hair', name: 'Afro', price: 170, variant: 'afro', color: '#2A1F18' },

  // clothes (top)
  { id: 'tee_01', slot: 'clothes', name: 'Tee', price: 0, variant: 'tee', color: '#7C4DFF' },
  { id: 'hoodie_01', slot: 'clothes', name: 'Hoodie', price: 130, variant: 'hoodie', color: '#16C4E8' },
  { id: 'jacket_01', slot: 'clothes', name: 'Jacket', price: 160, variant: 'jacket', color: '#FF5B4A' },
  { id: 'tank_01', slot: 'clothes', name: 'Tank', price: 110, variant: 'tank', color: '#2FCB74' },
  { id: 'sweater_01', slot: 'clothes', name: 'Sweater', price: 140, variant: 'sweater', color: '#F0A81E' },
  { id: 'striped_01', slot: 'clothes', name: 'Striped Tee', price: 130, variant: 'striped', color: '#3B6FE0' },
  { id: 'dress_01', slot: 'clothes', name: 'Dress', price: 190, variant: 'dress', color: '#FF6FA8' },
  { id: 'overalls_01', slot: 'clothes', name: 'Overalls', price: 200, requiredLevel: 5, variant: 'overalls', color: '#4A6FA5' },

  // pants (bottoms)
  { id: 'jeans_01', slot: 'pants', name: 'Jeans', price: 0, variant: 'jeans', color: '#4A6FA5' },
  { id: 'shorts_01', slot: 'pants', name: 'Shorts', price: 100, variant: 'shorts', color: '#2FCB74' },
  { id: 'joggers_01', slot: 'pants', name: 'Joggers', price: 130, variant: 'joggers', color: '#6B5F86' },
  { id: 'skirt_01', slot: 'pants', name: 'Skirt', price: 140, variant: 'skirt', color: '#FF6FA8' },
  { id: 'cargo_01', slot: 'pants', name: 'Cargos', price: 160, variant: 'cargo', color: '#7E8B4A' },
  { id: 'leggings_01', slot: 'pants', name: 'Leggings', price: 120, variant: 'leggings', color: '#2E2545' },

  // shoes
  { id: 'sneaker_01', slot: 'shoes', name: 'Sneakers', price: 0, variant: 'sneaker', color: '#FFFFFF' },
  { id: 'boot_01', slot: 'shoes', name: 'Boots', price: 150, variant: 'boot', color: '#6B4028' },
  { id: 'hitop_01', slot: 'shoes', name: 'Hi-Tops', price: 170, variant: 'hitop', color: '#FF5B4A' },
  { id: 'sandal_01', slot: 'shoes', name: 'Sandals', price: 90, variant: 'sandal', color: '#C9A06B' },
  { id: 'loafer_01', slot: 'shoes', name: 'Loafers', price: 130, variant: 'loafer', color: '#2E2545' },

  // hat — no default equipped (null)
  { id: 'cap_01', slot: 'hat', name: 'Cap', price: 90, variant: 'cap', color: '#FF5B4A' },
  { id: 'beanie_01', slot: 'hat', name: 'Beanie', price: 90, variant: 'beanie', color: '#16C4E8' },
  { id: 'party_01', slot: 'hat', name: 'Party Hat', price: 120, variant: 'party', color: '#FFC93C' },
  { id: 'bucket_01', slot: 'hat', name: 'Bucket Hat', price: 130, variant: 'bucket', color: '#7E8B4A' },
  { id: 'band_01', slot: 'hat', name: 'Headband', price: 70, variant: 'headband', color: '#FF3B8D' },
  { id: 'crown_01', slot: 'hat', name: 'Crown', price: 300, requiredLevel: 10, variant: 'crown', color: '#FFC93C' },

  // accessory — no default equipped (null)
  { id: 'glasses_01', slot: 'accessory', name: 'Glasses', price: 100, variant: 'glasses', color: '#2E2545' },
  { id: 'shades_01', slot: 'accessory', name: 'Sunglasses', price: 130, variant: 'sunglasses', color: '#2E2545' },
  { id: 'star_01', slot: 'accessory', name: 'Star Sticker', price: 80, variant: 'star', color: '#FFC93C' },
  { id: 'scarf_01', slot: 'accessory', name: 'Scarf', price: 110, variant: 'scarf', color: '#FF5B4A' },
  { id: 'earring_01', slot: 'accessory', name: 'Earrings', price: 90, variant: 'earrings', color: '#FFC93C' },
  { id: 'cans_01', slot: 'accessory', name: 'Headphones', price: 210, requiredLevel: 5, variant: 'headphones', color: '#7C4DFF' },
];

const BY_ID = new Map(AVATAR_CATALOGUE.map((item) => [item.id, item]));

export const getAvatarItem = (id: string | null): AvatarItem | undefined =>
  id ? BY_ID.get(id) : undefined;

export const itemsForSlot = (slot: AvatarSlot): AvatarItem[] =>
  AVATAR_CATALOGUE.filter((item) => item.slot === slot);
