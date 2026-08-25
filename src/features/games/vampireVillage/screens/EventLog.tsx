import { View } from 'react-native';

import { Card, Label, Screen, Text } from '@/components/ui';
import type { LogEntry } from '@/features/games/core/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { spacing } from '@/theme/tokens';
import type { VVPlayerView } from '../state';

/**
 * Game Log — the designed in-session event feed, grouped by round.
 *
 * Corrects the earlier mapping: this is the in-game log, not match history
 * (§1.6). Every entry here comes from the engine's public log, which follows
 * the §22.2 disclosure policy — so the Seer's target can never appear.
 */

/** Built per palette rather than as a module constant, so it follows the theme. */
const kindColors = (p: Palette): Record<string, string> => ({
  kill: p.error,
  kill_blocked: p.secondary,
  exile: p.tertiary,
  seer_acted: p.primary,
  guard_acted: p.tertiary,
  game_over: p.secondary,
});

export function EventLogScreen({ view }: { view: VVPlayerView }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const colors = kindColors(palette);

  // Newest round first, matching the design's Day 2 → Night 1 → Day 1 order.
  const rounds = [...new Set(view.log.map((l) => l.round))].sort((a, b) => b - a);

  return (
    <Screen>
      <Text variant="title">{t((s) => s.vampireVillage.eventLog.title)}</Text>

      {view.log.length === 0 && (
        <Text variant="body" color={palette.onSurfaceVariant}>
          {t((s) => s.vampireVillage.eventLog.nothingYet)}
        </Text>
      )}

      {rounds.map((round) => (
        <View key={round} style={{ gap: spacing.sm }}>
          <Label>{t((s) => s.vampireVillage.eventLog.round)(round)}</Label>
          {view.log
            .filter((l) => l.round === round)
            .slice()
            .reverse()
            .map((entry: LogEntry) => (
              <Card key={entry.id} accent={colors[entry.kind]} style={{ paddingVertical: spacing.md }}>
                <Text variant="body" color={colors[entry.kind] ?? palette.onSurface}>
                  {entry.text}
                </Text>
              </Card>
            ))}
        </View>
      ))}
    </Screen>
  );
}
