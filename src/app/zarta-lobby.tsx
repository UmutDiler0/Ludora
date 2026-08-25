import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { LobbyScreen, type LobbySeat } from '@/features/games/core/LobbyScreen';
import type { ZartaConfig } from '@/features/games/zarta/config';
import { useI18n } from '@/i18n/I18nProvider';
import { roomGateway } from '@/services/rooms/mockRooms';
import type { RoomVisibility } from '@/services/rooms/types';
import { HUMAN_UID, seatNames, useLocalZarta } from '@/stores/localZarta';

/**
 * Room lobby for Zarta — no bots (see `localZarta.ts`'s file header), so the
 * roster shown here is exactly who will write bluffs and vote each round.
 */
export default function ZartaLobby() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ playerCount: string; config: string; visibility: string; code: string }>();
  const newGame = useLocalZarta((s) => s.newGame);
  const visibility: RoomVisibility = params.visibility === 'private' ? 'private' : 'public';

  const playerCount = Number(params.playerCount);
  const config = useMemo(() => JSON.parse(params.config) as ZartaConfig, [params.config]);

  const seats: LobbySeat[] = seatNames(playerCount).map((p) => ({
    uid: p.uid,
    name: p.displayName,
    isOwner: p.uid === HUMAN_UID,
  }));

  const summary = [t((s) => s.common.players)(playerCount), t((s) => s.zarta.lobby.questions)(config.totalRounds)];

  const start = async () => {
    await roomGateway.closeRoom(params.code);
    newGame(playerCount, config);
    router.replace('/zarta');
  };

  return (
    <LobbyScreen
      title={t((s) => s.gameCore.roomLobbyTitle)}
      subtitle={t((s) => s.zarta.lobby.subtitle)}
      roomCode={params.code}
      visibility={visibility}
      seats={seats}
      summary={summary}
      onBack={() => router.back()}
      onStart={start}
    />
  );
}
