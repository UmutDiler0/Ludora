import { EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { TABS } from '@/constants/app';

/**
 * Leaderboards (spec §8). Now unblocked — the Global Leaderboards design
 * landed in Stitch after docs/ARCHITECTURE.md §1.3 listed this route as
 * undesigned. It ships Daily · Weekly · All-Time, a podium top three and a
 * sticky "your rank" row; All-Time is a third period the spec does not define.
 */
export default function Leaderboard() {
  return (
    <Screen>
      <ScreenHeader title={TABS.leaderboard} />
      <EmptyState
        icon="trophy-outline"
        title="Ranks next"
        body="Daily, weekly and all-time boards with the podium and your own standing."
      />
    </Screen>
  );
}
