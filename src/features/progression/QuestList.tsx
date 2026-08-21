import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button, Card, Chip, Label, ProgressBar, Row, Text } from '@/components/ui';
import { useProgression } from '@/stores/progression';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatResetIn, msUntilPeriodEnd, type QuestPeriod } from './periods';
import { isClaimable, isQuestComplete, questFraction, stateFor, type QuestDef } from './quests';

/**
 * One period's quests, with a claim button on anything finished.
 *
 * Claiming is explicit rather than automatic. Gold that lands silently while
 * the player is elsewhere is gold they never notice earning, and the whole
 * point of a quest is that finishing it feels like something.
 */
export function QuestSection({
  period,
  quests,
  title,
}: {
  period: QuestPeriod;
  quests: QuestDef[];
  title: string;
}) {
  const { palette } = useTheme();
  const resetIn = formatResetIn(msUntilPeriodEnd(period));

  return (
    <View style={{ gap: spacing.sm }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={spacing.sm}>
          <Ionicons
            name={period === 'daily' ? 'today' : 'calendar'}
            size={16}
            color={period === 'daily' ? palette.secondary : palette.primary}
          />
          <Label color={period === 'daily' ? palette.secondary : palette.primary}>{title}</Label>
        </Row>
        <Text variant="caption" color={palette.onSurfaceVariant}>
          resets in {resetIn}
        </Text>
      </Row>

      {quests.map((quest) => (
        <QuestRow key={quest.id} quest={quest} />
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
    <Card accent={accent} style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
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
