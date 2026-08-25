import { Screen, Text } from '@/components/ui';
import { RoleSheetScreen } from '@/features/games/vampireVillage/screens/RoleSheet';
import { useI18n } from '@/i18n/I18nProvider';
import { useMyView } from '@/stores/localGame';

export default function RolesRoute() {
  const { t } = useI18n();
  const view = useMyView();
  if (!view) {
    return (
      <Screen>
        <Text variant="title">{t((s) => s.vampireVillage.session.noGameInProgress)}</Text>
      </Screen>
    );
  }
  return <RoleSheetScreen view={view} />;
}
