import { Screen, Text } from '@/components/ui';
import { RoleSheetScreen } from '@/features/games/vampireVillage/screens/RoleSheet';
import { useMyView } from '@/stores/localGame';

export default function RolesRoute() {
  const view = useMyView();
  if (!view) {
    return (
      <Screen>
        <Text variant="title">No game in progress</Text>
      </Screen>
    );
  }
  return <RoleSheetScreen view={view} />;
}
