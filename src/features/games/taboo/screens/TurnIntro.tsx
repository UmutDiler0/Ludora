import { View } from 'react-native';

import { Button, Card, Chip, Label, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { t } = useI18n();
  const accent = teamAccent(palette, view.activeTeam);
  const teamName = t((s) => s.taboo.team);
  const activeTeamName = teamName[view.activeTeam];

  return (
    <Screen>
      <Scoreboard view={view} />

      <Card
        accent={accent}
        style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl, flex: 1, justifyContent: 'center' }}>
        <Chip color={accent} filled>
          {t((s) => s.taboo.teamLabel)(activeTeamName)}
        </Chip>

        <Text variant="hero" center color={accent}>
          {t((s) => s.taboo.turnIntro.passTo)(view.describerName)}
        </Text>

        <Text variant="body" color={palette.onSurfaceVariant} center style={{ paddingHorizontal: spacing.md }}>
          {t((s) => s.taboo.turnIntro.everyoneElseReady)(view.describerName)}
        </Text>
      </Card>

      <Button label={t((s) => s.taboo.turnIntro.readyStart)} size="lg" onPress={onStart} />
    </Screen>
  );
}

function Scoreboard({ view }: { view: TabooPlayerView }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const teamName = t((s) => s.taboo.team);
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      {view.teams.map((team) => (
        <View key={team.id} style={{ alignItems: 'center', gap: 2 }}>
          <Label color={teamAccent(palette, team.id)}>{t((s) => s.taboo.teamLabel)(teamName[team.id])}</Label>
          <Text variant="title">{team.score}</Text>
        </View>
      ))}
    </Row>
  );
}
