import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, IconButton, Row, Screen, Text } from '@/components/ui';
import { DescribingScreen } from '@/features/games/taboo/screens/Describing';
import { TabooGameOverScreen } from '@/features/games/taboo/screens/GameOver';
import { teamAccent } from '@/features/games/taboo/screens/shared';
import { TurnIntroScreen } from '@/features/games/taboo/screens/TurnIntro';
import { TurnRecapScreen } from '@/features/games/taboo/screens/TurnRecap';
import { useI18n } from '@/i18n/I18nProvider';
import { useLocalTaboo, useTabooView } from '@/stores/localTaboo';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, stroke } from '@/theme/tokens';

/**
 * Taboo session surface — the sibling of `/game` (Vampire Village), one route
 * simpler because Taboo has no Roles or Log tab to share a header with.
 *
 * No lobby exists yet, so this is reached only from Play's Local Play card,
 * exactly the shortcut `/game` uses. The header stays put across every phase;
 * each phase component below is otherwise the whole screen, same split
 * `/game/index.tsx` keeps between session chrome and phase content.
 */
export default function TabooRoute() {
  const router = useRouter();
  const { t } = useI18n();
  const view = useTabooView();
  const startTurn = useLocalTaboo((s) => s.startTurn);
  const mark = useLocalTaboo((s) => s.mark);
  const continueTurn = useLocalTaboo((s) => s.continueTurn);
  const endTurnNow = useLocalTaboo((s) => s.endTurnNow);
  const newGame = useLocalTaboo((s) => s.newGame);

  if (!view) {
    return (
      <Screen>
        <Text variant="title">{t((s) => s.taboo.session.noGameInProgress)}</Text>
        <Text variant="body">{t((s) => s.taboo.session.startFromPlay)}</Text>
        <Button label={t((s) => s.taboo.session.backToPlay)} onPress={() => router.replace('/(tabs)/play')} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TabooHeader onLeave={() => router.replace('/(tabs)')} teams={view.teams} />

      {view.phase === 'turn_intro' && <TurnIntroScreen view={view} onStart={startTurn} />}
      {view.phase === 'describing' && (
        <DescribingScreen view={view} onMark={mark} onTimeUp={endTurnNow} />
      )}
      {view.phase === 'turn_recap' && <TurnRecapScreen view={view} onContinue={continueTurn} />}
      {view.phase === 'game_over' && (
        <TabooGameOverScreen
          view={view}
          onPlayAgain={() => newGame(view.teams.reduce((n, t) => n + t.members.length, 0))}
        />
      )}
    </View>
  );
}

function TabooHeader({
  onLeave,
  teams,
}: {
  onLeave: () => void;
  teams: { id: 'A' | 'B'; name: string; score: number }[];
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const teamName = t((s) => s.taboo.team);

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        backgroundColor: palette.surface,
        borderBottomWidth: stroke.base,
        borderBottomColor: palette.ink,
      }}>
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        }}>
        <IconButton name="chevron-back" label={t((s) => s.taboo.session.leaveGame)} onPress={onLeave} />
        <Row gap={spacing.xs}>
          {teams.map((team) => (
            <Chip key={team.id} color={teamAccent(palette, team.id)}>
              {teamName[team.id as 'A' | 'B']} {team.score}
            </Chip>
          ))}
        </Row>
      </Row>
    </SafeAreaView>
  );
}
