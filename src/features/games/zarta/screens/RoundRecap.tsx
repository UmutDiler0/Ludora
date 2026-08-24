import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { ZartaPlayerView } from '../state';

/**
 * Full reveal — safe now, the same way Taboo's and Sketch It's recaps are:
 * every vote is already cast, so there is nothing left to protect. Shows
 * every option with who wrote it and who fell for it, which is the whole
 * payoff of the round.
 */
export function ZartaRoundRecapScreen({ view, onContinue }: { view: ZartaPlayerView; onContinue: () => void }) {
  const { palette } = useTheme();
  if (!view.lastRound) return <Screen>{null}</Screen>;

  const { question, correctAnswer, options, pointsThisRound } = view.lastRound;

  return (
    <Screen>
      <Card accent={palette.secondary} style={{ alignItems: 'center', gap: spacing.xs }}>
        <Label color={palette.secondary}>{question}</Label>
        <Text variant="heading" center color={palette.secondary}>
          {correctAnswer}
        </Text>
      </Card>

      <Label>The table</Label>
      <View style={{ gap: spacing.sm }}>
        {options.map((option) => (
          <Card key={option.id} accent={option.isCorrect ? palette.secondary : undefined} style={{ gap: spacing.xs }}>
            <Row gap={spacing.sm}>
              <Ionicons
                name={option.isCorrect ? 'checkmark-circle' : 'help-circle'}
                size={18}
                color={option.isCorrect ? palette.secondary : palette.onSurfaceVariant}
              />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {option.text}
              </Text>
            </Row>
            {!option.isCorrect && option.authorNames.length > 0 && (
              <Text variant="caption" color={palette.onSurfaceVariant}>
                Written by {option.authorNames.join(', ')}
              </Text>
            )}
            {option.voterNames.length > 0 && (
              <Text variant="caption" color={palette.onSurfaceVariant}>
                Picked by {option.voterNames.join(', ')}
              </Text>
            )}
          </Card>
        ))}
      </View>

      <Label>Points this round</Label>
      <View style={{ gap: spacing.xs }}>
        {pointsThisRound.length === 0 && (
          <Text variant="caption" color={palette.onSurfaceVariant}>
            Nobody scored — everyone was fooled or ran out of time.
          </Text>
        )}
        {pointsThisRound.map((p) => (
          <Row key={p.uid} style={{ justifyContent: 'space-between' }}>
            <Text variant="body">{p.displayName}</Text>
            <Text variant="bodyStrong" color={palette.secondary}>
              +{p.points}
            </Text>
          </Row>
        ))}
      </View>

      <Button label={view.winner ? 'See results' : 'Pass the phone'} onPress={onContinue} />
    </Screen>
  );
}
