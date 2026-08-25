import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { getAvatarItem } from '@/features/avatar/catalogue';
import { useI18n } from '@/i18n/I18nProvider';
import { useProgression } from '@/stores/progression';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';
import type { AchievementTier } from './achievements';

/**
 * Drops an achievement in from the top of the screen, holds, and leaves.
 *
 * A toast rather than a dialog on purpose: unlocking something is good news
 * that arrives while the player is mid-action, and a modal would make them
 * stop and dismiss a reward. This never blocks anything — tapping it just
 * sends it away early.
 *
 * One banner at a time, queued in the store. Two achievements earned in the
 * same settlement (which happens often, since a payout can cross several
 * thresholds at once) arrive one after the other rather than stacking.
 */

const TIER_COLOR = (p: Palette): Record<AchievementTier, string> => ({
  common: p.onSurfaceVariant,
  rare: p.secondary,
  epic: p.primary,
  legendary: p.medalGold,
});

/** How long a banner sits on screen before leaving of its own accord. */
const HOLD_MS = 3_200;

export function AchievementBanner() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const achievement = useProgression((s) => s.banners[0] ?? null);
  const dismissBanner = useProgression((s) => s.dismissBanner);

  // -1 is fully off-screen above; 0 is resting position.
  const slide = useSharedValue(-1);
  const id = achievement?.id ?? null;

  useEffect(() => {
    if (!id) return;

    slide.value = -1;
    slide.value = withSequence(
      // Springs in with a little overshoot, so it reads as landing rather
      // than sliding to a halt.
      withSpring(0, { damping: 14, stiffness: 160, mass: 0.7 }),
      withDelay(
        HOLD_MS,
        withTiming(-1, { duration: 260 }, (finished) => {
          // Only the timed exit clears the queue. A tap-dismiss cancels this
          // animation, and firing then would drop the *next* banner too.
          if (finished) runOnJS(dismissBanner)();
        }),
      ),
    );
  }, [id, slide, dismissBanner]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: slide.value * 220 }],
    opacity: 1 + Math.min(0, slide.value * 1.4),
  }));

  if (!achievement) return null;

  const tint = TIER_COLOR(palette)[achievement.tier];
  const item = achievement.itemId ? getAvatarItem(achievement.itemId) : undefined;
  const items = t((s) => s.achievements.items) as Record<string, { name: string; description: string }>;
  const name = items[achievement.id]?.name ?? achievement.name;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: spacing.lg,
          right: spacing.lg,
          zIndex: 100,
        },
        style,
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t((s) => s.achievements.dismissLabel)(name)}
        onPress={dismissBanner}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: palette.surface,
          borderWidth: stroke.base,
          borderColor: palette.ink,
          borderBottomWidth: stroke.depth,
          borderBottomColor: tint,
        }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tint,
            borderWidth: stroke.thin,
            borderColor: palette.ink,
          }}>
          <Ionicons
            name={achievement.icon as React.ComponentProps<typeof Ionicons>['name']}
            size={24}
            color={palette.onPrimary}
          />
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" color={tint}>
            {t((s) => s.achievements.unlockedBanner)}
          </Text>
          <Text variant="bodyStrong" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="caption" color={palette.onSurfaceVariant} numberOfLines={1}>
            {[
              achievement.gold > 0 ? t((s) => s.achievements.plusGold)(achievement.gold) : null,
              achievement.xp > 0 ? t((s) => s.achievements.plusXp)(achievement.xp) : null,
              item ? t((s) => s.achievements.itemUnlocked)(item.name) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
