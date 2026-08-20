import { Ionicons } from '@expo/vector-icons';
import { Image, View, type ImageSourcePropType } from 'react-native';

import type { GameId } from '@/features/games/core/types';
import { useTheme } from '@/theme/ThemeProvider';
import { stroke } from '@/theme/tokens';

/**
 * Cartoon key art for the game cards.
 *
 * The illustrations are generated to the §22.4 asset contract — isolated
 * subject, thick uniform outlines, flat fills, no text and no interface
 * elements. They are not the original Stitch art, which decision D19 rejected
 * for baking fake UI into the artwork (§1.8).
 *
 * Every game in `GameId` currently has one, so the fallback below does not
 * render today. It exists so that adding a seventh game is a one-line registry
 * change that does not block on an artist: the card degrades to a tinted panel
 * instead of a hole. It is deliberately trivial for that reason — a fallback
 * nobody exercises should be too simple to rot.
 */

const ART: Partial<Record<GameId, ImageSourcePropType>> = {
  vampireVillage: require('../../../assets/images/games/vampire-village.png'),
  taboo: require('../../../assets/images/games/taboo.png'),
  drawingGuess: require('../../../assets/images/games/sketch-it.png'),
  zarta: require('../../../assets/images/games/zarta.png'),
  story: require('../../../assets/images/games/story.png'),
  detective: require('../../../assets/images/games/detective.png'),
};

export function GameArt({ id, height = 132 }: { id: GameId; height?: number }) {
  const { palette } = useTheme();
  const illustration = ART[id];

  return (
    <View
      // Decorative: the game's name is already in the card's text.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height,
        overflow: 'hidden',
        backgroundColor: palette.surfaceLow,
        borderBottomWidth: stroke.thin,
        borderBottomColor: palette.ink,
      }}>
      {illustration ? (
        // `cover` on a banner-shaped source crops the margins the asset
        // contract asks for, never the subject.
        <Image source={illustration} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="game-controller" size={40} color={palette.onSurfaceVariant} />
        </View>
      )}
    </View>
  );
}
