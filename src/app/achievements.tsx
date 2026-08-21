import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Card, Chip, Label, ProgressBar, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import { ItemThumb } from '@/features/avatar/AvatarRenderer';
import { getAvatarItem } from '@/features/avatar/catalogue';
import {
  ACHIEVEMENTS,
  completionOf,
  fractionOf,
  isComplete,
  progressOf,
  type AchievementDef,
  type AchievementTier,
  type ProgressSnapshot,
} from '@/features/progression/achievements';
import { useProgression, useProgressSnapshot } from '@/stores/progression';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Every achievement, earned or not (spec §34).
 *
 * Locked ones are shown in full rather than hidden behind question marks: an
 * achievement nobody can read is not a goal, it is a surprise, and surprises do
 * not motivate anyone to play another game.
 *
 * Sorted so what is nearly finished floats up — the list answers "what should I
 * do next" before it answers "what have I done".
 */

const TIER_COLOR = (p: Palette): Record<AchievementTier, string> => ({
  common: p.onSurfaceVariant,
  rare: p.secondary,
  epic: p.primary,
  legendary: p.medalGold,
});

export default function Achievements() {
  const router = useRouter();
  const { palette } = useTheme();

  const unlocked = useProgression((s) => s.unlocked);
  const snapshot = useProgressSnapshot();
  const completion = completionOf(unlocked);

  const ordered = useMemo(() => {
    const have = new Set(unlocked);
    return [...ACHIEVEMENTS].sort((a, b) => {
      const aDone = have.has(a.id);
      const bDone = have.has(b.id);
      // Unearned first, and within those, closest to done first.
      if (aDone !== bDone) return aDone ? 1 : -1;
      if (aDone) return 0;
      return fractionOf(b, snapshot) - fractionOf(a, snapshot);
    });
  }, [unlocked, snapshot]);

  return (
    <Screen>
      <ScreenHeader
        title="Achievements"
        subtitle="Every one of them, earned or not."
        onBack={() => router.back()}
      />

      <Card accent={palette.medalGold} style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label color={palette.medalGold}>Completed</Label>
          <Text variant="bodyStrong">
            {completion.done} / {completion.total}
          </Text>
        </Row>
        <ProgressBar value={completion.done / completion.total} color={palette.medalGold} />
      </Card>

      <View style={{ gap: spacing.sm }}>
        {ordered.map((def) => (
          <AchievementRow
            key={def.id}
            def={def}
            snapshot={snapshot}
            earned={unlocked.includes(def.id)}
          />
        ))}
      </View>
    </Screen>
  );
}

function AchievementRow({
  def,
  snapshot,
  earned,
}: {
  def: AchievementDef;
  snapshot: ProgressSnapshot;
  earned: boolean;
}) {
  const { palette } = useTheme();
  const tint = TIER_COLOR(palette)[def.tier];
  const item = def.itemId ? getAvatarItem(def.itemId) : undefined;
  const complete = earned || isComplete(def, snapshot);

  return (
    <Card accent={complete ? tint : undefined} style={{ gap: spacing.md }}>
      <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: complete ? tint : palette.surfaceHigh,
            borderWidth: stroke.thin,
            borderColor: palette.ink,
          }}>
          <Ionicons
            name={
              complete
                ? (def.icon as React.ComponentProps<typeof Ionicons>['name'])
                : 'lock-closed'
            }
            size={22}
            color={complete ? palette.onPrimary : palette.onSurfaceVariant}
          />
        </View>

        <View style={{ flex: 1, gap: spacing.xs }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {def.name}
            </Text>
            <Chip color={tint} filled={complete}>
              {def.tier}
            </Chip>
          </Row>

          <Text variant="caption" color={palette.onSurfaceVariant}>
            {def.description}
          </Text>

          <Row gap={spacing.md}>
            {def.gold > 0 && (
              <Row gap={spacing.xs}>
                <Ionicons name="diamond" size={12} color={palette.tertiary} />
                <Text variant="label" color={palette.tertiary}>
                  {def.gold}
                </Text>
              </Row>
            )}
            {def.xp > 0 && (
              <Text variant="label" color={palette.primary}>
                +{def.xp} XP
              </Text>
            )}
          </Row>
        </View>
      </Row>

      {!earned && (
        <View style={{ gap: spacing.xs }}>
          <ProgressBar value={fractionOf(def, snapshot)} height={10} color={tint} />
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {progressOf(def, snapshot).toLocaleString()} / {def.target.toLocaleString()}
          </Text>
        </View>
      )}

      {/* The reward item, shown whether or not it has been earned — knowing
          what a crown looks like is most of the reason to chase one. */}
      {item && (
        <Row gap={spacing.md}>
          <ItemThumb item={item} size={44} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {item.name}
            </Text>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              {earned ? 'Unlocked — wear it from the customizer.' : 'Cannot be bought with gold.'}
            </Text>
          </View>
        </Row>
      )}
    </Card>
  );
}
