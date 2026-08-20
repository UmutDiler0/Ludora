import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import {
  Avatar,
  Button,
  Card,
  Chip,
  GoldPill,
  ProgressBar,
  Row,
  Screen,
  Text,
} from '@/components/ui';
import { AWARDS } from '@/features/economy/levels';
import { GameArt } from '@/features/home/GameArt';
import { DUMMY_CHAMPIONS, trendingGames, type Champion, type TrendingGame } from '@/features/home/dummy';
import { useDailyClaimable, useLevel, useProfile } from '@/stores/profile';
import { useLocalGame } from '@/stores/localGame';
import { useSession } from '@/stores/session';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Home Dashboard (spec §7).
 *
 * Follows the original "Home Dashboard" design rather than "Home Dashboard -
 * Spec Aligned", per docs/ARCHITECTURE.md §1.1: only the original carries the
 * avatar, level, XP bar, gold, champions preview and trending strip that §7
 * requires. The tab bar comes from this route group's layout (decision D1), so
 * neither design's rival bar is used.
 *
 * Two deliberate deviations from the mockup, both noted rather than silent:
 *
 *   1. Gold sits in the top bar, not inside the player card. Every other tab
 *      already puts the balance there, and a balance that moves between
 *      screens is worse than one that disagrees with a mockup.
 *   2. The daily reward sits directly under the player card instead of at the
 *      very bottom. It is the only expiring action on the screen, and the
 *      design buries it below a scrolling trending strip where it can be
 *      missed entirely. It disappears once claimed, so it costs nothing on
 *      the days it is not actionable.
 *
 * Data: champions and live player counts are placeholders from
 * `features/home/dummy.ts` — see that file for which Firestore/RTDB source
 * each one stands in for. Level, XP, gold and the daily streak are already
 * real, read straight from the profile store.
 */
export default function Home() {
  const router = useRouter();
  const { palette } = useTheme();

  const { displayName, handle, gold, dailyStreak } = useProfile();
  const level = useLevel();
  const isGuest = useSession((s) => s.isGuest);
  const claimable = useDailyClaimable() && !isGuest;
  const claimDaily = useProfile((s) => s.claimDaily);
  const newGame = useLocalGame((s) => s.newGame);

  const trending = useMemo(() => trendingGames(), []);

  /**
   * Quick Play runs the local hot-seat game. Matchmaking is Phase 2 and needs
   * realtime infrastructure that does not exist yet, so the hero button does
   * the most complete thing available and says exactly what that is instead of
   * promising a lobby it cannot open.
   */
  const quickPlay = () => {
    newGame(6);
    router.push('/game');
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 4, marginRight: spacing.md }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {displayName}
          </Text>
          <Row gap={spacing.sm}>
            <View style={{ flex: 1 }}>
              <ProgressBar value={level.fraction} height={8} />
            </View>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              Lv {level.level}
            </Text>
          </Row>
        </View>
        <GoldPill amount={gold} />
      </Row>

      {/* ------------------------------------------------------ player card */}
      <Card style={{ gap: spacing.lg }}>
        <Row gap={spacing.lg}>
          <Avatar uid={handle} name={displayName} size={60} ring={palette.primaryContainer} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              Welcome back
            </Text>
            <Text variant="heading" numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        </Row>

        <View style={{ gap: spacing.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Chip color={palette.primary} filled>
              Lv {level.level}
            </Chip>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              {level.xpToLevelUp.toLocaleString()} XP to level {level.level + 1}
            </Text>
          </Row>
          <ProgressBar value={level.fraction} />
        </View>
      </Card>

      {claimable && (
        <DailyRewardBanner
          streak={dailyStreak}
          gold={AWARDS.dailyReward.gold}
          onClaim={() => claimDaily(AWARDS.dailyReward.gold)}
        />
      )}

      {/* ----------------------------------------------------------- actions */}
      <View style={{ gap: spacing.sm }}>
        <Button label="Quick Play" icon="play" size="lg" onPress={quickPlay} />
        <Text variant="caption" color={palette.onSurfaceVariant} center>
          Vampire Village · 6 players · hot-seat on this device
        </Text>
      </View>

      <Row gap={spacing.sm} style={{ alignItems: 'stretch' }}>
        <ActionTile
          icon="add-circle-outline"
          label="Create Game"
          onPress={() => router.push('/(tabs)/play')}
        />
        <ActionTile
          icon="people-outline"
          label="Join Game"
          onPress={() => router.push('/(tabs)/play')}
        />
      </Row>

      {/* --------------------------------------------------------- champions */}
      <Card style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={spacing.sm}>
            <Ionicons name="trophy" size={20} color={palette.medalGold} />
            <Text variant="heading">Champions</Text>
          </Row>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push('/(tabs)/leaderboard')}>
            <Text variant="bodyStrong" color={palette.primary}>
              View all
            </Text>
          </Pressable>
        </Row>

        {DUMMY_CHAMPIONS.map((champion) => (
          <ChampionRow key={champion.uid} champion={champion} />
        ))}
      </Card>

      {/* ---------------------------------------------------------- trending */}
      <Row gap={spacing.sm}>
        <Ionicons name="flame" size={20} color={palette.error} />
        <Text variant="heading">Trending now</Text>
      </Row>

      <View style={{ gap: spacing.md }}>
        {trending.map((game) => (
          <TrendingCard
            key={game.id}
            game={game}
            onPress={
              game.enabled
                ? () => {
                    newGame(6);
                    router.push('/game');
                  }
                : undefined
            }
          />
        ))}
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------------ pieces */

/**
 * Square-ish secondary action. Sinks on press like every other control, so the
 * cartoon depth rule holds across the whole screen.
 */
function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          gap: spacing.sm,
          paddingVertical: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: stroke.base,
          borderColor: palette.ink,
          borderBottomWidth: stroke.depth,
          backgroundColor: palette.surface,
          alignItems: 'center',
        },
        pressed && {
          borderBottomWidth: stroke.depthPressed,
          transform: [{ translateY: stroke.depth - stroke.depthPressed }],
        },
      ]}>
      <Ionicons name={icon} size={26} color={palette.primary} />
      <Text variant="bodyStrong">{label}</Text>
    </Pressable>
  );
}

