import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, radius, spacing, type } from '@/theme/tokens';

/**
 * The shared primitive kit (docs/ARCHITECTURE.md decision D20).
 *
 * Extracted from the 24 designed screens: card, list row, chip, primary CTA,
 * stat tile, count badge. The eleven routes that have no design are built from
 * these, so restyling them later is a props change rather than a rewrite.
 */

/* ---------------------------------------------------------------- Text */

type TextVariant = keyof typeof type;

export function Text({
  variant = 'body',
  color = palette.onSurface,
  center,
  style,
  children,
}: {
  variant?: TextVariant;
  color?: string;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  return (
    <RNText style={[type[variant], { color }, center && { textAlign: 'center' }, style]}>
      {children}
    </RNText>
  );
}

/** Uppercase eyebrow label — "YOUR ROLE", "ROOM CODE", "CURRENT PHASE". */
export function Label({ children, color = palette.onSurfaceVariant, center }: {
  children: ReactNode;
  color?: string;
  center?: boolean;
}) {
  return (
    <Text variant="label" color={color} center={center} style={{ textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

/* -------------------------------------------------------------- Screen */

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = (
    <View style={[{ padding: spacing.xl, gap: spacing.lg, flexGrow: 1 }, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

/* ---------------------------------------------------------------- Card */

export function Card({
  children,
  accent,
  padded = true,
  style,
}: {
  children: ReactNode;
  /** Left rail colour — used to mark state, never for decoration. */
  accent?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        s.card,
        padded && { padding: spacing.lg },
        accent ? { borderColor: accent, borderWidth: 1 } : null,
        style,
      ]}>
      {children}
    </View>
  );
}

/* ---------------------------------------------------------------- Chip */

export function Chip({
  children,
  color = palette.onSurfaceVariant,
  filled,
}: {
  children: ReactNode;
  color?: string;
  filled?: boolean;
}) {
  return (
    <View
      style={[
        s.chip,
        { borderColor: color },
        filled && { backgroundColor: color },
      ]}>
      <Text
        variant="label"
        color={filled ? palette.background : color}
        style={{ textTransform: 'uppercase' }}>
        {children}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------- Button */

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const tones = {
    primary: { bg: palette.primaryContainer, fg: palette.onPrimary, border: 'transparent' },
    secondary: { bg: palette.secondaryContainer, fg: palette.background, border: 'transparent' },
    ghost: { bg: 'transparent', fg: palette.onSurface, border: palette.outlineVariant },
    danger: { bg: 'transparent', fg: palette.error, border: palette.error },
  }[tone];

  const isOff = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isOff }}
      disabled={isOff}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: tones.bg, borderColor: tones.border },
        pressed && !isOff && { opacity: 0.82, transform: [{ scale: 0.99 }] },
        isOff && { opacity: 0.4 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={tones.fg} />
      ) : (
        <Text variant="label" color={tones.fg} style={{ textTransform: 'uppercase', fontSize: 13 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------- Avatar */

/**
 * Placeholder avatar (decision D19). The shipped art is unusable — it contains
 * baked-in fake UI — so avatars are deterministic from the uid until real
 * assets land. Same uid always produces the same colour.
 */
export function Avatar({
  uid,
  name,
  size = 44,
  dimmed,
  ring,
}: {
  uid: string;
  name: string;
  size?: number;
  dimmed?: boolean;
  ring?: string;
}) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  const hues = [
    palette.primaryContainer,
    palette.secondaryContainer,
    palette.tertiaryContainer,
    palette.errorContainer,
    palette.surfaceHighest,
  ];
  const bg = hues[hash % hues.length];
  const initials = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: dimmed ? 0.35 : 1,
        borderWidth: ring ? 2 : 0,
        borderColor: ring ?? 'transparent',
      }}>
      <Text variant="label" color={palette.onSurface} style={{ fontSize: size * 0.32 }}>
        {initials}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------- ProgressBar */

export function ProgressBar({
  value,
  color = palette.primaryContainer,
  height = 8,
}: {
  /** 0–1. */
  value: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: palette.surfaceHigh, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

/* ------------------------------------------------------------ StatTile */

export function StatTile({ value, caption, color = palette.onSurface }: {
  value: string;
  caption: string;
  color?: string;
}) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
      <Text variant="heading" color={color}>{value}</Text>
      <Label>{caption}</Label>
    </Card>
  );
}

export function Row({ children, gap = spacing.md, style }: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  card: {
    backgroundColor: palette.surfaceContainer,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.surfaceHigh,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
});
