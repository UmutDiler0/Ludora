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

import { palette, radius, spacing, stroke, type } from '@/theme/tokens';

/**
 * The shared primitive kit (docs/ARCHITECTURE.md decision D20), cartoon theme.
 *
 * Three devices carry the look, and they live here rather than in any screen:
 *   1. every surface gets a thick `ink` outline
 *   2. an over-thick bottom border gives objects physical depth
 *   3. pressing a control sinks it into that depth instead of just fading
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
export function Label({
  children,
  color = palette.onSurfaceVariant,
  center,
}: {
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
  /** Colours the card's depth edge — used to mark state, never decoration. */
  accent?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        s.card,
        padded && { padding: spacing.lg },
        accent ? { borderBottomColor: accent, borderBottomWidth: stroke.depth } : null,
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
    <View style={[s.chip, filled ? { backgroundColor: color } : { backgroundColor: palette.surface }]}>
      <Text
        variant="label"
        color={filled ? palette.surface : color}
        style={{ textTransform: 'uppercase' }}>
        {children}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------- Button */

const TONES = {
  primary: { bg: palette.primary, fg: '#FFFFFF' },
  secondary: { bg: palette.secondaryContainer, fg: palette.ink },
  ghost: { bg: palette.surface, fg: palette.ink },
  danger: { bg: palette.error, fg: '#FFFFFF' },
} as const;

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
  tone?: keyof typeof TONES;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = TONES[tone];
  const isOff = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isOff }}
      disabled={isOff}
      onPress={onPress}
      style={({ pressed }) => {
        const sunk = pressed && !isOff;
        return [
          s.button,
          { backgroundColor: t.bg },
          // Sink into the depth edge rather than fading: the face drops by
          // exactly the amount the bottom border loses, so the outer box
          // never changes height and nothing below it shifts.
          sunk && {
            borderBottomWidth: stroke.depthPressed,
            transform: [{ translateY: stroke.depth - stroke.depthPressed }],
          },
          isOff && { opacity: 0.45 },
          style,
        ];
      }}>
      {loading ? (
        <ActivityIndicator color={t.fg} />
      ) : (
        <Text variant="label" color={t.fg} style={{ textTransform: 'uppercase', fontSize: 14 }}>
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
  const hues = ['#7C4DFF', '#16C4E8', '#FFC93C', '#FF5B4A', '#2FCB74', '#FF9F1C'];
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
        opacity: dimmed ? 0.4 : 1,
        borderWidth: stroke.base,
        borderColor: ring ?? palette.ink,
      }}>
      <Text variant="label" color="#FFFFFF" style={{ fontSize: size * 0.34 }}>
        {initials}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------- ProgressBar */

export function ProgressBar({
  value,
  color = palette.primary,
  height = 16,
}: {
  /** 0–1. */
  value: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={{
        height,
        borderRadius: radius.pill,
        backgroundColor: palette.surfaceHigh,
        borderWidth: stroke.thin,
        borderColor: palette.ink,
        overflow: 'hidden',
      }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

/* ------------------------------------------------------------ StatTile */

export function StatTile({
  value,
  caption,
  color = palette.onSurface,
}: {
  value: string;
  caption: string;
  color?: string;
}) {
  return (
    <Card accent={color} style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
      <Text variant="heading" color={color}>
        {value}
      </Text>
      <Label>{caption}</Label>
    </Card>
  );
}

export function Row({
  children,
  gap = spacing.md,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: stroke.base,
    borderColor: palette.ink,
    borderBottomWidth: stroke.depth,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: stroke.thin,
    borderColor: palette.ink,
    alignSelf: 'flex-start',
  },
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: stroke.base,
    borderColor: palette.ink,
    borderBottomWidth: stroke.depth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
});
