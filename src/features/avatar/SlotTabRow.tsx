import { Pressable, ScrollView } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, stroke } from '@/theme/tokens';
import { EDITABLE_SLOTS, SLOT_LABELS, type AvatarSlot } from './types';

/**
 * Horizontal scroller of slot filters — shared by the shop and customizer.
 *
 * `flexGrow: 0` and `alignItems: 'center'` are both load-bearing. A horizontal
 * ScrollView in a column layout will otherwise take the leftover vertical
 * space and stretch every child to fill it, which is what made these chips
 * render several times their natural height. Padding was never the problem, so
 * shrinking padding would not have fixed it.
 */
export function SlotTabRow({ value, onChange }: { value: AvatarSlot; onChange: (slot: AvatarSlot) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: spacing.sm, alignItems: 'center', paddingRight: spacing.xl }}>
      {EDITABLE_SLOTS.map((slot) => (
        <SlotTab key={slot} label={SLOT_LABELS[slot]} active={slot === value} onPress={() => onChange(slot)} />
      ))}
    </ScrollView>
  );
}

function SlotTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      // Same geometry as the kit's Chip, so a filter here reads as the same
      // kind of object as a chip anywhere else in the app.
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
        borderRadius: radius.pill,
        borderWidth: stroke.thin,
        borderColor: palette.ink,
        backgroundColor: active ? palette.primary : palette.surface,
      }}>
      <Text variant="label" color={active ? palette.onPrimary : palette.onSurfaceVariant} style={{ textTransform: 'uppercase' }}>
        {label}
      </Text>
    </Pressable>
  );
}
