import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
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
import { AvatarRenderer } from '@/features/avatar/AvatarRenderer';
import { leaderboard, type LeaderboardEntry, type LeaderboardPeriod } from '@/features/leaderboard/dummy';
import { useI18n } from '@/i18n/I18nProvider';
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

/** Flavor only — no backend pays these out yet. Scaled against AWARDS in economy/levels.ts. */
const PRIZES: Record<LeaderboardPeriod, [number, number, number]> = {
  weekly: [250, 150, 80],
  monthly: [800, 500, 250],
};

function resetsIn(period: LeaderboardPeriod, t: ReturnType<typeof useI18n>['t']): string {
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
  return days > 0 ? t((s) => s.leaderboard.resetsInDays)(days, hours) : t((s) => s.leaderboard.resetsInHours)(hours);
}

export default function Leaderboard() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const s = useMemo(() => makeStyles(palette), [palette]);
  const router = useRouter();
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const periodOptions = [
    { value: 'weekly' as const, label: t((s) => s.leaderboard.weekly) },
    { value: 'monthly' as const, label: t((s) => s.leaderboard.monthly) },
  ];

  const { handle, gold, stats, avatar } = useProfile();
  const isGuest = useSession((state) => state.isGuest);

  const entries = useMemo(() => {
    // Synthetic arena score — see file header. Monthly accrues roughly 3x a
    // week's pace, matched loosely against the pool ranges in dummy.ts.
    const base = stats.gamesWon * 60 + gold * 0.4;
    const score = isGuest ? -1 : Math.round(period === 'monthly' ? base * 3.1 : base);
    return leaderboard(period, { uid: handle, displayName: 'You', score, avatar });
  }, [period, handle, gold, stats.gamesWon, isGuest, avatar]);

  const you = entries.find((e) => e.isYou);
  const podium = entries.slice(0, 3);
  // A guest's sentinel score (see the memo above) sorts last, so this only
  // ever drops the trailing placeholder row rather than reshuffling ranks.
  const restVisible = entries.slice(3).filter((e) => !(isGuest && e.isYou));

  return (
    <Screen scroll={false}>
      <ScreenHeader title={t((s) => s.tabs.leaderboard)} />

      <SegmentedTabs options={periodOptions} value={period} onChange={setPeriod} />
      <Label center color={palette.onSurfaceVariant}>
        {resetsIn(period, t)}
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
                  {/* Bust crop, same config as the podium — one avatar, two
                      framings, so a hat cannot look right in one and wrong in
                      the other. Background off: the row already has its own
                      surface, and a colored disc behind the figure read as a
                      second, mismatched background. */}
                  <AvatarRenderer config={entry.avatar} size={38} background={false} border={false} />
                </Row>
              }
              title={entry.isYou ? t((s) => s.leaderboard.you) : entry.displayName}
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
          <Text variant="bodyStrong">{t((s) => s.leaderboard.guestsNotRanked)}</Text>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {t((s) => s.leaderboard.guestsNotRankedBody)(
              (period === 'weekly' ? t((s) => s.leaderboard.weekly) : t((s) => s.leaderboard.monthly)),
            )}
          </Text>
          <Button label={t((s) => s.leaderboard.signUp)} onPress={() => router.push('/(auth)/register')} />
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
                  <Text variant="bodyStrong">{t((s) => s.leaderboard.yourRank)}</Text>
                  <Text variant="caption" color={palette.onSurfaceVariant}>
                    {period === 'weekly' ? t((s) => s.leaderboard.thisWeek) : t((s) => s.leaderboard.thisMonth)}
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
 * All three arrays are indexed by rank (0 = 1st), not by render position — 1st
 * place always gets the tallest block and biggest figure. `ORDER` only
 * controls left-to-right placement: 2nd · 1st · 3rd, tallest centered.
 *
 * The blocks are shorter than they were because the figures now stand on them:
 * a full body plus the old 116pt step pushed the rest of the board off screen,
 * and a podium nobody can see past is worse than a short one.
 */
const ORDER = [1, 0, 2];
const HEIGHTS = [64, 48, 38];
const FIGURES = [80, 64, 64];

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
  const { t } = useI18n();
  const medals = MEDALS(palette);

  return (
    <Row gap={spacing.sm} style={{ alignItems: 'flex-end' }}>
      {ORDER.map((i) => {
        const entry = entries[i];
        if (!entry) return <View key={i} style={{ flex: 1 }} />;
        return (
          <View key={entry.uid} style={{ flex: 1, alignItems: 'center' }}>
            {/*
              Full body rather than a bust: the top three are the one place on
              the board where the shop's clothes, bottoms and shoes are worth
              looking at, and a podium is a place people stand.
            */}
            {/* No ring — the medal-coloured step underneath is what marks the
                tier now, so the figure itself sits framed by nothing. */}
            <AvatarRenderer
              config={entry.avatar}
              mode="full"
              size={FIGURES[i]}
              background={false}
              border={false}
            />

            {/* No gap — the figure stands on the block rather than above it. */}
            <View style={[s.podiumStep, { height: HEIGHTS[i], backgroundColor: medals[i] }]}>
              <Text variant="title" color={palette.ink}>
                {i + 1}
              </Text>
            </View>

            <View style={{ alignItems: 'center', gap: 2, paddingTop: spacing.xs }}>
              <Text variant="bodyStrong" numberOfLines={1} style={{ maxWidth: '100%' }}>
                {entry.isYou ? t((s) => s.leaderboard.you) : entry.displayName}
              </Text>
              <Text variant="caption" color={palette.onSurfaceVariant}>
                {entry.score.toLocaleString()}
              </Text>
              <Chip color={palette.tertiary}>+{prizes[i]}g</Chip>
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
