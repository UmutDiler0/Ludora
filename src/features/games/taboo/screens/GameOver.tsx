import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, StatTile, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { TabooPlayerView } from '../state';
import { teamAccent } from './shared';

/**
 * Game Over — deliberately not framed as "you won" the way Vampire Village's
 * is. There is no single "you" in a pass-and-play game every seat at the table
 * physically played: it is Team Red's or Team Blue's result, read the same way
 * by whoever is holding the phone when it appears.
 */
export function TabooGameOverScreen({ view, onPlayAgain }: { view: TabooPlayerView; onPlayAgain: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const draw = view.winner === 'draw';
  // Narrowed through a fresh variable rather than `view.winner!`, which TS
  // cannot narrow away from `TabooWinner` (`'A' | 'B' | 'draw'`) down to
  // `TabooTeamId` just from the `draw` boolean computed above.
  const winningTeamId = view.winner === 'A' || view.winner === 'B' ? view.winner : null;
  const accent = winningTeamId ? teamAccent(palette, winningTeamId) : palette.onSurfaceVariant;
  const teamName = t((s) => s.taboo.team);
  const [first, second] = view.teams;

  return (
    <Screen>
      <Card accent={accent} style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <Label color={accent} center>
          {draw ? t((s) => s.taboo.gameOver.draw) : t((s) => s.taboo.gameOver.gameOver)}
        </Label>
        <Text variant="hero" color={accent} center>
          {draw ? t((s) => s.taboo.gameOver.tie) : t((s) => s.taboo.gameOver.teamWins)(winningTeamId ? teamName[winningTeamId] : '')}
        </Text>
      </Card>

      <Row>
        <StatTile
          value={String(first.score)}
          caption={t((s) => s.taboo.teamLabel)(teamName[first.id])}
          color={teamAccent(palette, first.id)}
        />
        <StatTile
          value={String(second.score)}
          caption={t((s) => s.taboo.teamLabel)(teamName[second.id])}
          color={teamAccent(palette, second.id)}
        />
        <StatTile value={String(view.turn)} caption={t((s) => s.taboo.gameOver.turnsPlayed)} />
      </Row>

      <Label>{t((s) => s.taboo.gameOver.rosters)}</Label>
      <View style={{ gap: spacing.sm }}>
        {view.teams.map((team) => (
          <Card key={team.id} style={{ paddingVertical: spacing.md, gap: spacing.xs }}>
            <Text variant="bodyStrong" color={teamAccent(palette, team.id)}>
              {t((s) => s.taboo.teamLabel)(teamName[team.id])}
            </Text>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              {team.members.map((m) => m.displayName).join(', ')}
            </Text>
          </Card>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Button label={t((s) => s.taboo.gameOver.playAgain)} onPress={onPlayAgain} />
    </Screen>
  );
}
