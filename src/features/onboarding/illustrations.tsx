import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';

/**
 * Hand-drawn (SVG, not photographic) onboarding art. There is no image
 * generation tool available, so these stand in for the Stitch-designed
 * illustrations using the same ink-outline cartoon language as the rest of
 * the UI kit (components/ui) rather than a mismatched style. Swap for real
 * exports later by replacing the <Image> usage in onboarding.tsx — these
 * components are self-contained and easy to lift back out.
 */

const INK_WIDTH = 6;

/** Six-point sparkle, reused across all three scenes as the "delight" accent. */
function Sparkle({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const r = size / 2;
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path
        d={`M0 ${-r} L${r * 0.28} ${-r * 0.28} L${r} 0 L${r * 0.28} ${r * 0.28} L0 ${r} L${-r * 0.28} ${r * 0.28} L${-r} 0 L${-r * 0.28} ${-r * 0.28} Z`}
        fill={color}
        stroke="none"
      />
    </G>
  );
}

function Backdrop({ color }: { color: string }) {
  return <Circle cx="100" cy="100" r="88" fill={color} />;
}

export function DiscoverArt() {
  const { palette } = useTheme();
  const p = palette as Palette;
  return (
    <Svg width="72%" height="72%" viewBox="0 0 200 200">
      <Backdrop color={p.secondaryContainer} />

      {/* back card */}
      <G transform="translate(100 108) rotate(-10)">
        <Rect x="-42" y="-56" width="84" height="112" rx="14" fill={p.surface} stroke={p.ink} strokeWidth={INK_WIDTH} />
      </G>
      {/* front card */}
      <G transform="translate(100 108) rotate(9)">
        <Rect x="-42" y="-56" width="84" height="112" rx="14" fill={p.tertiaryContainer} stroke={p.ink} strokeWidth={INK_WIDTH} />
        <Circle cx="0" cy="0" r="20" fill={p.surface} stroke={p.ink} strokeWidth={INK_WIDTH * 0.7} />
      </G>

      {/* die, front and center */}
      <G transform="translate(52 138) rotate(-8)">
        <Rect x="-26" y="-26" width="52" height="52" rx="12" fill={p.primary} stroke={p.ink} strokeWidth={INK_WIDTH} />
        <Circle cx="-10" cy="-10" r="4.5" fill={p.onPrimary} />
        <Circle cx="10" cy="-10" r="4.5" fill={p.onPrimary} />
        <Circle cx="-10" cy="10" r="4.5" fill={p.onPrimary} />
        <Circle cx="10" cy="10" r="4.5" fill={p.onPrimary} />
        <Circle cx="0" cy="0" r="4.5" fill={p.onPrimary} />
      </G>

      <Sparkle x={148} y={54} size={22} color={p.tertiary} />
      <Sparkle x={40} y={56} size={14} color={p.secondary} />
    </Svg>
  );
}

export function CustomizeArt() {
  const { palette } = useTheme();
  const p = palette as Palette;
  return (
    <Svg width="72%" height="72%" viewBox="0 0 200 200">
      <Backdrop color={p.primaryContainer} />

      {/* avatar */}
      <G transform="translate(100 118)">
        {/* shirt */}
        <Path
          d="M-44 46 C-44 6 -26 -10 0 -10 C26 -10 44 6 44 46 Z"
          fill={p.tertiary}
          stroke={p.ink}
          strokeWidth={INK_WIDTH}
        />
        {/* collar */}
        <Path d="M-14 -8 L0 6 L14 -8" fill="none" stroke={p.ink} strokeWidth={INK_WIDTH * 0.7} strokeLinecap="round" strokeLinejoin="round" />
        {/* head */}
        <Circle cx="0" cy="-46" r="30" fill={p.surface} stroke={p.ink} strokeWidth={INK_WIDTH} />
        {/* simple face */}
        <Circle cx="-10" cy="-48" r="3.4" fill={p.ink} />
        <Circle cx="10" cy="-48" r="3.4" fill={p.ink} />
        <Path d="M-8 -36 Q0 -30 8 -36" fill="none" stroke={p.ink} strokeWidth={3.4} strokeLinecap="round" />
      </G>

      {/* gold coin, bottom-right */}
      <G transform="translate(150 156)">
        <Circle cx="0" cy="0" r="22" fill={p.tertiaryContainer} stroke={p.ink} strokeWidth={INK_WIDTH * 0.8} />
        <Circle cx="0" cy="0" r="13" fill="none" stroke={p.onTertiary} strokeWidth={3} />
      </G>

      {/* xp star badge, top-left */}
      <G transform="translate(46 52)">
        <Circle cx="0" cy="0" r="18" fill={p.secondaryContainer} stroke={p.ink} strokeWidth={INK_WIDTH * 0.7} />
        <Sparkle x={0} y={0} size={18} color={p.onSecondary} />
      </G>
    </Svg>
  );
}

export function CompeteArt() {
  const { palette } = useTheme();
  const p = palette as Palette;
  return (
    <Svg width="72%" height="72%" viewBox="0 0 200 200">
      <Backdrop color={p.tertiaryContainer} />

      {/* podium */}
      <G>
        <Rect x="30" y="126" width="42" height="40" rx="8" fill={p.surface} stroke={p.ink} strokeWidth={INK_WIDTH} />
        <Rect x="79" y="100" width="42" height="66" rx="8" fill={p.tertiary} stroke={p.ink} strokeWidth={INK_WIDTH} />
        <Rect x="128" y="140" width="42" height="26" rx="8" fill={p.surface} stroke={p.ink} strokeWidth={INK_WIDTH} />
      </G>

      {/* trophy on the center block */}
      <G transform="translate(100 76)">
        <Path
          d="M-16 -22 L16 -22 L13 4 C13 16 4 24 0 24 C-4 24 -13 16 -13 4 Z"
          fill={p.medalGold}
          stroke={p.ink}
          strokeWidth={INK_WIDTH * 0.8}
        />
        <Path d="M-16 -18 C-30 -18 -30 2 -14 4" fill="none" stroke={p.ink} strokeWidth={4.5} strokeLinecap="round" />
        <Path d="M16 -18 C30 -18 30 2 14 4" fill="none" stroke={p.ink} strokeWidth={4.5} strokeLinecap="round" />
        <Rect x="-6" y="24" width="12" height="10" fill={p.medalGold} stroke={p.ink} strokeWidth={4} />
      </G>

      <Sparkle x={44} y={64} size={16} color={p.secondary} />
      <Sparkle x={158} y={70} size={20} color={p.primary} />
      <Ellipse cx="100" cy="168" rx="60" ry="6" fill={p.ink} opacity={0.08} />
    </Svg>
  );
}
