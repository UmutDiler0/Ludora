import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { LobbyScreen, type LobbySeat } from '@/features/games/core/LobbyScreen';
import type { ZartaConfig } from '@/features/games/zarta/config';
import { HUMAN_UID, seatNames, useLocalZarta } from '@/stores/localZarta';

/**
 * Room lobby for Zarta — no bots (see `localZarta.ts`'s file header), so the
 * roster shown here is exactly who will write bluffs and vote each round.
 */
export default function ZartaLobby() {
  const router = useRouter();
  const params = useLocalSearchParams<{ playerCount: string; config: string }>();
  const newGame = useLocalZarta((s) => s.newGame);

  const playerCount = Number(params.playerCount);
  const config = useMemo(() => JSON.parse(params.config) as ZartaConfig, [params.config]);

  const seats: LobbySeat[] = seatNames(playerCount).map((p) => ({
    uid: p.uid,
    name: p.displayName,
    isOwner: p.uid === HUMAN_UID,
  }));

  const summary = [`${playerCount} players`, `${config.totalRounds} questions`];

  const start = () => {
    newGame(playerCount, config);
    router.replace('/zarta');
  };

  return (
    <LobbyScreen
      title="Room Lobby"
      subtitle="Zarta · everyone's seated, start when ready."
      seats={seats}
      summary={summary}
      onBack={() => router.back()}
      onStart={start}
    />
  );
}
