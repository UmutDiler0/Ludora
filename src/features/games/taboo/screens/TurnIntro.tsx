import { View } from 'react-native';

import { Button, Card, Chip, Label, Row, Screen, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { TabooPlayerView } from '../state';
import { teamAccent } from './shared';

/**
 * Pass-the-phone screen — the equivalent of Vampire Village's Role Reveal, for
 * a game that has no roles to reveal but does have a describer who needs the
 * device physically handed to them before anything else can happen.
 *
 * The score line is here rather than left for the recap alone, because
 * knowing how far behind (or ahead) you are is exactly the thing that makes
 * the team decide who describes next.
 */
export function TurnIntroScreen({ view, onStart }: { view: TabooPlayerView; onStart: () => void }) {
  const { palette } = useTheme();
  const accent = teamAccent(palette, view.activeTeam);
  const activeTeamName = view.teams.find((t) => t.id === view.activeTeam)?.name ?? '';

  return (
    <Screen>
      <Scoreboard view={view} />

      <Card
        accent={accent}
        style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl, flex: 1, justifyContent: 'center' }}>
        <Chip color={accent} filled>
          Team {activeTeamName}
        </Chip>

        <Text variant="hero" center color={accent}>
          Pass to {view.describerName}
        </Text>

        <Text variant="body" color={palette.onSurfaceVariant} center style={{ paddingHorizontal: spacing.md }}>
          Everyone else, get ready to guess out loud. {view.describerName} will describe a word without
          ever saying it — or any of the words below it.
        </Text>
      </Card>

      <Button label="I'm ready — start the clock" size="lg" onPress={onStart} />
    </Screen>
  );
}

function Scoreboard({ view }: { view: TabooPlayerView }) {
  const { palette } = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      {view.teams.map((team) => (
        <View key={team.id} style={{ alignItems: 'center', gap: 2 }}>
          <Label color={teamAccent(palette, team.id)}>Team {team.name}</Label>
          <Text variant="title">{team.score}</Text>
        </View>
      ))}
    </Row>
  );
}
