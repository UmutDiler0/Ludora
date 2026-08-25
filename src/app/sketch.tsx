import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, IconButton, Row, Screen, Text } from '@/components/ui';
import { DrawingScreen } from '@/features/games/sketchIt/screens/Drawing';
import { SketchGameOverScreen } from '@/features/games/sketchIt/screens/GameOver';
import { RoundIntroScreen } from '@/features/games/sketchIt/screens/RoundIntro';
import { RoundRecapScreen } from '@/features/games/sketchIt/screens/RoundRecap';
import { useI18n } from '@/i18n/I18nProvider';
import { useLocalSketch, useSketchView } from '@/stores/localSketch';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, stroke } from '@/theme/tokens';

/**
 * Sketch It session surface — the sibling of `/taboo`, same split between
 * session chrome (this file) and one component per phase.
 *
 * No lobby exists yet, so this is reached only from Play's Sketch It card or
 * Home's trending strip, both of which route through `/sketch-setup` first —
 * unlike Vampire Village, there is no bare headcount shortcut here, because
 * the config screen is where the room owner sets drawing time.
 */
export default function SketchRoute() {
  const router = useRouter();
  const { t } = useI18n();
  const view = useSketchView();
  const startRound = useLocalSketch((s) => s.startRound);
  const markGuess = useLocalSketch((s) => s.markGuess);
  const continueRound = useLocalSketch((s) => s.continueRound);
  const endRoundNow = useLocalSketch((s) => s.endRoundNow);
  const newGame = useLocalSketch((s) => s.newGame);

  if (!view) {
    return (
      <Screen>
        <Text variant="title">{t((s) => s.sketchIt.session.noGameInProgress)}</Text>
        <Text variant="body">{t((s) => s.sketchIt.session.startFromPlay)}</Text>
        <Button label={t((s) => s.sketchIt.session.backToPlay)} onPress={() => router.replace('/(tabs)/play')} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SketchHeader onLeave={() => router.replace('/(tabs)')} round={view.round} totalRounds={view.totalRounds} />

      {view.phase === 'round_intro' && <RoundIntroScreen view={view} onStart={startRound} />}
      {view.phase === 'drawing' && (
        <DrawingScreen view={view} onMarkGuess={markGuess} onTimeUp={endRoundNow} />
      )}
      {view.phase === 'round_recap' && <RoundRecapScreen view={view} onContinue={continueRound} />}
      {view.phase === 'game_over' && (
        <SketchGameOverScreen view={view} onPlayAgain={() => newGame(view.totalRounds)} />
      )}
    </View>
  );
}

function SketchHeader({
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
        <IconButton name="chevron-back" label={t((s) => s.sketchIt.session.leaveGame)} onPress={onLeave} />
        <Chip color={palette.tertiary}>{t((s) => s.sketchIt.session.round)(round, totalRounds)}</Chip>
      </Row>
    </SafeAreaView>
  );
}
