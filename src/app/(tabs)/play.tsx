import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Button, Card, Chip, IconButton, Label, ListRow, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { HowToPlayDialog } from '@/features/games/core/HowToPlayDialog';
import { GAME_CATALOGUE, type GameCatalogueEntry } from '@/features/games/core/registry';
import type { GameId } from '@/features/games/core/types';
import { GameArt } from '@/features/home/GameArt';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { t } = useI18n();
  const { width } = useWindowDimensions();

  const router = useRouter();

  // Every enabled game owns a setup route and lands there first — no game
  // starts without being configured, even Vampire Village's old "quick start
  // as 6 players" shortcut, which skipped it.
  const startCatalogueGame = (id: GameId) => {
    if (id === 'taboo') return router.push('/taboo-setup');
    if (id === 'drawingGuess') return router.push('/sketch-setup');
    if (id === 'zarta') return router.push('/zarta-setup');
    if (id === 'imposter') return router.push('/imposter-setup');
    // Detective has no rules to configure — it goes straight to picking a
    // case instead of a setup screen (see registry.ts's own note on why).
    if (id === 'detective') return router.push('/detective-stories');
    if (id === 'story') return router.push('/complete-the-story');
    return router.push('/game-setup');
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
      <ScreenHeader title={t((s) => s.play.title)} subtitle={t((s) => s.play.subtitle)} />

      <Card accent={palette.primaryContainer} style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="heading">{t((s) => s.play.localPlay)}</Text>
          <Chip color={palette.secondary} filled>
            {t((s) => s.play.ready)}
          </Chip>
        </Row>
        <Text variant="body" color={palette.onSurfaceVariant}>
          {t((s) => s.play.localPlayBody)}
        </Text>
        {/* No player-count shortcut here on purpose — every game, including
            this one, is configured before it starts (§ config-screen policy),
            so this always lands on the setup screen rather than picking a
            count for you. */}
        <Button
          label={t((s) => s.play.configureAndPlay)}
          icon="options"
          onPress={() => router.push('/game-setup')}
        />
      </Card>

      <Label>{t((s) => s.play.multiplayer)}</Label>
      <View style={{ gap: spacing.sm }}>
        <ListRow
          title={t((s) => s.play.quickMatch)}
          subtitle={t((s) => s.play.quickMatchBody)}
          trailing={<Chip>{t((s) => s.play.phase2)}</Chip>}
        />
        <ListRow
          title={t((s) => s.play.createGame)}
          subtitle={t((s) => s.play.createGameBody)}
          trailing={<Chip>{t((s) => s.play.phase2)}</Chip>}
        />
        <ListRow
          title={t((s) => s.play.joinByCode)}
          subtitle={t((s) => s.play.joinByCodeBody)}
          trailing={<Chip>{t((s) => s.play.phase2)}</Chip>}
        />
        <ListRow
          title={t((s) => s.play.browseRooms)}
          subtitle={t((s) => s.play.browseRoomsBody)}
          trailing={<Chip>{t((s) => s.play.phase2)}</Chip>}
        />
      </View>

      <Label>{t((s) => s.play.catalogue)}</Label>
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
 * are pressable and open that game's setup screen, same as the Home trending
 * strip; disabled ones are shown but honestly inert.
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
  const { t } = useI18n();
  const [howToPlay, setHowToPlay] = useState(false);
  const name = t((s) => s.catalogue.name)[game.id];
  const category = t((s) => s.catalogue.category)[game.id];
  const modeLabel = t((s) => s.catalogue.mode);

  const body = (
    <>
      <View>
        <GameArt id={game.id} height={96} />
        <View style={{ position: 'absolute', top: spacing.xs, right: spacing.xs }}>
          <IconButton
            name="information-circle-outline"
            label={t((s) => s.common.howToPlayLabel)(name)}
            onPress={() => setHowToPlay(true)}
          />
        </View>
      </View>
      <View style={{ padding: spacing.md, gap: spacing.xs }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" color={palette.onSurfaceVariant} numberOfLines={1}>
          {category} · {t((s) => s.common.playersRange)(game.minPlayers, game.maxPlayers)}
        </Text>
        <Row gap={spacing.xs} style={{ flexWrap: 'wrap' }}>
          {game.enabled ? (
            <Chip color={palette.secondary} filled>
              {t((s) => s.common.playable)}
            </Chip>
          ) : (
            <>
              {game.isPremium && <Chip color={palette.tertiary}>{t((s) => s.common.premium)}</Chip>}
              <Chip>{t((s) => s.common.soon)}</Chip>
            </>
          )}
          <Chip>{game.modes.map((m) => modeLabel[m]).join(' · ')}</Chip>
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

  return (
    <>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t((s) => s.common.playGame)(name)}
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
      ) : (
        <View style={shell}>{body}</View>
      )}
      <HowToPlayDialog gameId={game.id} visible={howToPlay} onDismiss={() => setHowToPlay(false)} />
    </>
  );
}
