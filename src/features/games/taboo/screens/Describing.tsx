import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card, Chip, Label, ProgressBar, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';
import type { TabooCardResult, TabooPlayerView } from '../state';
import { teamAccent } from './shared';

/**
 * The screen the whole feature is built around: one word, its five forbidden
 * words, a countdown, and three buttons — Correct, Taboo, Skip.
 *
 * The describer operates all three themselves (see engine.ts's file header for
 * why); everyone else in the room is guessing out loud and has no reason to
 * touch the device. Skip is capped at `view.skipLimit` per turn, exactly the
 * rule that started this feature — the button disables itself rather than
 * erroring, since a control that punishes the tap instead of preventing it is
 * worse than one that just stops being available.
 */
export function DescribingScreen({
  view,
  onMark,
  onTimeUp,
}: {
  view: TabooPlayerView;
  onMark: (result: TabooCardResult) => void;
  onTimeUp: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const accent = teamAccent(palette, view.activeTeam);
  const secondsLeft = useCountdown(view.deadlineAt, onTimeUp);
  const skipsLeft = view.skipLimit - view.skipsUsed;
  const teamName = t((s) => s.taboo.team);

  if (!view.card) {
    // Only reachable for a moment between the deadline firing and the store
    // committing the resulting turn change — never a state to design copy for.
    return <Screen>{null}</Screen>;
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Chip color={accent} filled>
          {t((s) => s.taboo.teamLabel)(teamName[view.activeTeam])}
        </Chip>
        <Text variant="bodyStrong" color={secondsLeft <= 10 ? palette.error : palette.onSurface}>
          {secondsLeft}s
        </Text>
      </Row>
      <ProgressBar
        value={secondsLeft / view.roundSeconds}
        color={secondsLeft <= 10 ? palette.error : accent}
        height={10}
      />

      <Card
        accent={accent}
        style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl, flex: 1, justifyContent: 'center' }}>
        <Label color={palette.onSurfaceVariant}>{t((s) => s.taboo.describing.describeThisWord)}</Label>
        <Text variant="hero" center>
          {view.card.word}
        </Text>

        <View style={{ height: stroke.base, alignSelf: 'stretch', backgroundColor: palette.outlineVariant, marginVertical: spacing.md }} />

        <Label color={palette.error}>{t((s) => s.taboo.describing.forbiddenWords)}</Label>
        <View style={{ gap: spacing.sm, alignItems: 'center' }}>
          {view.card.forbidden.map((word) => (
            <Text key={word} variant="body" color={palette.onSurfaceVariant}>
              {word}
            </Text>
          ))}
        </View>
      </Card>

      <Text variant="caption" color={palette.onSurfaceVariant} center>
        {t((s) => s.taboo.describing.skipsLeft)(skipsLeft)}
      </Text>

      <Row gap={spacing.sm} style={{ alignItems: 'stretch' }}>
        <ActionButton
          label={t((s) => s.taboo.describing.skip)}
          icon="play-skip-forward"
          color={palette.onSurfaceVariant}
          disabled={skipsLeft <= 0}
          onPress={() => onMark('skip')}
        />
        <ActionButton label={t((s) => s.taboo.describing.tabu)} icon="close-circle" color={palette.error} onPress={() => onMark('tabu')} />
        <ActionButton
          label={t((s) => s.taboo.describing.correct)}
          icon="checkmark-circle"
          color={palette.success}
          onPress={() => onMark('correct')}
        />
      </Row>
    </Screen>
  );
}

/**
 * Ticks from `deadlineAt` rather than counting down from a fixed constant —
 * the deadline is the server-authoritative fact (§9), and a client-side
 * `roundSeconds` timer would drift from it after any pause or backgrounding.
 * Fires `onExpire` once, the same edge-triggered rule the discussion clock in
 * Vampire Village's Day screen uses.
 */
function useCountdown(deadlineAt: number, onExpire: () => void): number {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)));

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      return remaining;
    };

    if (tick() <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onExpire();
      return;
    }

    const id = setInterval(() => {
      if (tick() <= 0) {
        clearInterval(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(id);
    // `onExpire` is a store action (stable identity) — only a new deadline
    // should restart the clock, not every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineAt]);

  return secondsLeft;
}

function ActionButton({
  label,
  icon,
  color,
  disabled,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        buttonStyle(palette),
        {
          borderColor: disabled ? palette.outlineVariant : palette.ink,
          backgroundColor: disabled ? palette.surfaceLow : palette.surface,
          opacity: disabled ? 0.5 : 1,
        },
        pressed &&
          !disabled && {
            borderBottomWidth: stroke.depthPressed,
            transform: [{ translateY: stroke.depth - stroke.depthPressed }],
          },
      ]}>
      <Ionicons name={icon} size={26} color={disabled ? palette.onSurfaceVariant : color} />
      <Text variant="bodyStrong" color={disabled ? palette.onSurfaceVariant : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

const buttonStyle = (p: Palette) => ({
  flex: 1,
  gap: spacing.xs,
  paddingVertical: spacing.lg,
  borderRadius: radius.lg,
  borderWidth: stroke.base,
  borderBottomWidth: stroke.depth,
  alignItems: 'center' as const,
});
