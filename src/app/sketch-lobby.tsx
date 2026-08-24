import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { LobbyScreen, type LobbySeat } from '@/features/games/core/LobbyScreen';
import type { SketchConfig } from '@/features/games/sketchIt/config';
import { HUMAN_UID, seatNames, useLocalSketch } from '@/stores/localSketch';

/**
 * Room lobby for Sketch It — there are no bots (see `localSketch.ts`'s file
 * header), every seat is a real person passing the phone, so the roster
 * shown here is exactly who will be asked to draw once the game starts.
 */
export default function SketchLobby() {
  const router = useRouter();
  const params = useLocalSearchParams<{ playerCount: string; config: string }>();
  const newGame = useLocalSketch((s) => s.newGame);

  const playerCount = Number(params.playerCount);
  const config = useMemo(() => JSON.parse(params.config) as SketchConfig, [params.config]);

  const seats: LobbySeat[] = seatNames(playerCount).map((p) => ({
    uid: p.uid,
    name: p.displayName,
    isOwner: p.uid === HUMAN_UID,
  }));

  const summary = [`${playerCount} players`, `${config.roundSeconds}s to draw each turn`];

  const start = () => {
    newGame(playerCount, config);
    router.replace('/sketch');
  };

  return (
    <LobbyScreen
      title="Room Lobby"
      subtitle="Sketch It · everyone's seated, start when ready."
      seats={seats}
      summary={summary}
      onBack={() => router.back()}
      onStart={start}
    />
  );
}
