import { View } from 'react-native';

import { Card, Chip, Label, Row, Screen, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { ROLES, type RoleId } from '../roles';
import type { VVPlayerView } from '../state';

/**
 * Roles — the in-session reference behind the game's "Roles" tab. No design
 * exists for it; built from the primitive kit per decision D20.
 *
 * It shows what every role *does*, never who holds one. Live roles are absent
 * from the projection entirely (§9.1), so this screen cannot leak them even
 * by accident.
 */
export function RoleSheetScreen({ view }: { view: VVPlayerView }) {
  const { palette, roleColors } = useTheme();

  const order: RoleId[] = ['vampire', 'investigator', 'protector', 'villager'];

  return (
    <Screen>
      <Text variant="title">Roles</Text>
      <Text variant="body" color={palette.onSurfaceVariant}>
        What each role can do. Who holds them is for you to work out.
      </Text>

      <View style={{ gap: spacing.md }}>
        {order.map((id) => {
          const role = ROLES[id];
          const mine = view.you.role === id;
          const color = roleColors[id];
          return (
            <Card key={id} accent={mine ? color : undefined}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="heading" color={color}>
                  {role.name}
                </Text>
                <Row gap={spacing.sm}>
                  {mine && <Chip color={color} filled>You</Chip>}
                  <Chip color={role.alignment === 'vampires' ? palette.error : palette.secondary}>
                    {role.alignment === 'vampires' ? 'Vampires' : 'Village'}
                  </Chip>
                </Row>
              </Row>
              <Text variant="body" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
                {role.blurb}
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <Label>{role.night ? `Night action · ${role.night}` : 'No night action'}</Label>
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
