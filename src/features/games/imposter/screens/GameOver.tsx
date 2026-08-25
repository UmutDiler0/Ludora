import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Avatar, Button, Card, Label, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { ImposterPlayerView } from '../state';

export function ImposterGameOverScreen({
  view,
  onPlayAgain,
}: {
  view: ImposterPlayerView;
  onPlayAgain: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const winner = view.winner ?? 'draw';
  const imposter = view.players.find((p) => p.uid === view.imposterUidIfOver);
  const fallbackName = t((s) => s.imposter.gameOver.fallbackName);

  const accent = winner === 'crew' ? palette.secondary : winner === 'imposter' ? palette.error : palette.onSurfaceVariant;
  const headline =
    winner === 'crew'
      ? t((s) => s.imposter.gameOver.caught)(imposter?.displayName ?? fallbackName)
      : winner === 'imposter'
        ? t((s) => s.imposter.gameOver.fooledEveryone)(imposter?.displayName ?? fallbackName)
        : t((s) => s.imposter.gameOver.nobodyFoundOut);

  return (
    <Screen>
      <Card accent={accent} style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <Ionicons
          name={winner === 'crew' ? 'checkmark-circle' : winner === 'imposter' ? 'skull' : 'time'}
          size={40}
          color={accent}
        />
        <Label color={accent} center>
          {winner === 'draw' ? t((s) => s.imposter.gameOver.draw) : t((s) => s.imposter.gameOver.gameOver)}
        </Label>
        <Text variant="hero" color={accent} center>
          {headline}
        </Text>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>{t((s) => s.imposter.gameOver.category)}</Label>
          <Text variant="bodyStrong">{view.categoryName}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>{t((s) => s.imposter.gameOver.theValue)}</Label>
          <Text variant="bodyStrong">{view.valueIfOver}</Text>
        </Row>
      </Card>

      <Label>{t((s) => s.imposter.gameOver.theImposterWas)}</Label>
      <View style={{ gap: spacing.sm }}>
        {imposter && (
          <Row gap={spacing.md}>
            <Avatar uid={imposter.uid} name={imposter.displayName} ring={palette.error} />
            <Text variant="bodyStrong">{imposter.displayName}</Text>
          </Row>
        )}
      </View>

      <View style={{ flex: 1 }} />
      <Button label={t((s) => s.imposter.gameOver.playAgain)} onPress={onPlayAgain} />
    </Screen>
  );
}