/**
 * Claimable daily reward. Rendered only while it is actually claimable, so it
 * never sits on the dashboard as a disabled ornament.
 */
function DailyRewardBanner({
  streak,
  gold,
  onClaim,
}: {
  streak: number;
  gold: number;
  onClaim: () => void;
}) {
  const { palette } = useTheme();
  // A streak of 0 means "never claimed", which is day one rather than day zero.
  const nextDay = streak + 1;

  return (
    <Card accent={palette.tertiary} style={{ gap: spacing.md }}>
      <Row gap={spacing.md}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radius.sm,
            backgroundColor: palette.tertiaryContainer,
            borderWidth: stroke.thin,
            borderColor: palette.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="gift" size={24} color={palette.onTertiary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">Daily reward ready</Text>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {streak > 0 ? `Day ${nextDay} of your streak` : 'Start a streak today'} · +
            {gold} gold
          </Text>
        </View>
      </Row>
      <Button label={`Claim ${gold} gold`} tone="secondary" onPress={onClaim} />
    </Card>
  );
}

const MEDALS = (p: Palette): Record<Champion['rank'], string> => ({
  1: p.medalGold,
  2: p.medalSilver,
  3: p.medalBronze,
});

function ChampionRow({ champion }: { champion: Champion }) {
  const { palette } = useTheme();
  const medal = MEDALS(palette)[champion.rank];

  return (
    <Row gap={spacing.md}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: medal,
          borderWidth: stroke.thin,
          borderColor: palette.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text variant="label" color={palette.ink}>
          {champion.rank}
        </Text>
      </View>
      <Avatar uid={champion.uid} name={champion.displayName} size={36} />
      <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
        {champion.displayName}
      </Text>
      <Text variant="caption" color={palette.onSurfaceVariant}>
        {champion.score.toLocaleString()}
      </Text>
    </Row>
  );
}

/**
 * Trending game card: key art, title, live count. Games that are not built yet
 * are shown but not pressable, and say so — a card that looks tappable and
 * does nothing is worse than one that is honestly greyed.
 */
function TrendingCard({ game, onPress }: { game: TrendingGame; onPress?: () => void }) {
  const { palette } = useTheme();

  const body = (
    <>
      <GameArt id={game.id} />
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="heading" numberOfLines={1} style={{ flex: 1 }}>
            {game.name}
          </Text>
          <Row gap={spacing.sm}>
            {game.isPremium && <Chip color={palette.tertiary}>Premium</Chip>}
            {!game.enabled && <Chip>Soon</Chip>}
          </Row>
        </Row>

        <Text variant="caption" color={palette.onSurfaceVariant} numberOfLines={2}>
          {game.tagline}
        </Text>

        <Row gap={spacing.xs}>
          <Ionicons name="people" size={14} color={palette.secondary} />
          <Text variant="caption" color={palette.secondary}>
            {game.playersNow.toLocaleString()} playing now
          </Text>
        </Row>
      </View>
    </>
  );

  const shell = {
    borderRadius: radius.lg,
    borderWidth: stroke.base,
    borderColor: palette.ink,
    borderBottomWidth: stroke.depth,
    backgroundColor: palette.surface,
    // Clips the key art to the rounded top corners.
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
