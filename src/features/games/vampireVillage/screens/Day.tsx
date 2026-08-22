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
import { useChat } from '@/stores/chat';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';
import { ROLES } from '../roles';
import type { VVPlayerView } from '../state';

const DISCUSSION_SECONDS = 10;
/** Three short buzzes: buzz, pause, buzz, pause, buzz. */
const TIME_UP_PATTERN = [0, 200, 120, 200, 120, 200];

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
  const { palette } = useTheme();
  const s = makeStyles(palette);
  const openChat = useChat((state) => state.open);

  const voting = view.phase === 'day_vote';
  const canVote = voting && view.you.alive;
  const secondsLeft = useDiscussionClock(!voting, onOpenVoting);

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Text variant="title">Town Square</Text>
        <Text variant="body" color={palette.onSurfaceVariant}>
          Discuss and vote to exile suspected vampires. Choose wisely.
        </Text>
      </View>

      {!voting && <DiscussionClock secondsLeft={secondsLeft} />}

      <Card accent={palette.secondary}>
        <Label color={palette.secondary}>Current phase</Label>
        <Text variant="heading" style={{ marginTop: spacing.xs }}>
          {voting ? 'Voting' : 'Discussion'}
        </Text>
        {!view.you.alive && (
          <Text variant="caption" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
            You have been eliminated. You can watch, but not vote.
          </Text>
        )}
      </Card>

      <View style={{ gap: spacing.sm }}>
        {view.players.map((p) => {
          const isMe = p.uid === view.you.uid;
          const votes = view.voteCounts?.[p.uid] ?? 0;
          const chosen = view.yourVote === p.uid;

          if (!p.alive) {
            return (
              <Row key={p.uid} style={s.rowDead}>
                <Avatar uid={p.uid} name={p.displayName} dimmed />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodyStrong"
                    color={palette.outline}
                    style={{ textDecorationLine: 'line-through' }}>
                    {p.displayName}
                  </Text>
                  <Text variant="caption" color={palette.outline}>
                    Eliminated{p.role ? ` · ${ROLES[p.role].name}` : ''}
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
                <Text variant="bodyStrong">{isMe ? 'You' : p.displayName}</Text>
                <Text variant="caption" color={palette.onSurfaceVariant}>
                  Alive
                </Text>
              </View>

              {voting && votes > 0 && (
                <Chip color={palette.secondary} filled={chosen}>
                  {`${votes} ${votes === 1 ? 'vote' : 'votes'}`}
                </Chip>
              )}
              {canVote && !isMe && !chosen && <Chip color={palette.secondary}>Vote</Chip>}
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* The chat control moved to the session header, where it is reachable
          from every phase rather than only from this one. */}
      <Button label="Open chat" icon="chatbubbles" tone="ghost" onPress={openChat} />

      {!voting && <Button label="Open voting" onPress={onOpenVoting} />}
    </Screen>
  );
}

/**
 * Counts down from `DISCUSSION_SECONDS` while `active`, vibrating and firing
 * `onExpire` exactly once when it hits zero. Resets on every rising edge of
 * `active`, so a new day's discussion always gets the full clock.
 */
function useDiscussionClock(active: boolean, onExpire: () => void): number {
  const [secondsLeft, setSecondsLeft] = useState(DISCUSSION_SECONDS);

  useEffect(() => {
    if (!active) return;
    setSecondsLeft(DISCUSSION_SECONDS);

    const id = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearInterval(id);
          Vibration.vibrate(TIME_UP_PATTERN);
          onExpire();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(id);
    // `onExpire` is a store action (stable identity) — only `active`'s rising
    // edge should restart the clock, not every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

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
