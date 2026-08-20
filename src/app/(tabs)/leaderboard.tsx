import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  Avatar,
  Button,
  Card,
  Chip,
  Label,
  ListRow,
  Row,
  Screen,
  ScreenHeader,
  SegmentedTabs,
  Text,
} from '@/components/ui';
import { TABS } from '@/constants/app';
import { leaderboard, type LeaderboardEntry, type LeaderboardPeriod } from '@/features/leaderboard/dummy';
import { useProfile } from '@/stores/profile';
import { useSession } from '@/stores/session';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Leaderboards (spec §8) — Weekly and Monthly boards, a podium top three and
 * a sticky "your rank" bar. Ranked by a synthetic arena score derived from
 * the profile store (`stats.gamesWon`, `gold`), same placeholder convention
 * as `features/home/dummy.ts` — real source is `leaderboards/{period}`
 * (Firestore, scheduled aggregation job, docs/ARCHITECTURE.md §8).
 *
 * Extras beyond the spec, added because the screen was open for it: a period
 * reset countdown, and gold prizes on the top three tiers.
 */

const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

/** Flavor only — no backend pays these out yet. Scaled against AWARDS in economy/levels.ts. */
const PRIZES: Record<LeaderboardPeriod, [number, number, number]> = {
  weekly: [250, 150, 80],
  monthly: [800, 500, 250],
};

function resetsIn(period: LeaderboardPeriod): string {
  const now = new Date();
  const target =
    period === 'weekly'
      ? (() => {
          const d = new Date(now);
          const daysUntilMonday = (8 - d.getUTCDay()) % 7 || 7;
          d.setUTCDate(d.getUTCDate() + daysUntilMonday);
          d.setUTCHours(0, 0, 0, 0);
          return d;
        })()
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const ms = target.getTime() - now.getTime();
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `Resets in ${days}d ${hours}h` : `Resets in ${hours}h`;
}

export default function Leaderboard() {
  const { palette } = useTheme();
  const s = useMemo(() => makeStyles(palette), [palette]);
  const router = useRouter();
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');

  const { handle, gold, stats } = useProfile();
  const isGuest = useSession((state) => state.isGuest);

  const entries = useMemo(() => {
    // Synthetic arena score — see file header. Monthly accrues roughly 3x a
    // week's pace, matched loosely against the pool ranges in dummy.ts.
    const base = stats.gamesWon * 60 + gold * 0.4;
    const score = isGuest ? -1 : Math.round(period === 'monthly' ? base * 3.1 : base);
    return leaderboard(period, { uid: handle, displayName: 'You', score });
  }, [period, handle, gold, stats.gamesWon, isGuest]);

  const you = entries.find((e) => e.isYou);
  const podium = entries.slice(0, 3);
  // A guest's sentinel score (see the memo above) sorts last, so this only
  // ever drops the trailing placeholder row rather than reshuffling ranks.
  const restVisible = entries.slice(3).filter((e) => !(isGuest && e.isYou));

  return (
    <Screen scroll={false}>
      <ScreenHeader title={TABS.leaderboard} />

      <SegmentedTabs options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      <Label center color={palette.onSurfaceVariant}>
        {resetsIn(period)}
      </Label>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}>
        <Podium entries={podium} prizes={PRIZES[period]} palette={palette} s={s} />

        <View style={{ gap: spacing.sm }}>
          {restVisible.map((entry) => (
            <ListRow
              key={entry.uid}
              highlighted={entry.isYou}
              leading={
                <Row gap={spacing.sm}>
                  <Text variant="bodyStrong" style={s.rankNumber}>
                    {entry.rank}
                  </Text>
                  <Avatar uid={entry.uid} name={entry.displayName} size={38} />
                </Row>
              }
              title={entry.isYou ? 'You' : entry.displayName}
              trailing={
                <Text variant="bodyStrong" color={palette.tertiary}>
                  {entry.score.toLocaleString()}
                </Text>
              }
            />
          ))}
        </View>
      </ScrollView>

      {isGuest ? (
        <Card accent={palette.primary} style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Guests aren&apos;t ranked</Text>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            Sign up to post a score and climb the {period} board.
          </Text>
          <Button label="Sign Up" onPress={() => router.push('/(auth)/register')} />
        </Card>
      ) : (
        you && (
          <Card accent={palette.tertiary} style={{ gap: 2 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={spacing.md}>
                <Text variant="heading" color={palette.tertiary}>
                  #{you.rank}
                </Text>
                <View>
                  <Text variant="bodyStrong">Your rank</Text>
                  <Text variant="caption" color={palette.onSurfaceVariant}>
                    {period === 'weekly' ? 'This week' : 'This month'}
                  </Text>
                </View>
              </Row>
              <Text variant="heading">{you.score.toLocaleString()}</Text>
            </Row>
          </Card>
        )
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ Podium */

const MEDALS = (p: Palette) => [p.medalGold, p.medalSilver, p.medalBronze];
/**
 * Both arrays are indexed by rank (0 = 1st), not by render position — 1st
 * place always gets the tallest block and biggest avatar. `ORDER` only
 * controls left-to-right placement: 2nd · 1st · 3rd, tallest centered.
 */
const ORDER = [1, 0, 2];
const HEIGHTS = [116, 86, 68];

function Podium({
  entries,
  prizes,
  palette,
  s,
}: {
  entries: LeaderboardEntry[];
  prizes: [number, number, number];
  palette: Palette;
  s: Styles;
}) {
  const medals = MEDALS(palette);

  return (
    <Row gap={spacing.sm} style={{ alignItems: 'flex-end' }}>
      {ORDER.map((i) => {
        const entry = entries[i];
        if (!entry) return <View key={i} style={{ flex: 1 }} />;
        return (
          <View key={entry.uid} style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
            <Avatar uid={entry.uid} name={entry.displayName} size={i === 0 ? 56 : 46} ring={medals[i]} />
            <Text variant="bodyStrong" numberOfLines={1} style={{ maxWidth: '100%' }}>
              {entry.isYou ? 'You' : entry.displayName}
            </Text>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              {entry.score.toLocaleString()}
            </Text>
            <Chip color={palette.tertiary}>+{prizes[i]}g</Chip>
            <View style={[s.podiumStep, { height: HEIGHTS[i], backgroundColor: medals[i] }]}>
              <Text variant="title" color={palette.ink}>
                {i + 1}
              </Text>
            </View>
          </View>
        );
      })}
    </Row>
  );
}

/* --------------------------------------------------------------- styles */

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    rankNumber: { width: 22, textAlign: 'center', color: p.onSurfaceVariant },
    podiumStep: {
      width: '100%',
      borderRadius: radius.md,
      borderWidth: stroke.base,
      borderColor: p.ink,
      borderBottomWidth: stroke.depth,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: spacing.xs,
    },
  });
