import { Ionicons } from '@expo/vector-icons';
import { Image, View, type ImageSourcePropType } from 'react-native';

import type { GameId } from '@/features/games/core/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, stroke } from '@/theme/tokens';
import { AgentArt, ImposterArt } from './gameArtIllustrations';

/**
 * Cartoon key art for the game cards.
 *
 * The illustrations are generated to the §22.4 asset contract — isolated
 * subject, thick uniform outlines, flat fills, no text and no interface
 * elements. They are not the original Stitch art, which decision D19 rejected
 * for baking fake UI into the artwork (§1.8).
 *
 * Two tiers below `ART`, in the order they're tried: a raster PNG (the real
 * asset), then a hand-coded SVG from `gameArtIllustrations.tsx` for a game
 * that has rules but no exported art yet — there is no image-generation tool
 * available, so a new game gets art in the kit's own ink-outline language
 * instead of sitting behind the generic icon below. The icon fallback exists
 * for the gap before even that exists — adding a game is a one-line registry
 * change that does not block on art at all, if it has to.
 */

const ART: Partial<Record<GameId, ImageSourcePropType>> = {
  vampireVillage: require('../../../assets/images/games/vampire-village.png'),
  taboo: require('../../../assets/images/games/taboo.png'),
  drawingGuess: require('../../../assets/images/games/sketch-it.png'),
  zarta: require('../../../assets/images/games/zarta.png'),
  story: require('../../../assets/images/games/story.png'),
  detective: require('../../../assets/images/games/detective.png'),
};

const SVG_ART: Partial<Record<GameId, typeof AgentArt>> = {
  agent: AgentArt,
  imposter: ImposterArt,
};

export function GameArt({ id, height = 132 }: { id: GameId; height?: number }) {
  const { palette } = useTheme();
  const illustration = ART[id];
  const SvgIllustration = SVG_ART[id];

  return (
    <View
      // Decorative: the game's name is already in the card's text.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height,
        overflow: 'hidden',
        // Belt-and-braces with the card shell's own overflow:hidden — Android
        // doesn't always clip a nested Image to a parent's rounded corners,
        // so the art carries the same top radius itself rather than relying
        // on the shell alone.
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        backgroundColor: palette.surfaceLow,
        borderBottomWidth: stroke.thin,
        borderBottomColor: palette.ink,
      }}>
      {illustration ? (
        // `cover` on a banner-shaped source crops the margins the asset
        // contract asks for, never the subject.
        <Image
          source={illustration}
          resizeMode="cover"
          style={{
            width: '100%',
            height: '100%',
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
          }}
        />
      ) : SvgIllustration ? (
        <SvgIllustration />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="game-controller" size={40} color={palette.onSurfaceVariant} />
        </View>
      )}
    </View>
  );
}
