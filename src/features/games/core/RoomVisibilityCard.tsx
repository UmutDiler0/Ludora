import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { Card, Label, Row, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import type { RoomVisibility } from '@/services/rooms/types';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Public/Private picker, shared by every game's setup screen. A true binary
 * choice, so it keeps the setup screens' existing card-row idiom (see each
 * setup screen's preset picker) rather than `Select` — that dropdown shape is
 * for picking one of several options from a list, not flipping a switch.
 */
export function RoomVisibilityCard({
  value,
  onChange,
}: {
  value: RoomVisibility;
  onChange: (value: RoomVisibility) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const copy = t((s) => s.gameCore.visibility);

  const options: { value: RoomVisibility; label: string; body: string; icon: 'earth' | 'lock-closed' }[] = [
    { value: 'public', label: copy.public, body: copy.publicBody, icon: 'earth' },
    { value: 'private', label: copy.private, body: copy.privateBody, icon: 'lock-closed' },
  ];
  const active = options.find((o) => o.value === value) ?? options[0];

  return (
    <Card style={{ gap: spacing.md }}>
      <Label>{copy.title}</Label>
      <Row gap={spacing.sm}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                optionStyle(palette),
                selected && { borderColor: palette.primary, backgroundColor: palette.primaryContainer },
                pressed && { opacity: 0.85 },
              ]}>
              <Row gap={spacing.xs} style={{ justifyContent: 'center' }}>
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={selected ? palette.onPrimary : palette.onSurface}
                />
                <Text variant="bodyStrong" color={selected ? palette.onPrimary : palette.onSurface}>
                  {option.label}
                </Text>
              </Row>
            </Pressable>
          );
        })}
      </Row>
      <Text variant="caption" color={palette.onSurfaceVariant}>
        {active.body}
      </Text>
    </Card>
  );
}

const optionStyle = (p: Palette) => ({
  flex: 1,
  paddingVertical: spacing.md,
  borderRadius: radius.md,
  borderWidth: stroke.thin,
  borderColor: p.ink,
  backgroundColor: p.surface,
  alignItems: 'center' as const,
});
