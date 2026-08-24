import { View } from 'react-native';

import { Button, Card, Label, Row, Screen, StatTile, Text } from '@/components/ui';
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
  const draw = view.winner === 'draw';
  // Narrowed through a fresh variable rather than `view.winner!`, which TS
  // cannot narrow away from `TabooWinner` (`'A' | 'B' | 'draw'`) down to
  // `TabooTeamId` just from the `draw` boolean computed above.
  const winningTeamId = view.winner === 'A' || view.winner === 'B' ? view.winner : null;
  const accent = winningTeamId ? teamAccent(palette, winningTeamId) : palette.onSurfaceVariant;
  const winningTeam = winningTeamId ? view.teams.find((t) => t.id === winningTeamId) : null;
  const [first, second] = view.teams;

  return (
    <Screen>
      <Card accent={accent} style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <Label color={accent} center>
          {draw ? 'Draw' : 'Game Over'}
        </Label>
        <Text variant="hero" color={accent} center>
          {draw ? "It's a tie" : `Team ${winningTeam?.name} wins`}
        </Text>
      </Card>

      <Row>
        <StatTile
          value={String(first.score)}
          caption={`Team ${first.name}`}
          color={teamAccent(palette, first.id)}
        />
        <StatTile
          value={String(second.score)}
          caption={`Team ${second.name}`}
          color={teamAccent(palette, second.id)}
        />
        <StatTile value={String(view.turn)} caption="Turns played" />
      </Row>

      <Label>Rosters</Label>
      <View style={{ gap: spacing.sm }}>
        {view.teams.map((team) => (
          <Card key={team.id} style={{ paddingVertical: spacing.md, gap: spacing.xs }}>
            <Text variant="bodyStrong" color={teamAccent(palette, team.id)}>
              Team {team.name}
            </Text>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              {team.members.map((m) => m.displayName).join(', ')}
            </Text>
          </Card>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Button label="Play again" onPress={onPlayAgain} />
    </Screen>
  );
}
