import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Label, Text } from '@/components/ui';
import { APP_NAME } from '@/constants/app';
import { useSession } from '@/stores/session';
import { palette, radius, spacing } from '@/theme/tokens';

/**
 * Splash + boot router (spec §4, docs/ARCHITECTURE.md §5).
 *
 * Initialization already happened in the root layout — fonts and session are
 * resolved before this renders. The delay here is purely the entrance
 * animation, held to a floor so the brand does not flash past in 80 ms, and it
 * runs *while* nothing is blocking. Spec §4: "avoid unnecessary loading
 * delays."
 */

const SPLASH_FLOOR_MS = 1400;

export default function Boot() {
  const [held, setHeld] = useState(true);
  const { hasOnboarded, status, pendingRoomCode } = useSession();

  useEffect(() => {
    const timer = setTimeout(() => setHeld(false), SPLASH_FLOOR_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!held) {
    if (!hasOnboarded) return <Redirect href="/onboarding" />;
    if (status !== 'signed-in') return <Redirect href="/(auth)/login" />;
    // Deep link captured before auth is consumed once the user is through.
    if (pendingRoomCode) return <Redirect href="/(tabs)/play" />;
    return <Redirect href="/(tabs)" />;
  }

  return <Splash />;
}

function Splash() {
  const scale = useSharedValue(0.8);
  const glow = useSharedValue(0.55);
  const sweep = useSharedValue(-1);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    glow.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.55, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    sweep.value = withDelay(
      200,
      withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.cubic) }), -1, false),
    );
  }, [glow, scale, sweep]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glow.value,
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${sweep.value * 100}%` }],
  }));

  return (
    <View style={s.root}>
      <View style={s.center}>
        <Animated.View style={[s.orb, orbStyle]} />
        <Animated.View entering={FadeIn.delay(250).duration(600)} style={s.mark}>
          <Ionicons name="game-controller" size={44} color={palette.onSurface} />
          <Text variant="title" center>
            {APP_NAME}
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(600).duration(500)} style={s.footer}>
        <Label center color={palette.secondary}>
          Connecting to hub…
        </Label>
        <View style={s.track}>
          <Animated.View style={[s.trackFill, sweepStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}

const ORB = 240;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orb: {
    position: 'absolute',
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    backgroundColor: palette.primaryContainer,
  },
  mark: { alignItems: 'center', gap: spacing.md },
  footer: { padding: spacing.xxl, gap: spacing.lg },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceHigh,
    overflow: 'hidden',
  },
  trackFill: {
    width: '55%',
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: palette.secondary,
  },
});
