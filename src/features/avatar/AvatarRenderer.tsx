import { View } from 'react-native';
import Svg, { G } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, stroke } from '@/theme/tokens';
import { getAvatarItem, type AvatarItem } from './catalogue';
import {
  AccessoryPiece,
  BackgroundPiece,
  BodyPiece,
  ClothesPiece,
  EyesPiece,
  FacePiece,
  HairPiece,
  HatPiece,
  MouthPiece,
} from './pieces';
import { SLOT_ORDER, type AvatarConfig, type AvatarSlot } from './types';

/**
 * Composites a full `AvatarConfig` from the layered pieces in pieces.tsx, in
 * `SLOT_ORDER` (background first, accessory last — types.ts is the source of
 * truth for z-order). Draws whatever the config says; it does not check
 * `ownedItemIds` — that's a set-time concern for the shop/customizer, not a
 * render-time one, same split the real Firestore rules will enforce (§12).
 */

function renderSlot(slot: AvatarSlot, itemId: string | null, ink: string) {
  const item = getAvatarItem(itemId);
  if (!item) return null;
  switch (slot) {
    case 'background':
      return <BackgroundPiece color={item.color} />;
    case 'body':
      return <BodyPiece color={item.color} ink={ink} />;
    case 'face':
      return <FacePiece variant={item.variant} color={item.color} />;
    case 'eyes':
      return <EyesPiece variant={item.variant} ink={ink} />;
    case 'mouth':
      return <MouthPiece ink={ink} />;
    case 'hair':
      return <HairPiece variant={item.variant} color={item.color} ink={ink} />;
    case 'clothes':
      return <ClothesPiece variant={item.variant} color={item.color} ink={ink} />;
    case 'hat':
      return <HatPiece variant={item.variant} color={item.color} ink={ink} />;
    case 'accessory':
      return <AccessoryPiece variant={item.variant} color={item.color} ink={ink} />;
  }
}

export function AvatarRenderer({
  config,
  size = 64,
  ring,
}: {
  config: AvatarConfig;
  size?: number;
  ring?: string;
}) {
  const { palette } = useTheme();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: palette.surfaceLow,
        borderWidth: stroke.base,
        borderColor: ring ?? palette.ink,
      }}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        {SLOT_ORDER.map((slot) => (
          <G key={slot}>{renderSlot(slot, config[slot], palette.ink)}</G>
        ))}
      </Svg>
    </View>
  );
}

/** Small standalone preview of one catalogue item, for shop/customizer lists. */
export function ItemThumb({ item, size = 56 }: { item: AvatarItem; size?: number }) {
  const { palette } = useTheme();
  const ink = palette.ink;
  const onHead = (piece: React.ReactNode) => (
    <>
      <BodyPiece color={palette.surfaceHigh} ink={ink} />
      {piece}
    </>
  );

  let piece: React.ReactNode;
  switch (item.slot) {
    case 'background':
      piece = <BackgroundPiece color={item.color} />;
      break;
    case 'body':
      piece = <BodyPiece color={item.color} ink={ink} />;
      break;
    case 'clothes':
      piece = <ClothesPiece variant={item.variant} color={item.color} ink={ink} />;
      break;
    case 'face':
      piece = onHead(<FacePiece variant={item.variant} color={item.color} />);
      break;
    case 'eyes':
      piece = onHead(<EyesPiece variant={item.variant} ink={ink} />);
      break;
    case 'hair':
      piece = onHead(<HairPiece variant={item.variant} color={item.color} ink={ink} />);
      break;
    case 'hat':
      piece = onHead(<HatPiece variant={item.variant} color={item.color} ink={ink} />);
      break;
    case 'accessory':
      piece = onHead(
        <>
          <EyesPiece variant="round" ink={ink} />
          <AccessoryPiece variant={item.variant} color={item.color} ink={ink} />
        </>,
      );
      break;
    case 'mouth':
      piece = <MouthPiece ink={ink} />;
      break;
  }

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
      <Svg width={size} height={size} viewBox="0 0 160 160">
        {piece}
      </Svg>
    </View>
  );
}
