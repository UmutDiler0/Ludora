import { View } from 'react-native';

import { Button, Dialog, Row, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { HOW_TO_PLAY } from './howToPlay';
import type { GameId } from './types';

/**
 * "How to play" popover for a catalogue entry — reached from the small info
 * button every game card carries (see `play.tsx`'s `GameCard` and
 * `index.tsx`'s `TrendingCard`). Content lives in `howToPlay.ts`; this
 * component only renders it.
 */
export function HowToPlayDialog({
  gameId,
  visible,
  onDismiss,
}: {
  gameId: GameId;
  visible: boolean;
  onDismiss: () => void;
}) {
  const { palette } = useTheme();
  const entry = HOW_TO_PLAY[gameId];

  return (
    <Dialog visible={visible} onDismiss={onDismiss} label={`How to play ${entry.title}`}>
      <Text variant="heading">{entry.title}</Text>
      <View style={{ gap: spacing.md }}>
        {entry.steps.map((step, i) => (
          <Row key={i} gap={spacing.md} style={{ alignItems: 'flex-start' }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: palette.primaryContainer,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text variant="label" color={palette.onPrimary}>
                {i + 1}
              </Text>
            </View>
            <Text variant="body" style={{ flex: 1 }}>
              {step}
            </Text>
          </Row>
        ))}
      </View>
      <Button label="Got it" onPress={onDismiss} />
    </Dialog>
  );
}
