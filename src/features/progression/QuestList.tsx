import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { Button, Card, Chip, ProgressBar, Row, SegmentedTabs, Text } from '@/components/ui';
import { useActiveQuests, useProgression } from '@/stores/progression';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatResetIn, msUntilPeriodEnd, type QuestPeriod } from './periods';
import {
  isClaimable,
  isQuestComplete,
  questFraction,
  sortQuestsForDisplay,
  stateFor,
  type QuestDef,
  type QuestProgress,
} from './quests';

/**
 * The quest board: a daily/weekly switch over one ordered list.
 *
 * Tabs rather than two stacked sections. Dailies and weeklies are answers to
 * different questions — "what can I finish tonight" and "what am I working
 * towards" — and stacking them meant five cards of scrolling before anything
 * else on the dashboard. Only one of the two is ever the current question.
 *
 * The tab you are not looking at still shows how many of its quests are ready
 * to collect, because otherwise switching tabs would hide gold.
 *
 * Ordering is `sortQuestsForDisplay` (quests.ts) and belongs there rather than
 * here: closest-to-done at the top, collected ones sunk to the bottom. The list
 * animates between orders instead of jumping, so a quest that just finished is
 * seen *moving* to the top of the board rather than silently appearing there.
 *
 * Claiming is explicit. Gold that lands silently while the player is elsewhere
 * is gold they never notice earning, and the whole point of a quest is that
 * finishing it feels like something.
 */

const claimableIn = (quests: QuestDef[], progress: QuestProgress): number =>
  quests.filter((quest) => isClaimable(quest, stateFor(progress, quest.id))).length;

export function QuestPanel() {
  const { palette } = useTheme();
  const [period, setPeriod] = useState<QuestPeriod>('daily');

  const quests = useActiveQuests();
  const progress = useProgression((s) => s.questProgress);

  // Cheap enough to redo per render (five quests, total), and a memo keyed on
  // the progress object would be a lie: the sort depends on every count in it.
  const ordered = sortQuestsForDisplay(quests[period], progress);

  const options = [
    { value: 'daily' as const, label: 'Daily', badge: claimableIn(quests.daily, progress) },
    { value: 'weekly' as const, label: 'Weekly', badge: claimableIn(quests.weekly, progress) },
  ];

  return (
    <View style={{ gap: spacing.sm }}>
      <SegmentedTabs options={options} value={period} onChange={setPeriod} />

      <Row style={{ justifyContent: 'flex-end' }}>
        <Text variant="caption" color={palette.onSurfaceVariant}>
          {period === 'daily' ? 'Today' : 'This week'} · resets in{' '}
          {formatResetIn(msUntilPeriodEnd(period))}
        </Text>
      </Row>

      {ordered.map((quest) => (
        // Keyed per period, so switching tabs swaps the list outright instead
        // of morphing a daily card into a weekly one.
        <Animated.View key={`${period}:${quest.id}`} layout={LinearTransition.springify().damping(18)}>
          <QuestRow quest={quest} />
        </Animated.View>
      ))}
    </View>
  );
}

function QuestRow({ quest }: { quest: QuestDef }) {
  const { palette } = useTheme();
  const progress = useProgression((s) => s.questProgress);
  const claimQuest = useProgression((s) => s.claimQuest);

  const state = stateFor(progress, quest.id);
  const done = isQuestComplete(quest, state);
  const claimable = isClaimable(quest, state);
  const accent = state.claimed ? palette.success : done ? palette.tertiary : undefined;

  return (
    <Card
      accent={accent}
      style={{
        gap: spacing.sm,
        paddingVertical: spacing.md,
        // Collected quests are kept legible but visibly spent — they are
        // history, and the rows above them are the ones asking for something.
        opacity: state.claimed ? 0.7 : 1,
      }}>
      <Row gap={spacing.md}>
        <Ionicons
          name={
            state.claimed
              ? 'checkmark-circle'
              : (quest.icon as React.ComponentProps<typeof Ionicons>['name'])
          }
          size={20}
          color={state.claimed ? palette.success : palette.onSurfaceVariant}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {quest.name}
          </Text>
          <Text variant="caption" color={palette.onSurfaceVariant} numberOfLines={1}>
            {quest.description}
          </Text>
        </View>

        <Row gap={spacing.xs}>
          <Ionicons name="diamond" size={12} color={palette.tertiary} />
          <Text variant="label" color={palette.tertiary}>
            {quest.gold}
          </Text>
        </Row>
      </Row>

      {!state.claimed && (
        <>
          <ProgressBar
            value={questFraction(quest, state)}
            height={10}
            color={done ? palette.tertiary : palette.primary}
          />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              {Math.min(state.count, quest.goal)} / {quest.goal}
            </Text>
            {claimable && (
              <Button
                label={`Claim ${quest.gold}g`}
                tone="secondary"
                onPress={() => claimQuest(quest.id)}
                style={{ minHeight: 40, paddingHorizontal: spacing.lg }}
              />
            )}
          </Row>
        </>
      )}

      {state.claimed && <Chip color={palette.success}>Collected</Chip>}
    </Card>
  );
}
