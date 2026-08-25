import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { t } = useI18n();
  if (!view.lastTurn) return <Screen>{null}</Screen>;

  const { team, gained, events } = view.lastTurn;
  const accent = teamAccent(palette, team);
  const teamName = t((s) => s.taboo.team);
  const gainedColor = gained > 0 ? palette.success : gained < 0 ? palette.error : palette.onSurfaceVariant;

  return (
    <Screen>
      <Card accent={accent} style={{ alignItems: 'center', gap: spacing.sm }}>
        <Label color={accent}>{t((s) => s.taboo.turnRecap.teamsTurn)(teamName[team])}</Label>
        <Text variant="hero" color={gainedColor}>
          {gained > 0 ? '+' : ''}
          {gained}
        </Text>
      </Card>

      <Row style={{ justifyContent: 'space-between' }}>
        {view.teams.map((tm) => (
          <View key={tm.id} style={{ alignItems: 'center', gap: 2 }}>
            <Label color={teamAccent(palette, tm.id)}>{t((s) => s.taboo.teamLabel)(teamName[tm.id])}</Label>
            <Text variant="title">{tm.score}</Text>
          </View>
        ))}
      </Row>

      <Label>{t((s) => s.taboo.turnRecap.thisTurn)}</Label>
      <View style={{ gap: spacing.xs, flex: 1 }}>
        {events.length === 0 && (
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {t((s) => s.taboo.turnRecap.noCardsResolved)}
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
        label={view.winner ? t((s) => s.taboo.turnRecap.seeResults) : t((s) => s.taboo.turnRecap.passThePhone)}
        onPress={onContinue}
      />
    </Screen>
  );
}
