import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Avatar, Button, Card, Label, Row, Screen, Text } from '@/components/ui';
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
  const winner = view.winner ?? 'draw';
  const imposter = view.players.find((p) => p.uid === view.imposterUidIfOver);

  const accent = winner === 'crew' ? palette.secondary : winner === 'imposter' ? palette.error : palette.onSurfaceVariant;
  const headline =
    winner === 'crew'
      ? `${imposter?.displayName ?? 'The imposter'} was caught`
      : winner === 'imposter'
        ? `${imposter?.displayName ?? 'The imposter'} fooled everyone`
        : "Nobody found out";

  return (
    <Screen>
      <Card accent={accent} style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <Ionicons
          name={winner === 'crew' ? 'checkmark-circle' : winner === 'imposter' ? 'skull' : 'time'}
          size={40}
          color={accent}
        />
        <Label color={accent} center>
          {winner === 'draw' ? 'Draw' : 'Game Over'}
        </Label>
        <Text variant="hero" color={accent} center>
          {headline}
        </Text>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Category</Label>
          <Text variant="bodyStrong">{view.categoryName}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>The value</Label>
          <Text variant="bodyStrong">{view.valueIfOver}</Text>
        </Row>
      </Card>

      <Label>The imposter was</Label>
      <View style={{ gap: spacing.sm }}>
        {imposter && (
          <Row gap={spacing.md}>
            <Avatar uid={imposter.uid} name={imposter.displayName} ring={palette.error} />
            <Text variant="bodyStrong">{imposter.displayName}</Text>
          </Row>
        )}
      </View>

      <View style={{ flex: 1 }} />
      <Button label="Play again" onPress={onPlayAgain} />
    </Screen>
  );
}
