import { EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { TABS } from '@/constants/app';

/**
 * Home Dashboard (spec §7) — built in the next batch.
 *
 * Two rival designs exist: the original "Home Dashboard" carries the avatar,
 * level, XP bar, gold and leaderboard preview spec §7 requires, while
 * "Home Dashboard - Spec Aligned" has the correct tab bar but replaces the
 * body with generic category tiles. The build follows the original's content
 * inside this shell's tab bar.
 */
export default function Home() {
  return (
    <Screen>
      <ScreenHeader title={TABS.home} />
      <EmptyState
        icon="home-outline"
        title="Dashboard next"
        body="Avatar, level, XP, gold, Quick Play and the daily champions preview land in the next batch."
      />
    </Screen>
  );
}
