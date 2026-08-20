import { Pressable, ScrollView } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, stroke } from '@/theme/tokens';
import { EDITABLE_SLOTS, SLOT_LABELS, type AvatarSlot } from './types';

/** Horizontal scroller of slot filters — shared by the shop and customizer screens. */
export function SlotTabRow({ value, onChange }: { value: AvatarSlot; onChange: (slot: AvatarSlot) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm }}>
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
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
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
