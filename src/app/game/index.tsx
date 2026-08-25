import { useRouter } from 'expo-router';

import { Button, Screen, Text } from '@/components/ui';
import { DayScreen } from '@/features/games/vampireVillage/screens/Day';
import { GameOverScreen } from '@/features/games/vampireVillage/screens/GameOver';
import { NightScreen } from '@/features/games/vampireVillage/screens/Night';
import { RoleRevealScreen } from '@/features/games/vampireVillage/screens/RoleReveal';
import { useI18n } from '@/i18n/I18nProvider';
import { useLocalGame, useMyView } from '@/stores/localGame';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Session surface. Renders whichever phase screen the engine is currently in —
 * the route holds no game logic of its own, per the §4 rule that files under
 * `app/` compose rather than implement.
 */
export default function GameScreen() {
  const { palette } = useTheme();
  const { t } = useI18n();

  const router = useRouter();
  const view = useMyView();
  const endedReason = useLocalGame((s) => s.endedReason);
  const { ackRole, nightAction, vote, openVoting, newGame } = useLocalGame();

  if (!view) {
    // A session that ended because the network gave out gets said out loud.
    // "No game in progress" after being dropped reads as the app losing track
    // of something, rather than as the thing that actually happened.
    const dropped = endedReason === 'disconnected';
    return (
      <Screen>
        <Text variant="title">
          {dropped ? t((s) => s.vampireVillage.session.disconnectedTitle) : t((s) => s.vampireVillage.session.noGameInProgress)}
        </Text>
        <Text variant="body" color={palette.onSurfaceVariant}>
          {dropped
            ? t((s) => s.vampireVillage.session.disconnectedBody)
            : t((s) => s.vampireVillage.session.startFromHome)}
        </Text>
        <Button label={t((s) => s.vampireVillage.session.backToHome)} onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  switch (view.phase) {
    case 'role_reveal':
      return <RoleRevealScreen view={view} onAck={ackRole} />;
    case 'night':
      return <NightScreen view={view} onSelect={nightAction} />;
    case 'day_discussion':
    case 'day_vote':
      return <DayScreen view={view} onVote={vote} onOpenVoting={openVoting} />;
    case 'game_over':
      return <GameOverScreen view={view} onPlayAgain={() => newGame(view.players.length)} />;
  }
}
