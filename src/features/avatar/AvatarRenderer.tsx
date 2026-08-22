import { View } from 'react-native';
import Svg, { G } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, stroke } from '@/theme/tokens';
import { getAvatarItem, type AvatarItem } from './catalogue';
import { buildMetrics, VIEWBOX, type BuildMetrics } from './geometry';
import {
  AccessoryPiece,
  BackgroundPiece,
  BodyPiece,
  ClothesPiece,
  EyesPiece,
  FacePiece,
  FacialHairPiece,
  HairPiece,
  HatPiece,
  MouthPiece,
  PantsPiece,
  ShoesPiece,
} from './pieces';
import { normalizeAvatar, SLOT_ORDER, type AvatarConfig, type AvatarSlot } from './types';

/**
 * Composites an `AvatarConfig` from the layered pieces in pieces.tsx, in
 * `SLOT_ORDER` (background first, accessory last — types.ts is the source of
 * truth for z-order).
 *
 * There is one drawing and two crops. `full` shows the whole figure for the
 * customizer, the shop try-on and sign-up; `bust` frames the head and shoulders
 * for the circular avatars in lists and leaderboards. Both read the same
 * config, so a hat cannot look correct in one place and wrong in the other —
 * which is the failure mode a separate portrait asset would have introduced.
 *
 * It draws whatever the config says and does not check `ownedItemIds`. That is
 * a set-time concern for the shop and customizer, not a render-time one — the
 * same split the real Firestore rules will enforce (§12).
 */

export type AvatarMode = 'bust' | 'full';

function renderSlot(slot: AvatarSlot, itemId: string | null, ink: string, build: BuildMetrics) {
  // `build` is a silhouette modifier every other piece reads, not a layer.
  if (slot === 'build') return null;

  const item = getAvatarItem(itemId);
  if (!item) return null;

  switch (slot) {
    case 'background':
      return <BackgroundPiece color={item.color} />;
    case 'body':
      return <BodyPiece color={item.color} ink={ink} build={build} />;
    case 'pants':
      return <PantsPiece variant={item.variant} color={item.color} ink={ink} build={build} />;
    case 'shoes':
      return <ShoesPiece variant={item.variant} color={item.color} ink={ink} build={build} />;
    case 'clothes':
      return <ClothesPiece variant={item.variant} color={item.color} ink={ink} build={build} />;
    case 'face':
      return <FacePiece variant={item.variant} color={item.color} />;
    case 'eyes':
      return <EyesPiece variant={item.variant} ink={ink} />;
    case 'facialHair':
      return <FacialHairPiece variant={item.variant} color={item.color} ink={ink} />;
    case 'mouth':
      return <MouthPiece variant={item.variant} ink={ink} />;
    case 'hair':
      return <HairPiece variant={item.variant} color={item.color} ink={ink} />;
    case 'hat':
      return <HatPiece variant={item.variant} color={item.color} ink={ink} />;
    case 'accessory':
      return <AccessoryPiece variant={item.variant} color={item.color} ink={ink} />;
  }
}

/** The layered figure, without any framing. Shared by every consumer below. */
function Figure({ config, ink }: { config: AvatarConfig; ink: string }) {
  const build = buildMetrics(getAvatarItem(config.build)?.variant);
  return (
    <>
      {SLOT_ORDER.map((slot) => (
        <G key={slot}>{renderSlot(slot, config[slot], ink, build)}</G>
      ))}
    </>
  );
}

export function AvatarRenderer({
  config,
  size = 64,
  mode = 'bust',
  ring,
  background = true,
  border = true,
}: {
  config: Partial<AvatarConfig>;
  /** Width for `full`, diameter for `bust`. */
  size?: number;
  mode?: AvatarMode;
  ring?: string;
  /**
   * False drops the equipped background piece and the wrapper's own backdrop
   * fill, so the figure sits on whatever is behind it instead — a colored
   * disc reads as a second background when the avatar already sits on a
   * card/row surface, e.g. the leaderboard's list rows and podium.
   */
  background?: boolean;
  /** False drops the ink outline frame — pairs with `background={false}` for a bare cutout. */
  border?: boolean;
}) {
  const { palette } = useTheme();
  const full = normalizeAvatar(config);
  const displayConfig = background ? full : { ...full, background: null };
  const isFull = mode === 'full';

  // The full body is 160 × 280, so its frame has to be taller than it is wide;
  // forcing it square would either letterbox the figure or crop its feet.
  //
  // The border width is subtracted before applying the ratio and added back
  // after. React Native borders are drawn inside the box, so the SVG's actual
  // viewport is `size - 2 × borderWidth`; scaling the outer box to 160:280
  // leaves the inner box a slightly different shape, and `meet` then
  // letterboxes it — which is the sliver of the old background that showed
  // above and below the figure.
  const borderWidth = border ? stroke.base : 0;
  const height = isFull ? ((size - borderWidth * 2) * 280) / 160 + borderWidth * 2 : size;

  return (
    <View
      style={{
        width: size,
        height,
        borderRadius: isFull ? radius.lg : size / 2,
        overflow: 'hidden',
        backgroundColor: background ? palette.surfaceLow : 'transparent',
        borderWidth,
        borderColor: ring ?? palette.ink,
      }}>
      <Svg width="100%" height="100%" viewBox={isFull ? VIEWBOX.full : VIEWBOX.bust}>
        <Figure config={displayConfig} ink={palette.ink} />
      </Svg>
    </View>
  );
}

/**
 * The window each slot's thumbnail frames.
 *
 * A pair of shoes shown inside a whole-body thumbnail is four pixels tall and
 * unsellable, so every slot crops to the part of the figure it changes.
 */
const THUMB_VIEWBOX: Record<AvatarSlot, string> = {
  background: '0 0 160 280',
  build: '0 60 160 220',
  body: '20 10 120 120',
  face: '38 28 84 84',
  eyes: '38 24 84 72',
  mouth: '46 44 68 60',
  facialHair: '42 40 76 68',
  hair: '20 4 120 110',
  hat: '20 0 120 100',
  accessory: '20 14 120 120',
  clothes: '16 84 128 118',
  pants: '16 148 128 116',
  shoes: '16 208 128 74',
};

/**
 * Preview of one catalogue item on a neutral mannequin.
 *
 * The item is always shown *worn*, never floating: a jacket's shape only means
 * something on shoulders, and shoes only read as shoes with legs above them.
 * The mannequin uses the default build and skin so two items in the same grid
 * are compared against an identical baseline.
 */
export function ItemThumb({ item, size = 56 }: { item: AvatarItem; size?: number }) {
  const { palette } = useTheme();

  // Everything default except the slot being sold, so nothing else competes.
  // The pinned background must come FIRST: spread the other way round and a
  // background item overwrites itself with the default, which is why every
  // background in the shop looked identical.
  const config = normalizeAvatar({ background: 'bg_01', [item.slot]: item.id });

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: palette.surfaceLow,
        borderWidth: stroke.thin,
        borderColor: palette.ink,
      }}>
      <Svg width="100%" height="100%" viewBox={THUMB_VIEWBOX[item.slot]} preserveAspectRatio="xMidYMid slice">
        <Figure config={config} ink={palette.ink} />
      </Svg>
    </View>
  );
}
