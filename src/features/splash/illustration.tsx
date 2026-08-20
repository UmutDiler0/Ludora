import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * Hand-drawn (SVG) splash mark — a chunky die, echoing the dice motif used
 * elsewhere in the cartoon UI. No image generation tool is available, so this
 * replaces the plain Ionicon that stood in previously.
 */
export function SplashMark({ size = 92 }: { size?: number }) {
  const { palette: p } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G transform="translate(50 52) rotate(-6)">
        <Rect x="-34" y="-34" width="68" height="68" rx="16" fill={p.primary} stroke={p.ink} strokeWidth={7} />
        <Circle cx="-14" cy="-14" r="6" fill={p.onPrimary} />
        <Circle cx="14" cy="-14" r="6" fill={p.onPrimary} />
        <Circle cx="-14" cy="14" r="6" fill={p.onPrimary} />
        <Circle cx="14" cy="14" r="6" fill={p.onPrimary} />
        <Circle cx="0" cy="0" r="6" fill={p.onPrimary} />
      </G>
      <Path
        d="M84 20 L87 27 L94 30 L87 33 L84 40 L81 33 L74 30 L81 27 Z"
        fill={p.tertiary}
        stroke="none"
      />
    </Svg>
  );
}
