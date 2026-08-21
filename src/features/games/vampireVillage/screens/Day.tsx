import { Pressable, View } from 'react-native';

import { Avatar, Button, Card, Chip, Label, Row, Screen, Text } from '@/components/ui';
import { useChat } from '@/stores/chat';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';
import { ROLES } from '../roles';
import type { VVPlayerView } from '../state';

/**
 * Day Phase — the designed "Day Phase - Discussion & Voting" screen.
 *
 * Discussion and voting are one screen with two states, as the design shows:
 * the phase card switches and the Vote buttons become live.
 *
 * Player state vocabulary is Alive / Eliminated throughout (decision D17) —
 * the design used "Alive" for the viewer and "Active" for everyone else.
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

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Text variant="title">Town Square</Text>
        <Text variant="body" color={palette.onSurfaceVariant}>
          Discuss and vote to exile suspected vampires. Choose wisely.
        </Text>
      </View>

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
