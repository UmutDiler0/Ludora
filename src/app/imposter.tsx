import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton, Row, Screen, Text } from '@/components/ui';
import { ImposterDiscussionScreen } from '@/features/games/imposter/screens/Discussion';
import { ImposterGameOverScreen } from '@/features/games/imposter/screens/GameOver';
import { ImposterRoleRevealScreen } from '@/features/games/imposter/screens/RoleReveal';
import { ImposterVotingScreen } from '@/features/games/imposter/screens/Voting';
import { useI18n } from '@/i18n/I18nProvider';
import { useImposterView, useLocalImposter } from '@/stores/localImposter';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, stroke } from '@/theme/tokens';

/**
 * Imposter session surface — the sibling of `/zarta`, same split between
 * session chrome (this file) and one component per phase.
 */
export default function ImposterRoute() {
  const router = useRouter();
  const { t } = useI18n();
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
        <Text variant="title">{t((s) => s.imposter.session.noGameInProgress)}</Text>
        <Text variant="body">{t((s) => s.imposter.session.startFromPlay)}</Text>
        <Button label={t((s) => s.imposter.session.backToPlay)} onPress={() => router.replace('/(tabs)/play')} />
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

function ImposterHeader({ onLeave, phase }: { onLeave: () => void; phase: string }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const phaseLabel = t((s) => s.imposter.session.phase) as Record<string, string>;

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
        <IconButton name="chevron-back" label={t((s) => s.imposter.session.leaveGame)} onPress={onLeave} />
        <Text variant="bodyStrong" color={palette.onSurfaceVariant}>
          {phaseLabel[phase] ?? phase}
        </Text>
      </Row>
    </SafeAreaView>
  );
}
