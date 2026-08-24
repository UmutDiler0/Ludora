import { useRouter } from 'expo-router';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Button, Card, Chip, Label, ListRow, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { GAME_CATALOGUE, type GameCatalogueEntry } from '@/features/games/core/registry';
import type { GameId } from '@/features/games/core/types';
import { GameArt } from '@/features/home/GameArt';
import { useLocalGame } from '@/stores/localGame';
import { useLocalTaboo } from '@/stores/localTaboo';
import { radius, spacing, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/** Cards flex down to fit small phones and up to fit tablets/web, never fewer than 2 per row. */
const MIN_CARD_WIDTH = 156;

/**
 * Play hub (spec §9) — Create Game, Join Game, Quick Match.
 *
 * This route has no design (docs/ARCHITECTURE.md §1.3), so it is composed from
 * the primitive kit per decision D20 and restyles later as a props change.
 *
 * The three room paths are Phase 2 and need realtime infrastructure that does
 * not exist yet, so they are visibly pending. Local Play is not a placeholder:
 * it runs the real engines — Vampire Village and Taboo — hot-seat on one
 * device, which is why the two of them sit above the pending rooms rather
 * than being just another catalogue tile.
 */
export default function Play() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();

  const router = useRouter();
  const newVillageGame = useLocalGame((s) => s.newGame);
  const newTabooGame = useLocalTaboo((s) => s.newGame);

  const startLocal = (players: number) => {
    newVillageGame(players);
    router.push('/game');
  };

  const startTaboo = (players: number) => {
    newTabooGame(players);
    router.push('/taboo');
  };

  // Each enabled game owns its route and its own local driver — the catalogue
  // only needs to know which of the two to call.
  const startCatalogueGame = (id: GameId) => {
    if (id === 'taboo') return startTaboo(4);
    return startLocal(6);
  };

  // Available width is the screen minus Screen's own horizontal padding (spacing.xl each side).
  const gridWidth = width - spacing.xl * 2;
  const columns = Math.max(2, Math.floor((gridWidth + spacing.sm) / (MIN_CARD_WIDTH + spacing.sm)));
  const cardWidth = (gridWidth - spacing.sm * (columns - 1)) / columns;

  // Playable sorts first — a playable game should never rank below one the
  // player cannot open, matching the Home trending strip's rule.
  const catalogue = [...GAME_CATALOGUE].sort((a, b) => Number(b.enabled) - Number(a.enabled));

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
        {/* The three buttons above are the Classic preset at a fixed size —
            this is the same room-owner setup a real lobby will have, just
            reached one tap later because there is only ever one owner here. */}
        <Button
          label="Configure the room"
          icon="options"
          tone="ghost"
          onPress={() => router.push('/game-setup')}
        />
      </Card>

      <Card accent={palette.secondaryContainer} style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="heading">Taboo Words</Text>
          <Chip color={palette.secondary} filled>
            Ready
          </Chip>
        </Row>
        <Text variant="body" color={palette.onSurfaceVariant}>
          Pass-and-play, two teams. Describe the word without saying it — or
          any word on the forbidden list.
        </Text>
        <Button label="Quick play — 4 players" onPress={() => startTaboo(4)} />
        {/* Unlike Vampire Village's three buttons, a headcount alone cannot
            stand in for Taboo's setup — who's on which team is a real choice,
            not a shuffle, so building the roster gets its own screen rather
            than a size picker. */}
        <Button
          label="Name players & build teams"
          icon="people"
          tone="ghost"
          onPress={() => router.push('/taboo-setup')}
        />
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {catalogue.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            width={cardWidth}
            onPress={game.enabled ? () => startCatalogueGame(game.id) : undefined}
          />
        ))}
      </View>
    </Screen>
  );
}

/**
 * Grid tile for the catalogue — art from `GameArt` (real key art, not a
 * placeholder), category/player-count line, and a status chip. Enabled games
 * are pressable and drop straight into a 6-player local game, same shortcut
 * the Home trending strip uses; disabled ones are shown but honestly inert.
 */
function GameCard({
  game,
  width,
  onPress,
}: {
  game: GameCatalogueEntry;
  width: number;
  onPress?: () => void;
}) {
  const { palette } = useTheme();

  const body = (
    <>
      <GameArt id={game.id} height={96} />
      <View style={{ padding: spacing.md, gap: spacing.xs }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {game.name}
        </Text>
        <Text variant="caption" color={palette.onSurfaceVariant} numberOfLines={1}>
          {game.category} · {game.minPlayers}–{game.maxPlayers}
        </Text>
        <Row gap={spacing.xs} style={{ flexWrap: 'wrap' }}>
          {game.enabled ? (
            <Chip color={palette.secondary} filled>
              Playable
            </Chip>
          ) : (
            <>
              {game.isPremium && <Chip color={palette.tertiary}>Premium</Chip>}
              <Chip>Soon</Chip>
            </>
          )}
        </Row>
      </View>
    </>
  );

  const shell = {
    width,
    borderRadius: radius.lg,
    borderWidth: stroke.base,
    borderColor: palette.ink,
    borderBottomWidth: stroke.depth,
    backgroundColor: palette.surface,
    overflow: 'hidden' as const,
    opacity: game.enabled ? 1 : 0.72,
  };

  if (!onPress) return <View style={shell}>{body}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play ${game.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        shell,
        pressed && {
          borderBottomWidth: stroke.depthPressed,
          transform: [{ translateY: stroke.depth - stroke.depthPressed }],
        },
      ]}>
      {body}
    </Pressable>
  );
}
