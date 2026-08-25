import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Vibration, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Avatar, Button, Card, Chip, Label, ProgressBar, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { useChat } from '@/stores/chat';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';
import type { VVPlayerView } from '../state';

const DISCUSSION_SECONDS = 10;
/** Three short buzzes: buzz, pause, buzz, pause, buzz. */
const TIME_UP_PATTERN = [0, 200, 120, 200, 120, 200];

/**
 * True when `uid` is a fellow vampire, in the eyes of the current viewer.
 *
 * `view.coven` is `null` for anyone who is not a vampire — stripped by
 * `projectFor` before the view ever leaves the server (§9.1) — so this is
 * unconditionally false for a villager. There is no branch here that could
 * leak it to one; the projection already decided that upstream.
 */
const isCovenMate = (view: VVPlayerView, uid: string): boolean => !!view.coven?.includes(uid);

/**
 * Day Phase — the designed "Day Phase - Discussion & Voting" screen.
 *
 * Discussion and voting are one screen with two states, as the design shows:
 * the phase card switches and the Vote buttons become live.
 *
 * Player state vocabulary is Alive / Eliminated throughout (decision D17) —
 * the design used "Alive" for the viewer and "Active" for everyone else.
 *
 * The discussion clock is new: local to this screen (no engine/server state),
 * it resets whenever `day_discussion` becomes active and, on expiry, vibrates
 * three times and opens voting itself — the same thing the manual "Open
 * voting" button already did, just on a clock instead of on trust that
 * someone remembers to tap it.
 */
