import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, IconButton, Row, Screen, Text } from '@/components/ui';
import { ZartaGameOverScreen } from '@/features/games/zarta/screens/GameOver';
import { ZartaRoundRecapScreen } from '@/features/games/zarta/screens/RoundRecap';
import { VotingScreen } from '@/features/games/zarta/screens/Voting';
import { WritingScreen } from '@/features/games/zarta/screens/Writing';
import { useI18n } from '@/i18n/I18nProvider';
import { useLocalZarta, useZartaView } from '@/stores/localZarta';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, stroke } from '@/theme/tokens';

/**
 * Zarta session surface — the sibling of `/taboo` and `/sketch`, same split
 * between session chrome (this file) and one component per phase. The one
 * structural difference: `writing` and `voting` each hand the phone to every
 * seat in turn rather than one active seat per round, which is why those two
 * phase components (not this file) own the per-player "pass the phone" beat.
 */
export default function ZartaRoute() {
  const router = useRouter();
  const { t } = useI18n();
  const view = useZartaView();
  const ready = useLocalZarta((s) => s.ready);
  const submitAnswer = useLocalZarta((s) => s.submitAnswer);
  const submitVote = useLocalZarta((s) => s.submitVote);
  const continueRound = useLocalZarta((s) => s.continueRound);
  const forfeitTurnNow = useLocalZarta((s) => s.forfeitTurnNow);
  const newGame = useLocalZarta((s) => s.newGame);

  if (!view) {
    return (
      <Screen>
        <Text variant="title">{t((s) => s.zarta.session.noGameInProgress)}</Text>
        <Text variant="body">{t((s) => s.zarta.session.startFromPlay)}</Text>
        <Button label={t((s) => s.zarta.session.backToPlay)} onPress={() => router.replace('/(tabs)/play')} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ZartaHeader onLeave={() => router.replace('/(tabs)')} round={view.round} totalRounds={view.totalRounds} />

      {view.phase === 'writing' && (
        <WritingScreen view={view} onReady={ready} onSubmit={submitAnswer} onTimeUp={forfeitTurnNow} />
      )}
      {view.phase === 'voting' && (
        <VotingScreen view={view} onReady={ready} onSubmit={submitVote} onTimeUp={forfeitTurnNow} />
      )}
      {view.phase === 'round_recap' && <ZartaRoundRecapScreen view={view} onContinue={continueRound} />}
      {view.phase === 'game_over' && (
        <ZartaGameOverScreen view={view} onPlayAgain={() => newGame(view.leaderboard.length)} />
      )}
    </View>
  );
}

function ZartaHeader({
  onLeave,
  round,
  totalRounds,
}: {
  onLeave: () => void;
  round: number;
  totalRounds: number;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();

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
        <IconButton name="chevron-back" label={t((s) => s.zarta.session.leaveGame)} onPress={onLeave} />
        <Chip color={palette.secondary}>{t((s) => s.zarta.session.round)(round, totalRounds)}</Chip>
      </Row>
    </SafeAreaView>
  );
}
