import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { LobbyScreen, type LobbySeat } from '@/features/games/core/LobbyScreen';
import { autoVampireCount, type VVConfig } from '@/features/games/vampireVillage/config';
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
  const params = useLocalSearchParams<{ playerCount: string; config: string }>();
  const you = useProfile((s) => s.displayName);
  const newGame = useLocalGame((s) => s.newGame);

  const playerCount = Number(params.playerCount);
  const config = useMemo(() => JSON.parse(params.config) as VVConfig, [params.config]);

  const seats: LobbySeat[] = useMemo(() => {
    const botSeats = BOT_NAMES.slice(0, playerCount - 1).map((name, i) => ({
      uid: `bot${i}`,
      name,
    }));
    return [{ uid: HUMAN_UID, name: you || 'You', isOwner: true }, ...botSeats];
  }, [playerCount, you]);

  const effectiveVampires =
    config.vampireCount > 0
      ? Math.min(config.vampireCount, Math.floor((playerCount - 1) / 2))
      : autoVampireCount(playerCount);

  const summary = [
    `${playerCount} players`,
    `${effectiveVampires} vampire${effectiveVampires === 1 ? '' : 's'}`,
    `Seer ${config.enableSeer ? 'on' : 'off'}`,
    `Bodyguard ${config.enableBodyguard ? 'on' : 'off'}`,
  ];

  const start = () => {
    newGame(playerCount, config);
    router.replace('/game');
  };

  return (
    <LobbyScreen
      title="Room Lobby"
      subtitle="Vampire Village · everyone's seated, start when ready."
      seats={seats}
      summary={summary}
      onBack={() => router.back()}
      onStart={start}
    />
  );
}
