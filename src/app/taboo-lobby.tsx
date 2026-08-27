import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { LobbyScreen, type LobbySeat } from '@/features/games/core/LobbyScreen';
import type { PlayerSeat } from '@/features/games/core/types';
import type { TabooConfig } from '@/features/games/taboo/config';
import { useI18n } from '@/i18n/I18nProvider';
import { roomGateway } from '@/services/rooms/firebaseRooms';
import type { RoomVisibility } from '@/services/rooms/types';
import { useLocalTaboo } from '@/stores/localTaboo';

/**
 * Room lobby for Taboo — the roster is already fully named and split into
 * teams by `taboo-setup.tsx`, so this screen is a pure review-then-start step
 * rather than one that still has to generate seat names.
 */
export default function TabooLobby() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ seats: string; config: string; visibility: string; code: string }>();
  const newGameWithRoster = useLocalTaboo((s) => s.newGameWithRoster);
  const visibility: RoomVisibility = params.visibility === 'private' ? 'private' : 'public';

  const roster = useMemo(() => JSON.parse(params.seats) as PlayerSeat[], [params.seats]);
  const config = useMemo(() => JSON.parse(params.config) as TabooConfig, [params.config]);
  const teamName = t((s) => s.taboo.team) as Record<string, string>;

  const seats: LobbySeat[] = roster.map((p, i) => ({
    uid: p.uid,
    name: p.displayName,
    isOwner: i === 0,
    meta: p.team ? t((s) => s.taboo.teamLabel)(teamName[p.team] ?? p.team) : undefined,
  }));

  const summary = [
    t((s) => s.common.players)(roster.length),
    t((s) => s.taboo.lobby.firstTo)(config.targetScore),
    t((s) => s.taboo.lobby.roundSeconds)(config.roundSeconds),
  ];

  const start = async () => {
    await roomGateway.closeRoom(params.code);
    newGameWithRoster(roster, config);
    router.replace('/taboo');
  };

  return (
    <LobbyScreen
      title={t((s) => s.gameCore.roomLobbyTitle)}
      subtitle={t((s) => s.taboo.lobby.subtitle)}
      roomCode={params.code}
      visibility={visibility}
      seats={seats}
      summary={summary}
      onBack={() => router.back()}
      onStart={start}
    />
  );
}
