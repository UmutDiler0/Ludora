import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { LobbyScreen, type LobbySeat } from '@/features/games/core/LobbyScreen';
import { autoVampireCount, type VVConfig } from '@/features/games/vampireVillage/config';
import { useI18n } from '@/i18n/I18nProvider';
import { roomGateway } from '@/services/rooms/firebaseRooms';
import type { RoomVisibility } from '@/services/rooms/types';
import { BOT_NAMES, HUMAN_UID, useLocalGame } from '@/stores/localGame';
import { useProfile } from '@/stores/profile';

/**
 * Room lobby for Vampire Village — reached from `game-setup.tsx` once the
 * config validates. Seats and config arrive as router params rather than a
 * shared store because they are already-validated, plain JSON: the same data
 * a real lobby subscription would eventually hand this screen.
 */
export default function GameLobby() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ playerCount: string; config: string; visibility: string; code: string }>();
  const you = useProfile((s) => s.displayName);
  const newGame = useLocalGame((s) => s.newGame);
  const visibility: RoomVisibility = params.visibility === 'private' ? 'private' : 'public';

  const playerCount = Number(params.playerCount);
  const config = useMemo(() => JSON.parse(params.config) as VVConfig, [params.config]);

  const seats: LobbySeat[] = useMemo(() => {
    const botSeats = BOT_NAMES.slice(0, playerCount - 1).map((name, i) => ({
      uid: `bot${i}`,
      name,
    }));
    return [{ uid: HUMAN_UID, name: you || t((s) => s.common.you), isOwner: true }, ...botSeats];
  }, [playerCount, you, t]);

  const effectiveVampires =
    config.vampireCount > 0
      ? Math.min(config.vampireCount, Math.floor((playerCount - 1) / 2))
      : autoVampireCount(playerCount);

  const summary = [
    t((s) => s.common.players)(playerCount),
    t((s) => s.vampireVillage.lobby.vampiresCount)(effectiveVampires),
    t((s) => s.vampireVillage.lobby.seer)(config.enableSeer),
    t((s) => s.vampireVillage.lobby.bodyguard)(config.enableBodyguard),
  ];

  const start = async () => {
    await roomGateway.closeRoom(params.code);
    newGame(playerCount, config);
    router.replace('/game');
  };

  return (
    <LobbyScreen
      title={t((s) => s.gameCore.roomLobbyTitle)}
      subtitle={t((s) => s.vampireVillage.lobby.subtitle)}
      roomCode={params.code}
      visibility={visibility}
      seats={seats}
      summary={summary}
      onBack={() => router.back()}
      onStart={start}
    />
  );
}
