import { View } from 'react-native';

import { Button, Dialog, Row, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { GameId } from './types';

/**
 * "How to play" popover for a catalogue entry — reached from the small info
 * button every game card carries (see `play.tsx`'s `GameCard` and
 * `index.tsx`'s `TrendingCard`). Content lives in `i18n/en(or tr)/howToPlay.ts`,
 * keyed the same way `catalogue.name` is — this component only renders it.
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
  const { t } = useI18n();
  const title = t((s) => s.catalogue.name)[gameId];
  const steps = t((s) => s.howToPlay)[gameId].steps;

  return (
    <Dialog visible={visible} onDismiss={onDismiss} label={t((s) => s.common.howToPlayLabel)(title)}>
      <Text variant="heading">{title}</Text>
      <View style={{ gap: spacing.md }}>
        {steps.map((step, i) => (
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
      <Button label={t((s) => s.common.gotIt)} onPress={onDismiss} />
    </Dialog>
  );
}
