import { View } from 'react-native';

import { Card, Label, Screen, Text } from '@/components/ui';
import type { LogEntry } from '@/features/games/core/types';
import { palette, spacing } from '@/theme/tokens';
import type { VVPlayerView } from '../state';

/**
 * Game Log — the designed in-session event feed, grouped by round.
 *
 * Corrects the earlier mapping: this is the in-game log, not match history
 * (§1.6). Every entry here comes from the engine's public log, which follows
 * the §22.2 disclosure policy — so the Seer's target can never appear.
 */

const KIND_COLOR: Record<string, string> = {
  kill: palette.error,
  kill_blocked: palette.secondary,
  exile: palette.tertiary,
  seer_acted: palette.primary,
  guard_acted: palette.tertiary,
  game_over: palette.secondary,
};

export function EventLogScreen({ view }: { view: VVPlayerView }) {
  // Newest round first, matching the design's Day 2 → Night 1 → Day 1 order.
  const rounds = [...new Set(view.log.map((l) => l.round))].sort((a, b) => b - a);

  return (
    <Screen>
      <Text variant="title">Game Log</Text>

      {view.log.length === 0 && (
        <Text variant="body" color={palette.onSurfaceVariant}>
          Nothing has happened yet.
        </Text>
      )}

      {rounds.map((round) => (
        <View key={round} style={{ gap: spacing.sm }}>
          <Label>Round {round}</Label>
          {view.log
            .filter((l) => l.round === round)
            .slice()
            .reverse()
            .map((entry: LogEntry) => (
              <Card key={entry.id} accent={KIND_COLOR[entry.kind]} style={{ paddingVertical: spacing.md }}>
                <Text variant="body" color={KIND_COLOR[entry.kind] ?? palette.onSurface}>
                  {entry.text}
                </Text>
              </Card>
            ))}
        </View>
      ))}
    </Screen>
  );
}
