import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { LobbyScreen, type LobbySeat } from '@/features/games/core/LobbyScreen';
import type { SketchConfig } from '@/features/games/sketchIt/config';
import { useI18n } from '@/i18n/I18nProvider';
import { roomGateway } from '@/services/rooms/firebaseRooms';
import type { RoomVisibility } from '@/services/rooms/types';
import { HUMAN_UID, seatNames, useLocalSketch } from '@/stores/localSketch';

/**
 * Room lobby for Sketch It — there are no bots (see `localSketch.ts`'s file
 * header), every seat is a real person passing the phone, so the roster
 * shown here is exactly who will be asked to draw once the game starts.
 */
export default function SketchLobby() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ playerCount: string; config: string; visibility: string; code: string }>();
  const newGame = useLocalSketch((s) => s.newGame);
  const visibility: RoomVisibility = params.visibility === 'private' ? 'private' : 'public';

  const playerCount = Number(params.playerCount);
  const config = useMemo(() => JSON.parse(params.config) as SketchConfig, [params.config]);

  const seats: LobbySeat[] = seatNames(playerCount).map((p) => ({
    uid: p.uid,
    name: p.displayName,
    isOwner: p.uid === HUMAN_UID,
  }));

  const summary = [t((s) => s.common.players)(playerCount), t((s) => s.sketchIt.lobby.secondsToDraw)(config.roundSeconds)];

  const start = async () => {
    await roomGateway.closeRoom(params.code);
    newGame(playerCount, config);
    router.replace('/sketch');
  };

  return (
    <LobbyScreen
      title={t((s) => s.gameCore.roomLobbyTitle)}
      subtitle={t((s) => s.sketchIt.lobby.subtitle)}
      roomCode={params.code}
      visibility={visibility}
      seats={seats}
      summary={summary}
      onBack={() => router.back()}
      onStart={start}
    />
  );
}
