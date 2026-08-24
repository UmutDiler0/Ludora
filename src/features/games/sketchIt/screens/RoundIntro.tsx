import { View } from 'react-native';

import { Button, Card, Chip, Label, Row, Screen, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { SketchPlayerView } from '../state';

/**
 * Pass-the-phone screen — the equivalent of Taboo's Turn Intro, for the one
 * moment this game needs privacy at all: memorising the word before anyone
 * else looks at the screen. Once drawing starts nobody's view shows the word
 * again (see engine.ts's file header), so this is the only chance to read it.
 */
export function RoundIntroScreen({ view, onStart }: { view: SketchPlayerView; onStart: () => void }) {
  const { palette } = useTheme();

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Chip color={palette.tertiary} filled>
          Round {view.round} / {view.totalRounds}
        </Chip>
      </Row>

      <Leaderboard view={view} />

      <Card
        accent={palette.tertiary}
        style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl, flex: 1, justifyContent: 'center' }}>
        <Text variant="hero" center color={palette.tertiary}>
          Pass to {view.artistName}
        </Text>
        <Text variant="body" color={palette.onSurfaceVariant} center style={{ paddingHorizontal: spacing.md }}>
          Everyone else, look away — {view.artistName} is about to see the word.
        </Text>

        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <Label color={palette.onSurfaceVariant}>Your word</Label>
          <Text variant="hero" center>
            {view.word}
          </Text>
        </View>
      </Card>

      <Button label="Everyone ready — start drawing" size="lg" onPress={onStart} />
    </Screen>
  );
}

function Leaderboard({ view }: { view: SketchPlayerView }) {
  const { palette } = useTheme();
  if (view.leaderboard.every((p) => p.score === 0)) return null;

  return (
    <Row gap={spacing.xs} style={{ flexWrap: 'wrap' }}>
      {view.leaderboard.map((p) => (
        <Chip key={p.uid} color={palette.onSurfaceVariant}>
          {p.displayName} {p.score}
        </Chip>
      ))}
    </Row>
  );
}
