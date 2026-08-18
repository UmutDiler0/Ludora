import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Chip, Label, ListRow, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { GAME_CATALOGUE } from '@/features/games/core/registry';
import { useLocalGame } from '@/stores/localGame';
import { palette, spacing } from '@/theme/tokens';

/**
 * Play hub (spec §9) — Create Game, Join Game, Quick Match.
 *
 * This route has no design (docs/ARCHITECTURE.md §1.3), so it is composed from
 * the primitive kit per decision D20 and restyles later as a props change.
 *
 * The three room paths are Phase 2 and need realtime infrastructure that does
 * not exist yet, so they are visibly pending. Local Play is not a placeholder:
 * it runs the real Vampire Village engine hot-seat on one device, which is why
 * it sits above them.
 */
export default function Play() {
  const router = useRouter();
  const newGame = useLocalGame((s) => s.newGame);

  const startLocal = (players: number) => {
    newGame(players);
    router.push('/game');
  };

  const playable = GAME_CATALOGUE.filter((g) => g.enabled);
  const upcoming = GAME_CATALOGUE.filter((g) => !g.enabled);

  return (
    <Screen>
      <ScreenHeader title="Oyna" subtitle="Start a room, join friends, or play on this device." />

      <Card accent={palette.primaryContainer} style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="heading">Local play</Text>
          <Chip color={palette.secondary} filled>
            Ready
          </Chip>
        </Row>
        <Text variant="body" color={palette.onSurfaceVariant}>
          Vampire Village, hot-seat on one device. Pass the phone around — no account, no network.
        </Text>
        <Row gap={spacing.sm}>
          {[4, 6, 9].map((count, i) => (
            <Button
              key={count}
              label={`${count} players`}
              tone={i === 1 ? 'primary' : 'ghost'}
              onPress={() => startLocal(count)}
              style={{ flex: 1 }}
            />
          ))}
        </Row>
      </Card>

      <Label>Multiplayer</Label>
      <View style={{ gap: spacing.sm }}>
        <ListRow
          title="Quick match"
          subtitle="Drop into the fullest public room that still fits"
          trailing={<Chip>Phase 2</Chip>}
        />
        <ListRow
          title="Create game"
          subtitle="Pick a game, configure it, host the room"
          trailing={<Chip>Phase 2</Chip>}
        />
        <ListRow
          title="Join by code"
          subtitle="Enter a six-character room code"
          trailing={<Chip>Phase 2</Chip>}
        />
        <ListRow
          title="Browse rooms"
          subtitle="See every public room that is open"
          trailing={<Chip>Phase 2</Chip>}
        />
      </View>

      <Label>Catalogue</Label>
      <View style={{ gap: spacing.sm }}>
        {playable.map((game) => (
          <ListRow
            key={game.id}
            title={game.name}
            subtitle={`${game.category} · ${game.minPlayers}–${game.maxPlayers} players`}
            accent={palette.secondaryContainer}
            trailing={<Chip color={palette.secondary}>Playable</Chip>}
          />
        ))}
        {upcoming.map((game) => (
          <ListRow
            key={game.id}
            title={game.name}
            subtitle={`${game.category} · ${game.minPlayers}–${game.maxPlayers} players`}
            trailing={
              <Row gap={spacing.sm}>
                {game.isPremium && <Chip color={palette.tertiary}>Premium</Chip>}
                <Chip>Soon</Chip>
              </Row>
            }
          />
        ))}
      </View>
    </Screen>
  );
}