export function DayScreen({
  view,
  onVote,
  onOpenVoting,
}: {
  view: VVPlayerView;
  onVote: (uid: string) => void;
  onOpenVoting: () => void;
}) {
  const { palette, roleColors } = useTheme();
  const { t } = useI18n();
  const s = makeStyles(palette);
  const openChat = useChat((state) => state.open);

  const voting = view.phase === 'day_vote';
  const canVote = voting && view.you.alive;
  const secondsLeft = useDiscussionClock(!voting, onOpenVoting);

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Text variant="title">{t((s) => s.vampireVillage.day.townSquare)}</Text>
        <Text variant="body" color={palette.onSurfaceVariant}>
          {t((s) => s.vampireVillage.day.subtitle)}
        </Text>
      </View>

      {!voting && <DiscussionClock secondsLeft={secondsLeft} />}

      <Card accent={palette.secondary}>
        <Label color={palette.secondary}>{t((s) => s.vampireVillage.day.currentPhase)}</Label>
        <Text variant="heading" style={{ marginTop: spacing.xs }}>
          {voting ? t((s) => s.vampireVillage.day.voting) : t((s) => s.vampireVillage.day.discussion)}
        </Text>
        {!view.you.alive && (
          <Text variant="caption" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
            {t((s) => s.vampireVillage.day.eliminatedNotice)}
          </Text>
        )}
      </Card>

      <View style={{ gap: spacing.sm }}>
        {view.players.map((p) => {
          const isMe = p.uid === view.you.uid;
          const votes = view.voteCounts?.[p.uid] ?? 0;
          const chosen = view.yourVote === p.uid;
          // Only ever true for a vampire looking at the list — see isCovenMate.
          const coven = isCovenMate(view, p.uid);

          if (!p.alive) {
            return (
              <Row key={p.uid} style={s.rowDead}>
                <Avatar uid={p.uid} name={p.displayName} dimmed />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodyStrong"
                    color={coven ? roleColors.vampire : palette.outline}
                    style={{ textDecorationLine: 'line-through' }}>
                    {p.displayName}
                  </Text>
                  <Text variant="caption" color={palette.outline}>
                    {t((s) => s.vampireVillage.day.eliminated)(p.role ? t((s) => s.vampireVillage.role)[p.role].name : undefined)}
                  </Text>
                </View>
              </Row>
            );
          }

          return (
            <Pressable
              key={p.uid}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canVote || isMe, selected: chosen }}
              disabled={!canVote || isMe}
              onPress={() => onVote(p.uid)}
              style={({ pressed }) => [
                s.row,
                {
                  borderBottomColor: chosen ? palette.secondary : palette.ink,
                  borderBottomWidth: chosen ? stroke.depthPressed : stroke.depth,
                  backgroundColor: chosen ? palette.surfaceHigh : palette.surface,
                  transform: [{ translateY: chosen ? stroke.depth - stroke.depthPressed : 0 }],
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <Avatar
                uid={p.uid}
                name={p.displayName}
                ring={isMe ? palette.primaryContainer : undefined}
              />
              <View style={{ flex: 1 }}>
                <Row gap={spacing.xs}>
                  <Text variant="bodyStrong" color={coven ? roleColors.vampire : undefined}>
                    {isMe ? t((s) => s.vampireVillage.day.you) : p.displayName}
                  </Text>
                  {/* A vampire's own tell, visible only to their coven — the game's
                      one piece of secret shared knowledge rendered in the UI
                      rather than left to be remembered from the reveal screen. */}
                  {coven && !isMe && (
                    <Ionicons name="skull" size={12} color={roleColors.vampire} />
                  )}
                </Row>
                <Text variant="caption" color={palette.onSurfaceVariant}>
                  {t((s) => s.vampireVillage.day.alive)}
                </Text>
              </View>

              {voting && votes > 0 && (
                <Chip color={palette.secondary} filled={chosen}>
                  {t((s) => s.vampireVillage.day.votesCount)(votes)}
                </Chip>
              )}
              {canVote && !isMe && !chosen && <Chip color={palette.secondary}>{t((s) => s.vampireVillage.day.vote)}</Chip>}
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* The chat control moved to the session header, where it is reachable
          from every phase rather than only from this one. */}
      <Button label={t((s) => s.vampireVillage.day.openChat)} icon="chatbubbles" tone="ghost" onPress={openChat} />

      {!voting && <Button label={t((s) => s.vampireVillage.day.openVoting)} onPress={onOpenVoting} />}
    </Screen>
  );
}

/**
 * Counts down from `DISCUSSION_SECONDS` while `active`, vibrating and firing
 * `onExpire` exactly once when it hits zero. Resets on every rising edge of
 * `active`, so a new day's discussion always gets the full clock.
 *
 * The tick and the zero-side-effects are two separate effects on purpose:
 * calling `onExpire` (a store action that updates other components) from
 * inside `setSecondsLeft`'s functional updater ran it during React's render
 * phase for this component, which is exactly what triggered "Cannot update a
 * component while rendering a different component". Moving it to its own
 * effect that reacts to `secondsLeft` hitting 0 defers it to after commit,
 * where a store update is safe.
 */
function useDiscussionClock(active: boolean, onExpire: () => void): number {
  const [secondsLeft, setSecondsLeft] = useState(DISCUSSION_SECONDS);

  useEffect(() => {
    if (!active) return;
    setSecondsLeft(DISCUSSION_SECONDS);

    const id = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active || secondsLeft > 0) return;
    Vibration.vibrate(TIME_UP_PATTERN);
    onExpire();
    // `onExpire` is a store action (stable identity); including it would not
    // change how often this fires, but omitting it keeps the guard's intent
    // (fire once per rising edge of "hit zero") explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, secondsLeft]);

  return secondsLeft;
}

/** Hourglass + depleting bar, pinned to the top of the screen per the discussion phase. */
function DiscussionClock({ secondsLeft }: { secondsLeft: number }) {
  const { palette } = useTheme();
  const urgent = secondsLeft <= 3;
  const tilt = useSharedValue(0);

  useEffect(() => {
    // A gentle rock rather than a full flip — this is a clock ticking, not an
    // hourglass being turned over.
    tilt.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 320, easing: Easing.inOut(Easing.quad) }),
        withTiming(10, { duration: 320, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [tilt]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));
  const tone = urgent ? palette.error : palette.secondary;

  return (
    <Row gap={spacing.sm}>
      <Animated.View style={iconStyle}>
        <Ionicons name="hourglass-outline" size={20} color={tone} />
      </Animated.View>
      <View style={{ flex: 1 }}>
        <ProgressBar value={secondsLeft / DISCUSSION_SECONDS} color={tone} height={10} />
      </View>
      <Text variant="bodyStrong" color={tone} style={{ width: 28, textAlign: 'right' }}>
        {secondsLeft}s
      </Text>
    </Row>
  );
}

const makeStyles = (p: Palette) => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: stroke.base,
    borderColor: p.ink,
  },
  rowDead: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: stroke.thin,
    borderStyle: 'dashed' as const,
    borderColor: p.outlineVariant,
    backgroundColor: p.surfaceHigh,
  },
});
