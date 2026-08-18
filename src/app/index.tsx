import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Chip, Label, Row, Screen, Text } from '@/components/ui';
import { GAME_CATALOGUE } from '@/features/games/core/registry';
import { useLocalGame } from '@/stores/localGame';
import { palette, spacing } from '@/theme/tokens';

/**
 * Temporary entry point. The real Home Dashboard (spec §7) arrives in Phase 1;
 * this exists so the Phase 3 session screens can be run and played today,
 * before any backend exists.
 */
export default function Home() {
  const router = useRouter();
  const newGame = useLocalGame((s) => s.newGame);

  const startLocal = (players: number) => {
    newGame(players);
    router.push('/game');
  };

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginTop: spacing.xl }}>
        <Label color={palette.primary}>Party game hub</Label>
        <Text variant="hero">Ludora</Text>
        <Text variant="body" color={palette.onSurfaceVariant}>
          Phase 3 preview — the Vampire Village engine running locally with bots. No account, no
          network.
        </Text>
      </View>

      <Card accent={palette.primaryContainer} style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="heading">Vampire Village</Text>
          <Chip color={palette.secondary}>Free</Chip>
        </Row>
        <Text variant="body" color={palette.onSurfaceVariant}>
          Social deduction for 4–12 players. Vampires hunt by night; the village votes by day.
        </Text>
        <Row gap={spacing.sm}>
          <Button label="4 players" tone="ghost" onPress={() => startLocal(4)} style={{ flex: 1 }} />
          <Button label="6 players" onPress={() => startLocal(6)} style={{ flex: 1 }} />
          <Button label="9 players" tone="ghost" onPress={() => startLocal(9)} style={{ flex: 1 }} />
        </Row>
      </Card>

      <Label>Catalogue</Label>
      <View style={{ gap: spacing.sm }}>
        {GAME_CATALOGUE.filter((g) => g.id !== 'vampireVillage').map((game) => (
          <Card key={game.id} style={{ opacity: 0.55, paddingVertical: spacing.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <Text variant="bodyStrong">{game.name}</Text>
                <Text variant="caption" color={palette.onSurfaceVariant}>
                  {game.category} · {game.minPlayers}–{game.maxPlayers} players
                </Text>
              </View>
              <Row gap={spacing.sm}>
                {game.isPremium && <Chip color={palette.tertiary}>Premium</Chip>}
                <Chip>Soon</Chip>
              </Row>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
