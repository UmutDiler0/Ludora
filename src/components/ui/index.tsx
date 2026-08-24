import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke, type } from '@/theme/tokens';

/**
 * The shared primitive kit (docs/ARCHITECTURE.md decision D20), cartoon theme.
 *
 * Three devices carry the look, and they live here rather than in any screen:
 *   1. every surface gets a thick `ink` outline
 *   2. an over-thick bottom border gives objects physical depth
 *   3. pressing a control sinks it into that depth instead of just fading
 *
 * Every colour comes from `useTheme()` rather than a module constant, because
 * the palette changes at runtime when the user switches Light / Dark / System.
 * Styles are built by a factory memoised on the palette, so switching mode
 * costs one rebuild per scheme rather than one per render.
 */

/* --------------------------------------------------------------- styles */

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: p.background },
    card: {
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      borderWidth: stroke.base,
      borderColor: p.ink,
      borderBottomWidth: stroke.depth,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: stroke.thin,
      borderColor: p.ink,
      alignSelf: 'flex-start',
    },
    button: {
      minHeight: 56,
      borderRadius: radius.md,
      borderWidth: stroke.base,
      borderColor: p.ink,
      borderBottomWidth: stroke.depth,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    input: {
      minHeight: 52,
      borderRadius: radius.md,
      borderWidth: stroke.thin,
      borderColor: p.ink,
      backgroundColor: p.surface,
      paddingHorizontal: spacing.lg,
      color: p.onSurface,
      ...type.body,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: p.surfaceLow,
      borderRadius: radius.pill,
      borderWidth: stroke.thin,
      borderColor: p.ink,
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
      borderWidth: stroke.base,
      borderColor: p.ink,
      borderBottomWidth: stroke.depth,
      backgroundColor: p.surface,
    },
    goldPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: stroke.thin,
      borderColor: p.ink,
      backgroundColor: p.surface,
      alignSelf: 'flex-start',
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.surface,
      borderWidth: stroke.thin,
      borderColor: p.ink,
    },
    badge: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: radius.pill,
      borderWidth: stroke.thin,
      borderColor: p.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /** Count inside a segmented tab — smaller than Badge, which is too tall here. */
    tabDot: {
      minWidth: 17,
      height: 17,
      paddingHorizontal: 4,
      borderRadius: radius.pill,
      borderWidth: stroke.thin,
      borderColor: p.ink,
      backgroundColor: p.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

type Styles = ReturnType<typeof makeStyles>;

/** Styles for the active palette. Memoised so a mode switch rebuilds once. */
export function useStyles(): { s: Styles; palette: Palette } {
  const { palette } = useTheme();
  const s = useMemo(() => makeStyles(palette), [palette]);
  return { s, palette };
}

/* ---------------------------------------------------------------- Text */

type TextVariant = keyof typeof type;

export function Text({
  variant = 'body',
  color,
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
  const { palette } = useTheme();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        type[variant],
        { color: color ?? palette.onSurface },
        center && { textAlign: 'center' },
        style,
      ]}>
      {children}
    </RNText>
  );
}

/** Uppercase eyebrow label — "YOUR ROLE", "ROOM CODE", "CURRENT PHASE". */
export function Label({
  children,
  color,
  center,
}: {
  children: ReactNode;
  color?: string;
  center?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Text
      variant="label"
      color={color ?? palette.onSurfaceVariant}
      center={center}
      style={{ textTransform: 'uppercase' }}>
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
  const { s } = useStyles();
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
  const { s } = useStyles();
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
  color,
  filled,
}: {
  children: ReactNode;
  color?: string;
  filled?: boolean;
}) {
  const { s, palette } = useStyles();
  const tint = color ?? palette.onSurfaceVariant;
  return (
    <View style={[s.chip, { backgroundColor: filled ? tint : palette.surface }]}>
      <Text
        variant="label"
        color={filled ? palette.surface : tint}
        style={{ textTransform: 'uppercase' }}>
        {children}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------- Button */

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Tones read their foreground from the matching `onX` token, so each mode
 * supplies its own readable pairing rather than assuming white-on-colour.
 */
const toneColors = (p: Palette, tone: ButtonTone) =>
  ({
    primary: { bg: p.primary, fg: p.onPrimary },
    secondary: { bg: p.secondaryContainer, fg: p.onSecondary },
    ghost: { bg: p.surface, fg: p.onSurface },
    danger: { bg: p.error, fg: p.onError },
  })[tone];

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
  loading,
  icon,
  size = 'md',
  style,
}: {
  label: string;
  onPress?: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  loading?: boolean;
  /** Optional leading glyph. Decorative — `label` already carries the meaning. */
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** `lg` is the hero call to action, e.g. Quick Play on the dashboard. */
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const { s, palette } = useStyles();
  const t = toneColors(palette, tone);
  const isOff = disabled || loading;
  const big = size === 'lg';

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
          big && { minHeight: 78, borderRadius: radius.lg },
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
        <Row gap={spacing.sm}>
          {!!icon && <Ionicons name={icon} size={big ? 26 : 18} color={t.fg} />}
          <Text
            variant="label"
            color={t.fg}
            style={{ textTransform: 'uppercase', fontSize: big ? 20 : 14 }}>
            {label}
          </Text>
        </Row>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------- Avatar */

/**
 * Placeholder avatar (decision D19). The shipped art is unusable — it contains
 * baked-in fake UI — so avatars are deterministic from the uid until real
 * assets land. Same uid always produces the same colour within a mode.
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
  const { palette, avatarHues } = useTheme();
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  const bg = avatarHues[hash % avatarHues.length];
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
      <Text variant="label" color={palette.onPrimary} style={{ fontSize: size * 0.34 }}>
        {initials}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------- ProgressBar */

export function ProgressBar({
  value,
  color,
  height = 16,
}: {
  /** 0–1. */
  value: number;
  color?: string;
  height?: number;
}) {
  const { palette } = useTheme();
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
      <View
        style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color ?? palette.primary }}
      />
    </View>
  );
}

