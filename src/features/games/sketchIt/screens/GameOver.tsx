import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, StatTile, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { SketchPlayerView } from '../state';

/**
 * Game Over — individual, not team-based like Taboo's: every seat drew
 * exactly once, so the result is a ranked leaderboard rather than a side.
 */
export function SketchGameOverScreen({ view, onPlayAgain }: { view: SketchPlayerView; onPlayAgain: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const draw = view.winner === 'draw';
  const winner = !draw ? view.leaderboard.find((p) => p.uid === view.winner) : null;
  const [first, second, third] = view.leaderboard;

  return (
    <Screen>
      <Card accent={palette.tertiary} style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <Label color={palette.tertiary} center>
          {draw ? t((s) => s.sketchIt.gameOver.draw) : t((s) => s.sketchIt.gameOver.gameOver)}
        </Label>
        <Text variant="hero" color={palette.tertiary} center>
          {draw ? t((s) => s.sketchIt.gameOver.tie) : t((s) => s.sketchIt.gameOver.wins)(winner?.displayName ?? '')}
        </Text>
      </Card>

      <Row>
        {first && <StatTile value={String(first.score)} caption={first.displayName} color={palette.tertiary} />}
        {second && <StatTile value={String(second.score)} caption={second.displayName} />}
        {third && <StatTile value={String(third.score)} caption={third.displayName} />}
      </Row>

      <Label>{t((s) => s.sketchIt.gameOver.finalStandings)}</Label>
      <View style={{ gap: spacing.sm }}>
        {view.leaderboard.map((p, i) => (
          <Card key={p.uid} style={{ paddingVertical: spacing.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">
                {i + 1}. {p.displayName}
              </Text>
              <Text variant="bodyStrong" color={palette.tertiary}>
                {p.score}
              </Text>
            </Row>
          </Card>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Button label={t((s) => s.sketchIt.gameOver.playAgain)} onPress={onPlayAgain} />
    </Screen>
  );
}
