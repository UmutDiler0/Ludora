import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { stroke as strokeTokens } from '@/theme/tokens';

/**
 * A ring that orbits a stationary wifi glyph.
 *
 * Only the ring rotates. Spinning the icon too would read as a loading
 * indicator that happens to be wifi-shaped; keeping it still says "we are
 * working on *this*" — the thing that is broken stays legible while the
 * activity moves around it.
 *
 * The arc is drawn with a dash pattern rather than a partial-circle path so
 * there is no join to line up, and the whole thing is one worklet-driven
 * rotation on the UI thread (§15: nothing crosses the bridge per frame).
 */
export function ConnectingSpinner({
  size = 88,
  /** Stops the ring and swaps the glyph — the search is over and it failed. */
  failed = false,
}: {
  size?: number;
  failed?: boolean;
}) {
  const { palette } = useTheme();
  const spin = useSharedValue(0);

  useEffect(() => {
    if (failed) {
      cancelAnimation(spin);
      spin.value = 0;
      return;
    }
    spin.value = 0;
    spin.value = withRepeat(
      // Linear: a spinner that eases looks like it is struggling, which is a
      // claim about the network we cannot actually make.
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(spin);
  }, [failed, spin]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  const ringWidth = 5;
  const radius = size / 2 - ringWidth / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  // A quarter-circle sweep with a three-quarter gap.
  const arc = circumference * 0.26;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, ringStyle]}>
        <Svg width={size} height={size}>
          {/* Track, so the ring reads as travelling around something. */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={palette.outlineVariant}
            strokeWidth={ringWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={failed ? palette.error : palette.primary}
            strokeWidth={ringWidth}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference - arc}`}
            fill="none"
          />
        </Svg>
      </Animated.View>

      <View
        style={{
          width: size * 0.62,
          height: size * 0.62,
          borderRadius: size,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.surfaceHigh,
          borderWidth: strokeTokens.thin,
          borderColor: palette.ink,
        }}>
        <Ionicons
          name={failed ? 'cloud-offline' : 'wifi'}
          size={size * 0.34}
          color={failed ? palette.error : palette.onSurface}
        />
      </View>
    </View>
  );
}