/* ---------------------------------------------------------- NumberStepper */

/**
 * `+`/`−` rather than a raw text field — for a value that is small, bounded,
 * and meaningful only within its range, a keyboard would invite an input a
 * clamp then has to silently correct. Shared by every game's setup screen
 * (Vampire Village, Taboo) since a "how many/how long" control is the same
 * shape everywhere it appears.
 */
export function NumberStepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  const nudge = (dir: 1 | -1) => onChange(Math.max(min, Math.min(max, value + dir * step)));

  return (
    <Row gap={spacing.md} style={{ alignItems: 'center' }}>
      <StepButton icon="remove" disabled={value <= min} onPress={() => nudge(-1)} />
      <Text variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>
        {format(value)}
      </Text>
      <StepButton icon="add" disabled={value >= max} onPress={() => nudge(1)} />
    </Row>
  );
}

function StepButton({
  icon,
  disabled,
  onPress,
}: {
  icon: 'add' | 'remove';
  disabled: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? 'Increase' : 'Decrease'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: stroke.base,
        borderColor: palette.ink,
        backgroundColor: disabled ? palette.surfaceLow : palette.surface,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}>
      <Ionicons name={icon} size={18} color={palette.onSurface} />
    </Pressable>
  );
}

/* ------------------------------------------------------------ StatTile */

export function StatTile({
  value,
  caption,
  color,
}: {
  value: string;
  caption: string;
  color?: string;
}) {
  const { palette } = useTheme();
  const tint = color ?? palette.onSurface;
  return (
    <Card accent={tint} style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
      <Text variant="heading" color={tint}>
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
  const { s, palette } = useStyles();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={{ gap: spacing.sm }}>
      <Label color={error ? palette.error : palette.onSurfaceVariant}>{label}</Label>
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.onSurfaceVariant}
          secureTextEntry={isPassword && !revealed}
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
            isPassword && { paddingRight: 44 },
            focused && { borderColor: palette.primary, borderWidth: stroke.base },
            !!error && { borderColor: palette.error, borderWidth: stroke.base },
          ]}
        />
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((v) => !v)}
            hitSlop={10}
            style={{ position: 'absolute', right: spacing.md, top: 0, bottom: 0, justifyContent: 'center' }}>
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={palette.onSurfaceVariant}
            />
          </Pressable>
        )}
      </View>
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
  options: readonly {
    value: T;
    label: string;
    /**
     * Count of things waiting behind this tab. Drawn in the reward colour on
     * both states, so the tab you are *not* looking at can still tell you it
     * has something — which is the only reason a tab needs a number.
     */
    badge?: number;
  }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { s, palette } = useStyles();
  return (
    <View style={s.segment}>
      {options.map((option) => {
        const active = option.value === value;
        const badge = option.badge ?? 0;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={badge > 0 ? `${option.label}, ${badge} ready` : option.label}
            onPress={() => onChange(option.value)}
            style={[s.segmentItem, active && { backgroundColor: palette.primary }]}>
            <Row gap={spacing.xs}>
              <Text
                variant="label"
                color={active ? palette.onPrimary : palette.onSurfaceVariant}
                style={{ textTransform: 'uppercase' }}>
                {option.label}
              </Text>
              {badge > 0 && (
                <View style={s.tabDot}>
                  <Text variant="label" color={palette.ink} style={{ fontSize: 10 }}>
                    {badge}
                  </Text>
                </View>
              )}
            </Row>
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
  const { s, palette } = useStyles();

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
    highlighted && { backgroundColor: palette.surfaceHigh },
    accent ? { borderBottomColor: accent } : null,
  ];

  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        ...style,
        pressed && {
          borderBottomWidth: stroke.depthPressed,
          transform: [{ translateY: stroke.depth - stroke.depthPressed }],
        },
      ]}>
      {body}
    </Pressable>
  );
}

/* -------------------------------------------------------------- GoldPill */

