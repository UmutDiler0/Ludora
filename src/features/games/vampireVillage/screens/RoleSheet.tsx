import { View } from 'react-native';

import { Card, Chip, Label, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { t } = useI18n();

  const order: RoleId[] = ['vampire', 'investigator', 'protector', 'villager'];
  const roleNames = t((s) => s.vampireVillage.role);
  const alignmentLabel = t((s) => s.vampireVillage.alignment);
  const abilityLabel = t((s) => s.vampireVillage.nightAbility);

  return (
    <Screen>
      <Text variant="title">{t((s) => s.vampireVillage.roleSheet.title)}</Text>
      <Text variant="body" color={palette.onSurfaceVariant}>
        {t((s) => s.vampireVillage.roleSheet.subtitle)}
      </Text>

      <View style={{ gap: spacing.md }}>
        {order.map((id) => {
          const role = ROLES[id];
          const name = roleNames[id];
          const mine = view.you.role === id;
          const color = roleColors[id];
          return (
            <Card key={id} accent={mine ? color : undefined}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="heading" color={color}>
                  {name.name}
                </Text>
                <Row gap={spacing.sm}>
                  {mine && <Chip color={color} filled>{t((s) => s.vampireVillage.roleSheet.you)}</Chip>}
                  <Chip color={role.alignment === 'vampires' ? palette.error : palette.secondary}>
                    {alignmentLabel[role.alignment]}
                  </Chip>
                </Row>
              </Row>
              <Text variant="body" color={palette.onSurfaceVariant} style={{ marginTop: spacing.sm }}>
                {name.blurb}
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <Label>
                  {role.night
                    ? t((s) => s.vampireVillage.roleSheet.nightAction)(abilityLabel[role.night])
                    : t((s) => s.vampireVillage.roleSheet.noNightAction)}
                </Label>
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
