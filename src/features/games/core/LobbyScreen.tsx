import { View } from 'react-native';

import { Avatar, Button, Card, Chip, Label, ListRow, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/**
 * The room lobby every game's setup screen now lands on instead of starting
 * straight into play (§ config-then-lobby-then-start). Local-only today —
 * every seat is already filled the moment the screen mounts, and "the room
 * owner" is trivially you — but the shape (a seated roster the owner reviews
 * before tapping Start) is exactly what a real networked room will be, so
 * when `RealtimeTransport` lands this screen's props are what a lobby
 * subscription will feed rather than what a setup screen hands over locally.
 */

export interface LobbySeat {
  uid: string;
  name: string;
  isOwner?: boolean;
  /** e.g. a Taboo team name — shown in place of the default "Ready" subtitle. */
  meta?: string;
}

export function LobbyScreen({
  title,
  subtitle,
  seats,
  summary,
  onBack,
  onStart,
  starting,
}: {
  title: string;
  subtitle: string;
  seats: LobbySeat[];
  /** Short config-recap lines, e.g. "Classic preset", "Seer: On". */
  summary: string[];
  onBack: () => void;
  onStart: () => void;
  starting?: boolean;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();

  return (
    <Screen>
      <ScreenHeader title={title} subtitle={subtitle} onBack={onBack} />

      <Card accent={palette.primaryContainer} style={{ gap: spacing.xs }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>{t((s) => s.gameCore.room)}</Label>
          <Chip color={palette.secondary} filled>
            {t((s) => s.gameCore.localRoom)}
          </Chip>
        </Row>
        <Text variant="caption" color={palette.onSurfaceVariant}>
          {t((s) => s.gameCore.localRoomBody)}
        </Text>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Label>{t((s) => s.gameCore.playersCount)(seats.length)}</Label>
        <View style={{ gap: spacing.sm }}>
          {seats.map((seat) => (
            <ListRow
              key={seat.uid}
              leading={<Avatar uid={seat.uid} name={seat.name} size={40} />}
              title={seat.name}
              subtitle={seat.meta ?? (seat.isOwner ? t((s) => s.gameCore.ownerThisDevice) : t((s) => s.gameCore.ready))}
              trailing={
                seat.isOwner ? (
                  <Chip color={palette.primary} filled>
                    {t((s) => s.gameCore.owner)}
                  </Chip>
                ) : (
                  <Chip color={palette.secondary}>{t((s) => s.gameCore.ready)}</Chip>
                )
              }
            />
          ))}
        </View>
      </Card>

      {summary.length > 0 && (
        <Card style={{ gap: spacing.sm }}>
          <Label>{t((s) => s.gameCore.settings)}</Label>
          <Row gap={spacing.xs} style={{ flexWrap: 'wrap' }}>
            {summary.map((line) => (
              <Chip key={line}>{line}</Chip>
            ))}
          </Row>
        </Card>
      )}

      <View style={{ flex: 1 }} />

      <Text variant="caption" color={palette.onSurfaceVariant} style={{ textAlign: 'center' }}>
        {t((s) => s.gameCore.onlyOwnerCanStart)}
      </Text>
      <Button label={t((s) => s.gameCore.startGame)} size="lg" onPress={onStart} disabled={starting} />
    </Screen>
  );
}
