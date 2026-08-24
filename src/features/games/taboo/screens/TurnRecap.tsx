import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { TabooPlayerView, TabooCardResult } from '../state';
import { teamAccent } from './shared';

const RESULT_ICON: Record<TabooCardResult, React.ComponentProps<typeof Ionicons>['name']> = {
  correct: 'checkmark-circle',
  tabu: 'close-circle',
  skip: 'play-skip-forward',
};

/**
 * What just happened, card by card — safe to show in full now. Nothing in
 * this recap was a secret to begin with; the whole room heard every word said
 * out loud while the turn was live. The app is only catching the rest of the
 * table up on the words they missed while they were busy shouting guesses.
 */
export function TurnRecapScreen({ view, onContinue }: { view: TabooPlayerView; onContinue: () => void }) {
  const { palette } = useTheme();
  if (!view.lastTurn) return <Screen>{null}</Screen>;

  const { team, gained, events } = view.lastTurn;
  const accent = teamAccent(palette, team);
  const teamName = view.teams.find((t) => t.id === team)?.name ?? '';
  const gainedColor = gained > 0 ? palette.success : gained < 0 ? palette.error : palette.onSurfaceVariant;

  return (
    <Screen>
      <Card accent={accent} style={{ alignItems: 'center', gap: spacing.sm }}>
        <Label color={accent}>Team {teamName}&apos;s turn</Label>
        <Text variant="hero" color={gainedColor}>
          {gained > 0 ? '+' : ''}
          {gained}
        </Text>
      </Card>

      <Row style={{ justifyContent: 'space-between' }}>
        {view.teams.map((t) => (
          <View key={t.id} style={{ alignItems: 'center', gap: 2 }}>
            <Label color={teamAccent(palette, t.id)}>Team {t.name}</Label>
            <Text variant="title">{t.score}</Text>
          </View>
        ))}
      </Row>

      <Label>This turn</Label>
      <View style={{ gap: spacing.xs, flex: 1 }}>
        {events.length === 0 && (
          <Text variant="caption" color={palette.onSurfaceVariant}>
            No cards were resolved before time ran out.
          </Text>
        )}
        {events.map((event, i) => (
          <Row key={`${event.cardId}-${i}`} gap={spacing.sm}>
            <Ionicons
              name={RESULT_ICON[event.result]}
              size={16}
              color={
                event.result === 'correct'
                  ? palette.success
                  : event.result === 'tabu'
                    ? palette.error
                    : palette.onSurfaceVariant
              }
            />
            <Text variant="body" style={{ flex: 1 }}>
              {event.word}
            </Text>
          </Row>
        ))}
      </View>

      <Button
        label={view.winner ? 'See results' : 'Pass the phone'}
        onPress={onContinue}
      />
    </Screen>
  );
}
