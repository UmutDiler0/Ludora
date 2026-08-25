import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton, Row, Screen, Text } from '@/components/ui';
import { ImposterDiscussionScreen } from '@/features/games/imposter/screens/Discussion';
import { ImposterGameOverScreen } from '@/features/games/imposter/screens/GameOver';
import { ImposterRoleRevealScreen } from '@/features/games/imposter/screens/RoleReveal';
import { ImposterVotingScreen } from '@/features/games/imposter/screens/Voting';
import { useImposterView, useLocalImposter } from '@/stores/localImposter';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, stroke } from '@/theme/tokens';

/**
 * Imposter session surface — the sibling of `/zarta`, same split between
 * session chrome (this file) and one component per phase.
 */
export default function ImposterRoute() {
  const router = useRouter();
  const view = useImposterView();
  const ackRole = useLocalImposter((s) => s.ackRole);
  const callVote = useLocalImposter((s) => s.callVote);
  const submitVote = useLocalImposter((s) => s.submitVote);
  const guessValue = useLocalImposter((s) => s.guessValue);
  const timeUp = useLocalImposter((s) => s.timeUp);
  const newGame = useLocalImposter((s) => s.newGame);

  if (!view) {
    return (
      <Screen>
        <Text variant="title">No game in progress</Text>
        <Text variant="body">Start one from the Play tab.</Text>
        <Button label="Back to Play" onPress={() => router.replace('/(tabs)/play')} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ImposterHeader onLeave={() => router.replace('/(tabs)')} phase={view.phase} />

      {view.phase === 'role_reveal' && <ImposterRoleRevealScreen view={view} onAck={ackRole} />}
      {view.phase === 'discussion' && (
        <ImposterDiscussionScreen view={view} onCallVote={callVote} onGuess={guessValue} onTimeUp={timeUp} />
      )}
      {view.phase === 'voting' && <ImposterVotingScreen view={view} onSubmit={submitVote} />}
      {view.phase === 'game_over' && (
        <ImposterGameOverScreen view={view} onPlayAgain={() => newGame(view.players.length)} />
      )}
    </View>
  );
}

const PHASE_LABEL: Record<string, string> = {
  role_reveal: 'Reveal',
  discussion: 'Discussion',
  voting: 'Vote',
  game_over: 'Results',
};

function ImposterHeader({ onLeave, phase }: { onLeave: () => void; phase: string }) {
  const { palette } = useTheme();

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
        <IconButton name="chevron-back" label="Leave game" onPress={onLeave} />
        <Text variant="bodyStrong" color={palette.onSurfaceVariant}>
          {PHASE_LABEL[phase] ?? phase}
        </Text>
      </Row>
    </SafeAreaView>
  );
}
