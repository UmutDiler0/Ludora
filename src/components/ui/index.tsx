import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
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
  numberOfLines,
  style,
  children,
}: {
  variant?: TextVariant;
  color?: string;
  center?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[type[variant], { color }, center && { textAlign: 'center' }, style]}>
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

/* --------------------------------------------------------------- Input */

/**
 * Text field for the auth screens. The error slot is always rendered as a
 * fixed-height line so validation messages do not shift the form under the
 * user's thumb mid-tap.
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoComplete,
  keyboardType,
  error,
  autoFocus,
  onSubmitEditing,
  returnKeyType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  keyboardType?: TextInputProps['keyboardType'];
  error?: string | null;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: spacing.sm }}>
      <Label color={error ? palette.error : palette.onSurfaceVariant}>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.outline}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          s.input,
          focused && { borderColor: palette.primaryContainer },
          !!error && { borderColor: palette.error },
        ]}
      />
      <Text variant="caption" color={palette.error} style={{ minHeight: 19 }}>
        {error ?? ' '}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------- SegmentedTabs */

/**
 * The pill selector used by Global Leaderboards (Daily · Weekly · All-Time)
 * and the Avatar Shop category strip.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={s.segment}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[s.segmentItem, active && { backgroundColor: palette.primaryContainer }]}>
            <Text
              variant="label"
              color={active ? palette.onPrimary : palette.onSurfaceVariant}
              style={{ textTransform: 'uppercase' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------- ListRow */

/** Leaderboard entries, room listings, inventory rows — one shape, reused. */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  accent,
  highlighted,
}: {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  accent?: string;
  /** Marks the viewer's own row — "YOUR RANK" in the leaderboard design. */
  highlighted?: boolean;
}) {
  const body = (
    <>
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text variant="caption" color={palette.onSurfaceVariant} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
    </>
  );

  const style = [
    s.listRow,
    highlighted && { borderColor: palette.primaryContainer, backgroundColor: palette.surfaceHigh },
    accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : null,
  ];

  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [...style, pressed && { opacity: 0.75 }]}>
      {body}
    </Pressable>
  );
}

/* -------------------------------------------------------------- GoldPill */

/** Gold balance chip. Amber is the economy colour throughout (§20). */
export function GoldPill({ amount, onPress }: { amount: number; onPress?: () => void }) {
  const content = (
    <Row gap={spacing.sm} style={s.goldPill}>
      <Ionicons name="diamond" size={13} color={palette.tertiary} />
      <Text variant="label" color={palette.tertiary}>
        {amount.toLocaleString()}
      </Text>
    </Row>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

/* ---------------------------------------------------------- ScreenHeader */

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
      {!!onBack && <IconButton name="chevron-back" onPress={onBack} label="Go back" />}
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text variant="title">{title}</Text>
        {!!subtitle && (
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
    </Row>
  );
}

/* ------------------------------------------------------------ IconButton */

export function IconButton({
  name,
  onPress,
  label,
  color = palette.onSurface,
  size = 20,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  /** Accessibility label — icons carry no text, so this is not optional. */
  label: string;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [s.iconButton, pressed && { opacity: 0.6 }]}>
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Badge */

/** Small count badge — unread notifications, player counts. */
export function Badge({ children, color = palette.primaryContainer }: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <View style={[s.badge, { backgroundColor: color }]}>
      <Text variant="label" color={palette.background} style={{ fontSize: 10 }}>
        {children}
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------- EmptyState */

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  body,
  action,
}: {
  icon?: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl }}>
      <Ionicons name={icon} size={40} color={palette.outline} />
      <Text variant="heading" center>
        {title}
      </Text>
      <Text variant="caption" color={palette.onSurfaceVariant} center>
        {body}
      </Text>
      {action}
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: palette.surfaceHigh }} />;
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
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceHigh,
    backgroundColor: palette.surfaceLow,
    paddingHorizontal: spacing.lg,
    color: palette.onSurface,
    ...type.body,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceLow,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceHigh,
    backgroundColor: palette.surfaceContainer,
  },
  goldPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.tertiaryContainer,
    backgroundColor: palette.surfaceLow,
    alignSelf: 'flex-start',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceContainer,
    borderWidth: 1,
    borderColor: palette.surfaceHigh,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
