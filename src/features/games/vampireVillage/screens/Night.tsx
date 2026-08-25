import { Pressable, View } from 'react-native';

import { Avatar, Button, Card, Chip, Label, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
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

export function NightScreen({
  view,
  onSelect,
}: {
  view: VVPlayerView;
  onSelect: (uid: string) => void;
}) {
  const { palette, roleColors } = useTheme();
  const { t } = useI18n();

  const accent = roleColors[view.you.role];
  const ability = ROLES[view.you.role].night;
  const role = t((s) => s.vampireVillage.role)[view.you.role];
  const prompts = t((s) => s.vampireVillage.night.prompt);
  const prompt = ability ? (prompts as Record<string, { title: string; instruction: string }>)[view.you.role] : null;
  const submitted = view.yourNightTarget !== null;

  // Only ever populated for a vampire — `view.coven` is null for everyone
  // else, stripped by `projectFor` before the view leaves the server (§9.1).
  const covenMates = (view.coven ?? [])
    .filter((uid) => uid !== view.you.uid)
    .map((uid) => view.players.find((p) => p.uid === uid))
    .filter((p): p is (typeof view.players)[number] => !!p && p.alive);

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
        <Text variant="title">{t((s) => s.vampireVillage.night.title)(view.round)}</Text>
        <Chip color={accent}>{role.name}</Chip>
      </Row>

      {!view.you.alive ? (
        <Card accent={palette.outlineVariant}>
          <Label>{t((s) => s.vampireVillage.night.eliminated)}</Label>
          <Text variant="body" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
            {t((s) => s.vampireVillage.night.eliminatedBody)}
          </Text>
        </Card>
      ) : !prompt ? (
        <Card>
          <Label>{t((s) => s.vampireVillage.night.sleepTight)}</Label>
          <Text variant="body" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
            {t((s) => s.vampireVillage.night.sleepTightBody)}
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

          {covenMates.length > 0 && (
            <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
              <Text variant="caption" color={palette.onSurfaceVariant}>
                {t((s) => s.vampireVillage.night.yourCoven)}
              </Text>
              {covenMates.map((mate) => (
                <Text key={mate.uid} variant="bodyStrong" color={roleColors.vampire}>
                  {mate.displayName}
                </Text>
              ))}
            </Row>
          )}

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
                    {p.uid === view.you.uid ? t((s) => s.vampireVillage.night.yourself) : p.displayName}
                  </Text>
                  {chosen && <Chip color={accent}>{t((s) => s.vampireVillage.night.chosen)}</Chip>}
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <View style={{ flex: 1 }} />

      {submitted && (
        <Button label={t((s) => s.vampireVillage.night.waitingForOthers)} disabled onPress={() => {}} tone="ghost" />
      )}
    </Screen>
  );
}
