import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { t } = useI18n();
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

      <Label>{t((s) => s.zarta.roundRecap.theTable)}</Label>
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
                {t((s) => s.zarta.roundRecap.writtenBy)(option.authorNames.join(', '))}
              </Text>
            )}
            {option.voterNames.length > 0 && (
              <Text variant="caption" color={palette.onSurfaceVariant}>
                {t((s) => s.zarta.roundRecap.pickedBy)(option.voterNames.join(', '))}
              </Text>
            )}
          </Card>
        ))}
      </View>

      <Label>{t((s) => s.zarta.roundRecap.pointsThisRound)}</Label>
      <View style={{ gap: spacing.xs }}>
        {pointsThisRound.length === 0 && (
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {t((s) => s.zarta.roundRecap.nobodyScored)}
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

      <Button label={view.winner ? t((s) => s.zarta.roundRecap.seeResults) : t((s) => s.zarta.roundRecap.passThePhone)} onPress={onContinue} />
    </Screen>
  );
}
