import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { SketchPlayerView } from '../state';

/**
 * What just happened, guess by guess — safe to show in full now. Nothing
 * here was a secret to begin with once drawing started: the whole room
 * watched the sketch happen live, so this is only catching everyone up on
 * the word and the final tally.
 */
export function RoundRecapScreen({ view, onContinue }: { view: SketchPlayerView; onContinue: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  if (!view.lastRound) return <Screen>{null}</Screen>;

  const { artistName, word, artistPoints, guesses } = view.lastRound;

  return (
    <Screen>
      <Card accent={palette.tertiary} style={{ alignItems: 'center', gap: spacing.sm }}>
        <Label color={palette.tertiary}>{t((s) => s.sketchIt.roundRecap.wasDrawing)(artistName)}</Label>
        <Text variant="hero" center>
          {word}
        </Text>
        <Text variant="bodyStrong" color={palette.tertiary}>
          {t((s) => s.sketchIt.roundRecap.plusForArtist)(artistPoints)}
        </Text>
      </Card>

      <Label>{t((s) => s.sketchIt.roundRecap.leaderboard)}</Label>
      <View style={{ gap: spacing.xs }}>
        {view.leaderboard.map((p, i) => (
          <Row key={p.uid} style={{ justifyContent: 'space-between' }}>
            <Text variant="body">
              {i + 1}. {p.displayName}
            </Text>
            <Text variant="bodyStrong">{p.score}</Text>
          </Row>
        ))}
      </View>

      <Label>{t((s) => s.sketchIt.roundRecap.whoGuessedIt)}</Label>
      <View style={{ gap: spacing.xs, flex: 1 }}>
        {guesses.length === 0 && (
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {t((s) => s.sketchIt.roundRecap.nobodyGuessed)}
          </Text>
        )}
        {guesses.map((g) => (
          <Row key={g.uid} style={{ justifyContent: 'space-between' }}>
            <Text variant="body">
              {g.rank}. {g.displayName}
            </Text>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              +{g.points}
            </Text>
          </Row>
        ))}
      </View>

      <Button label={view.winner ? t((s) => s.sketchIt.roundRecap.seeResults) : t((s) => s.sketchIt.roundRecap.passThePhone)} onPress={onContinue} />
    </Screen>
  );
}
