import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, StatTile, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { ZartaPlayerView } from '../state';

/**
 * Game Over — individual, like Sketch It's: every seat wrote and voted every
 * round, so the result is a ranked leaderboard rather than a side.
 */
export function ZartaGameOverScreen({ view, onPlayAgain }: { view: ZartaPlayerView; onPlayAgain: () => void }) {
  const { palette } = useTheme();
  const draw = view.winner === 'draw';
  const winner = !draw ? view.leaderboard.find((p) => p.uid === view.winner) : null;
  const [first, second, third] = view.leaderboard;

  return (
    <Screen>
      <Card accent={palette.secondary} style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <Label color={palette.secondary} center>
          {draw ? 'Draw' : 'Game Over'}
        </Label>
        <Text variant="hero" color={palette.secondary} center>
          {draw ? "It's a tie" : `${winner?.displayName} wins`}
        </Text>
      </Card>

      <Row>
        {first && <StatTile value={String(first.score)} caption={first.displayName} color={palette.secondary} />}
        {second && <StatTile value={String(second.score)} caption={second.displayName} />}
        {third && <StatTile value={String(third.score)} caption={third.displayName} />}
      </Row>

      <Label>Final standings</Label>
      <View style={{ gap: spacing.sm }}>
        {view.leaderboard.map((p, i) => (
          <Card key={p.uid} style={{ paddingVertical: spacing.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">
                {i + 1}. {p.displayName}
              </Text>
              <Text variant="bodyStrong" color={palette.secondary}>
                {p.score}
              </Text>
            </Row>
          </Card>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Button label="Play again" onPress={onPlayAgain} />
    </Screen>
  );
}