/** Gold balance chip. Amber is the economy colour throughout (§20). */
export function GoldPill({ amount, onPress }: { amount: number; onPress?: () => void }) {
  const { s, palette } = useStyles();
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
  backLabel = 'Go back',
  trailing,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Accessibility label for the back control; localised by callers. */
  backLabel?: string;
  trailing?: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
      {!!onBack && <IconButton name="chevron-back" onPress={onBack} label={backLabel} />}
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
  color,
  size = 20,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  /** Accessibility label — icons carry no text, so this is not optional. */
  label: string;
  color?: string;
  size?: number;
}) {
  const { s, palette } = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [s.iconButton, pressed && { opacity: 0.6 }]}>
      <Ionicons name={name} size={size} color={color ?? palette.onSurface} />
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Badge */

/** Small count badge — unread notifications, player counts. */
export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  const { s, palette } = useStyles();
  return (
    <View style={[s.badge, { backgroundColor: color ?? palette.primary }]}>
      <Text variant="label" color={palette.onPrimary} style={{ fontSize: 10 }}>
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
  const { palette } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl }}>
      <Ionicons name={icon} size={40} color={palette.onSurfaceVariant} />
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
  const { palette } = useTheme();
  return <View style={{ height: stroke.thin, backgroundColor: palette.outlineVariant }} />;
}

/* --------------------------------------------------------------- Dialog */

/**
 * Modal shell that pops onto the screen.
 *
 * The card springs in from 85% scale while the backdrop fades, which is the
 * cartoon kit's own idiom applied to a modal — objects here have physical
 * depth and arrive by moving, not by appearing. The pop is what tells the user
 * an interruption happened; a dialog that cross-fades in is easy to miss and
 * easy to dismiss by reflex, which is exactly wrong for a confirmation.
 *
 * `animationType="none"` on the RN Modal hands the entrance to Reanimated so
 * the two animations cannot fight; the backdrop is ours, and the platform's
 * own transition would otherwise run underneath it.
 *
 * Android's hardware back and a backdrop tap both route to `onDismiss`, so
 * cancelling never requires hitting a specific control.
 */
export function Dialog({
  visible,
  onDismiss,
  children,
  /** Accessible name for the dialog as a whole. */
  label,
  /**
   * Changing this re-mounts the card, so a dialog that advances through steps
   * pops again on each one instead of silently swapping its contents. Without
   * it, a confirmation reached from inside another dialog arrives with no
   * transition at all — the one moment it most needs to announce itself.
   */
  contentKey,
  size = 'auto',
}: {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  label: string;
  contentKey?: string | number;
  /**
   * `auto` hugs its content — the right shape for a question.
   *
   * `large` fills the screen instead, and drops the card's own padding so the
   * content can run edge to edge. It is for a dialog that is really a surface:
   * a chat room needs its scrollback to reach the frame, and a list that grows
   * as you use it must not make the dialog resize under your hands.
   */
  size?: 'auto' | 'large';
}) {
  const { s, palette } = useStyles();
  const pop = useSharedValue(0);

  // Driven by a shared value rather than an `entering=` layout animation:
  // layout animations do not reliably fire inside an RN Modal on Android,
  // because the Modal mounts its children into a separate root. An explicit
  // spring on a mounted view has no such dependency.
  useEffect(() => {
    if (!visible) {
      pop.value = 0;
      return;
    }
    pop.value = 0;
    pop.value = withSpring(1, { damping: 14, stiffness: 190, mass: 0.6 });
  }, [visible, contentKey, pop]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.6),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 2),
    // Starts at 0.85 and overshoots slightly past 1 — the card lands with a
    // bounce, matching how every other control in the kit behaves.
    transform: [{ scale: 0.85 + 0.15 * pop.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onDismiss}
          style={[StyleSheet.absoluteFill, { backgroundColor: '#00000088' }]}
        />
      </Animated.View>

      <View
        style={[dialogLayout.centre, size === 'large' && dialogLayout.centreLarge]}
        pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[
            s.card,
            dialogLayout.card,
            size === 'large' && dialogLayout.cardLarge,
            { backgroundColor: palette.surface },
            cardStyle,
          ]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const dialogLayout = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  centreLarge: {
    // Tighter than `centre`, so the sheet reads as taking over the screen
    // rather than floating in the middle of it.
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },
  cardLarge: {
    flex: 1,
    maxWidth: 520,
    padding: 0,
    gap: 0,
    // The header and composer are pinned to the card's own rounded edges.
    overflow: 'hidden',
  },
});

/**
 * The two-button footer a confirmation always ends with. Cancel is on the
 * left and never destructive-toned, so the reflex tap is the safe one.
 */
export function DialogActions({
  cancelLabel = 'Cancel',
  confirmLabel,
  tone = 'primary',
  onCancel,
  onConfirm,
  confirmDisabled,
}: {
  cancelLabel?: string;
  confirmLabel: string;
  tone?: ButtonTone;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}) {
  return (
    <Row gap={spacing.sm} style={{ alignItems: 'stretch' }}>
      <Button label={cancelLabel} tone="ghost" onPress={onCancel} style={{ flex: 1 }} />
      <Button
        label={confirmLabel}
        tone={tone}
        onPress={onConfirm}
        disabled={confirmDisabled}
        style={{ flex: 1 }}
      />
    </Row>
  );
}
