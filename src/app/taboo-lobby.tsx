import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { LobbyScreen, type LobbySeat } from '@/features/games/core/LobbyScreen';
import type { PlayerSeat } from '@/features/games/core/types';
import type { TabooConfig } from '@/features/games/taboo/config';
import { useLocalTaboo } from '@/stores/localTaboo';

const TEAM_NAME: Record<string, string> = { A: 'Red', B: 'Blue' };

/**
 * Room lobby for Taboo — the roster is already fully named and split into
 * teams by `taboo-setup.tsx`, so this screen is a pure review-then-start step
 * rather than one that still has to generate seat names.
 */
export default function TabooLobby() {
  const router = useRouter();
  const params = useLocalSearchParams<{ seats: string; config: string }>();
  const newGameWithRoster = useLocalTaboo((s) => s.newGameWithRoster);

  const roster = useMemo(() => JSON.parse(params.seats) as PlayerSeat[], [params.seats]);
  const config = useMemo(() => JSON.parse(params.config) as TabooConfig, [params.config]);

  const seats: LobbySeat[] = roster.map((p, i) => ({
    uid: p.uid,
    name: p.displayName,
    isOwner: i === 0,
    meta: p.team ? `Team ${TEAM_NAME[p.team] ?? p.team}` : undefined,
  }));

  const summary = [
    `${roster.length} players`,
    `First to ${config.targetScore}`,
    `${config.roundSeconds}s rounds`,
  ];

  const start = () => {
    newGameWithRoster(roster, config);
    router.replace('/taboo');
  };

  return (
    <LobbyScreen
      title="Room Lobby"
      subtitle="Taboo · everyone's seated, start when ready."
      seats={seats}
      summary={summary}
      onBack={() => router.back()}
      onStart={start}
    />
  );
}
