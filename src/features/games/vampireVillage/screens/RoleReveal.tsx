import { View } from 'react-native';

import { Avatar, Button, Card, Label, Row, Screen, Text } from '@/components/ui';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { VVPlayerView } from '../state';

/**
 * Role Reveal — matches the designed "Role Reveal - Seer / Vampire / Bodyguard"
 * screens. One component covers all roles: the design differences are colour
 * and copy, both of which come from `roles.ts` (decision D4).
 *
 * The Villager variant has no design (D6) and reuses this same template.
 */
export function RoleRevealScreen({ view, onAck }: { view: VVPlayerView; onAck: () => void }) {
  const { palette, roleColors } = useTheme();

  const accent = roleColors[view.you.role];
  const acked = view.phase !== 'role_reveal';
  const coven = view.coven?.filter((u) => u !== view.you.uid) ?? [];

  return (
    <Screen>
      <Label center>Your Role</Label>

      <Card accent={accent} style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl }}>
        {/* Placeholder role art — decision D19. The shipped artwork contains
            baked-in fake UI and cannot be used until clean assets exist. */}
        <View
          style={{
            width: 132,
            height: 132,
            borderRadius: radius.xl,
            backgroundColor: palette.surfaceHigh,
            borderWidth: 2,
            borderColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text variant="hero" color={accent} style={{ fontSize: 60 }}>
            {view.you.roleName.charAt(0)}
          </Text>
        </View>

        <Text variant="title" color={accent} center>
          The {view.you.roleName}
        </Text>

        <Text variant="body" color={palette.onSurfaceVariant} center style={{ paddingHorizontal: spacing.md }}>
          {view.you.blurb}
        </Text>
      </Card>

      {coven.length > 0 && (
        <Card accent={palette.error}>
          <Label color={palette.error}>Your coven</Label>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {coven.map((uid) => {
              const p = view.players.find((x) => x.uid === uid);
              if (!p) return null;
              return (
                <Row key={uid}>
                  <Avatar uid={p.uid} name={p.displayName} size={34} ring={palette.error} />
                  <Text variant="bodyStrong">{p.displayName}</Text>
                </Row>
              );
            })}
          </View>
        </Card>
      )}

      <View style={{ flex: 1 }} />

      <Button
        label={acked ? 'Waiting for the others…' : 'Got it'}
        onPress={onAck}
        disabled={acked}
      />
    </Screen>
  );
}
