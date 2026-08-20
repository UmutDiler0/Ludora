import { Pressable, View } from 'react-native';

import { Avatar, Button, Card, Chip, Label, Row, Screen, Text } from '@/components/ui';
import { radius, spacing, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { ROLES } from '../roles';
import type { VVPlayerView } from '../state';

/**
 * Night Phase — covers the designed "Night Phase - Vampire / Seer / Bodyguard
 * Turn" screens.
 *
 * These are simultaneous, not sequential: online, every player only ever sees
 * their own role's night screen, so all night actors act during one phase and
 * the engine resolves them together (which is what lets protection cancel a
 * kill regardless of submission order).
 */

const PROMPT: Record<string, { title: string; instruction: string }> = {
  vampire: { title: 'Choose your prey', instruction: 'Select a villager to drain tonight.' },
  investigator: { title: 'Look into a soul', instruction: 'Select a player to reveal their alignment.' },
  protector: { title: 'Stand watch', instruction: 'Select a player to protect until dawn. You may guard yourself.' },
};

export function NightScreen({
  view,
  onSelect,
}: {
  view: VVPlayerView;
  onSelect: (uid: string) => void;
}) {
  const { palette, roleColors } = useTheme();

  const accent = roleColors[view.you.role];
  const ability = ROLES[view.you.role].night;
  const prompt = ability ? PROMPT[view.you.role] : null;
  const submitted = view.yourNightTarget !== null;

  const selectable = view.players.filter((p) => {
    if (!p.alive) return false;
    if (view.you.role === 'investigator' && p.uid === view.you.uid) return false;
    if (view.you.role === 'vampire' && view.coven?.includes(p.uid)) return false;
    if (view.you.role !== 'protector' && p.uid === view.you.uid) return false;
    return true;
  });

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="title">Night {view.round}</Text>
        <Chip color={accent}>{view.you.roleName}</Chip>
      </Row>

      {!view.you.alive ? (
        <Card accent={palette.outlineVariant}>
          <Label>Eliminated</Label>
          <Text variant="body" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
            You are out of the game, but you can still watch it play out.
          </Text>
        </Card>
      ) : !prompt ? (
        <Card>
          <Label>Sleep tight</Label>
          <Text variant="body" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
            Villagers have no night action. Wait for dawn and pay attention to what happens.
          </Text>
        </Card>
      ) : (
        <>
          <Card accent={accent}>
            <Label color={accent}>{prompt.title}</Label>
            <Text variant="body" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
              {prompt.instruction}
            </Text>
          </Card>

          <View style={{ gap: spacing.sm }}>
            {selectable.map((p) => {
              const chosen = view.yourNightTarget === p.uid;
              return (
                <Pressable
                  key={p.uid}
                  accessibilityRole="button"
                  accessibilityState={{ selected: chosen }}
                  disabled={submitted}
                  onPress={() => onSelect(p.uid)}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      borderRadius: radius.md,
                      borderWidth: stroke.base,
                      borderColor: palette.ink,
                      // The chosen target sinks and takes the role's colour.
                      borderBottomWidth: chosen ? stroke.depthPressed : stroke.depth,
                      borderBottomColor: chosen ? accent : palette.ink,
                      backgroundColor: chosen ? palette.surfaceHigh : palette.surface,
                      transform: [{ translateY: chosen ? stroke.depth - stroke.depthPressed : 0 }],
                      opacity: submitted && !chosen ? 0.45 : pressed ? 0.9 : 1,
                    },
                  ]}>
                  <Avatar uid={p.uid} name={p.displayName} ring={chosen ? accent : undefined} />
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {p.uid === view.you.uid ? 'Yourself' : p.displayName}
                  </Text>
                  {chosen && <Chip color={accent}>Chosen</Chip>}
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <View style={{ flex: 1 }} />

      {submitted && (
        <Button label="Waiting for the others…" disabled onPress={() => {}} tone="ghost" />
      )}
    </Screen>
  );
}
