import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, EmptyState, Input, Label, ListRow, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { ROOM_CODE_LENGTH } from '@/constants/app';
import { roomGateway } from '@/services/rooms/mockRooms';
import type { Room } from '@/services/rooms/types';
import { useRooms } from '@/stores/rooms';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * "Find a Room" (docs/ARCHITECTURE.md's Game Browser, spec §17) — code entry
 * plus the public room list, reading `services/rooms` directly. Honest about
 * what one device can show: the list is only ever rooms *this* device has
 * created (mockRooms.ts's own header explains why), and joining just replays
 * that room's own route/params, landing back in its lobby.
 */
export default function FindRoom() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const publicRooms = useRooms((s) => s.publicRooms);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const goToRoom = (room: Room) => {
    router.push({ pathname: room.route, params: room.params });
  };

  const joinByCode = () => {
    const room = roomGateway.getRoomByCode(code.trim().toUpperCase());
    if (!room) {
      setError(t((s) => s.rooms.codeNotFound));
      return;
    }
    setError(null);
    goToRoom(room);
  };

  return (
    <Screen>
      <ScreenHeader title={t((s) => s.rooms.title)} subtitle={t((s) => s.rooms.subtitle)} onBack={() => router.back()} />

      <Card style={{ gap: spacing.md }}>
        <Input
          label={t((s) => s.rooms.codeLabel)}
          value={code}
          onChangeText={(text) => {
            setCode(text.toUpperCase());
            setError(null);
          }}
          placeholder={t((s) => s.rooms.codePlaceholder)}
          autoComplete="off"
          error={error}
          returnKeyType="go"
          onSubmitEditing={joinByCode}
        />
        <Button
          label={t((s) => s.rooms.join)}
          onPress={joinByCode}
          disabled={code.trim().length < ROOM_CODE_LENGTH}
        />
      </Card>

      <Label>{t((s) => s.rooms.publicRoomsLabel)}</Label>
      {publicRooms.length === 0 ? (
        <EmptyState icon="search-outline" title={t((s) => s.rooms.emptyTitle)} body={t((s) => s.rooms.emptyBody)} />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {publicRooms.map((room) => (
            <ListRow
              key={room.code}
              leading={<GameBadge />}
              title={t((s) => s.catalogue.name)[room.gameId]}
              subtitle={`${t((s) => s.rooms.hostedBy)(room.hostName)} · ${room.playerCount}/${room.maxPlayers}`}
              trailing={
                <Row gap={spacing.xs}>
                  <Text variant="caption" color={palette.onSurfaceVariant}>
                    {room.code}
                  </Text>
                </Row>
              }
              onPress={() => goToRoom(room)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function GameBadge() {
  const { palette } = useTheme();
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surfaceHigh,
        borderWidth: stroke.thin,
        borderColor: palette.ink,
      }}>
      <Ionicons name="game-controller" size={20} color={palette.onSurfaceVariant} />
    </View>
  );
}
