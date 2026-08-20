import { useRouter } from 'expo-router';

import { Button, Screen, Text } from '@/components/ui';
import { DayScreen } from '@/features/games/vampireVillage/screens/Day';
import { GameOverScreen } from '@/features/games/vampireVillage/screens/GameOver';
import { NightScreen } from '@/features/games/vampireVillage/screens/Night';
import { RoleRevealScreen } from '@/features/games/vampireVillage/screens/RoleReveal';
import { useLocalGame, useMyView } from '@/stores/localGame';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Session surface. Renders whichever phase screen the engine is currently in —
 * the route holds no game logic of its own, per the §4 rule that files under
 * `app/` compose rather than implement.
 */
export default function GameScreen() {
  const { palette } = useTheme();

  const router = useRouter();
  const view = useMyView();
  const { ackRole, nightAction, vote, openVoting, newGame } = useLocalGame();

  if (!view) {
    return (
      <Screen>
        <Text variant="title">No game in progress</Text>
        <Text variant="body" color={palette.onSurfaceVariant}>
          Start one from the home screen.
        </Text>
        <Button label="Back to home" onPress={() => router.replace('/')} />
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
