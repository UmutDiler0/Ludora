import { Screen, Text } from '@/components/ui';
import { EventLogScreen } from '@/features/games/vampireVillage/screens/EventLog';
import { useI18n } from '@/i18n/I18nProvider';
import { useMyView } from '@/stores/localGame';

export default function LogRoute() {
  const { t } = useI18n();
  const view = useMyView();
  if (!view) {
    return (
      <Screen>
        <Text variant="title">{t((s) => s.vampireVillage.session.noGameInProgress)}</Text>
      </Screen>
    );
  }
  return <EventLogScreen view={view} />;
}
