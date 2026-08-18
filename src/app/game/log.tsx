import { Screen, Text } from '@/components/ui';
import { EventLogScreen } from '@/features/games/vampireVillage/screens/EventLog';
import { useMyView } from '@/stores/localGame';

export default function LogRoute() {
  const view = useMyView();
  if (!view) {
    return (
      <Screen>
        <Text variant="title">No game in progress</Text>
      </Screen>
    );
  }
  return <EventLogScreen view={view} />;
}
