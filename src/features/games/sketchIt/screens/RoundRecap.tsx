import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, Text } from '@/components/ui';
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
  if (!view.lastRound) return <Screen>{null}</Screen>;

  const { artistName, word, artistPoints, guesses } = view.lastRound;

  return (
    <Screen>
      <Card accent={palette.tertiary} style={{ alignItems: 'center', gap: spacing.sm }}>
        <Label color={palette.tertiary}>{artistName} was drawing</Label>
        <Text variant="hero" center>
          {word}
        </Text>
        <Text variant="bodyStrong" color={palette.tertiary}>
          +{artistPoints} for the artist
        </Text>
      </Card>

      <Label>Leaderboard</Label>
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

      <Label>Who guessed it</Label>
      <View style={{ gap: spacing.xs, flex: 1 }}>
        {guesses.length === 0 && (
          <Text variant="caption" color={palette.onSurfaceVariant}>
            Nobody guessed it in time.
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

      <Button label={view.winner ? 'See results' : 'Pass the phone'} onPress={onContinue} />
    </Screen>
  );
}
