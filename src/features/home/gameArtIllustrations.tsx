import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';

/**
 * Hand-drawn (SVG, not photographic) key art for games that don't have a
 * real illustration yet. Same reasoning as `features/onboarding/illustrations.tsx`:
 * there is no image-generation tool available, so a new game's card gets a
 * coded illustration in the kit's own ink-outline cartoon language rather
 * than sit behind the generic icon fallback in `GameArt.tsx` until a real
 * asset shows up. Swap for a raster export later by adding a `require()` to
 * that file's `ART` map — nothing here needs to change to be replaced.
 *
 * Banner-shaped (not square) since it renders straight into the game card's
 * key-art slot, not a framed circle like the onboarding art.
 *
 * Agent and Imposter are two separate games, not two roles in one game (an
 * earlier version of this file drew them as a single split-screen scene) —
 * each gets its own solo illustration, sharing the `Bust` figure and colour
 * language so the pair still reads as siblings on the catalogue grid.
 */

const INK_WIDTH = 6;

/** Head + shoulders bust — the shared unit both illustrations below build
 *  from, so the two cards read as the same character language, not two
 *  unrelated drawings. */
function Bust({
  cx,
  bodyColor,
  headColor,
  ink,
}: {
  cx: number;
  bodyColor: string;
  headColor: string;
  ink: string;
}) {
  return (
    <G transform={`translate(${cx} 0)`}>
      <Path
        d="M-46 176 C-46 128 -25 100 0 100 C25 100 46 128 46 176 Z"
        fill={bodyColor}
        stroke={ink}
        strokeWidth={INK_WIDTH}
      />
      <Circle cx={0} cy={82} r={38} fill={headColor} stroke={ink} strokeWidth={INK_WIDTH} />
    </G>
  );
}

/** Trench-coat collar + tie, worn by the bust at `cx`. */
function Tie({ cx, color, ink }: { cx: number; color: string; ink: string }) {
  return <Path d={`M${cx - 16} 118 L${cx} 100 L${cx + 16} 118 L${cx} 176 Z`} fill={color} stroke={ink} strokeWidth={INK_WIDTH * 0.7} />;
}

export function AgentArt() {
  const { palette } = useTheme();
  const p = palette as Palette;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 176" preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={320} height={176} fill={p.primaryContainer} />

      {/* Confident, upright, nothing hidden — sunglasses and a tie, nothing more. */}
      <Bust cx={160} bodyColor={p.primary} headColor={p.surface} ink={p.ink} />
      <G transform="translate(160 82)">
        <Rect x={-26} y={-6} width={52} height={10} rx={5} fill={p.ink} />
        <Circle cx={-13} cy={-1} r={7} fill={p.surfaceLow} />
        <Circle cx={13} cy={-1} r={7} fill={p.surfaceLow} />
      </G>
      <Tie cx={160} color={p.tertiary} ink={p.ink} />

      {/* Magnifying glass, the deduction motif every social-deduction card
          in this app leans on. */}
      <G transform="translate(266 46)">
        <Circle cx={0} cy={0} r={22} fill={p.surface} stroke={p.ink} strokeWidth={INK_WIDTH} />
        <Path d="M15 15 L28 28" stroke={p.ink} strokeWidth={INK_WIDTH + 2} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

export function ImposterArt() {
  const { palette } = useTheme();
  const p = palette as Palette;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 176" preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={320} height={176} fill={p.errorContainer} />

      {/* A second, unlit head peeking out from behind — someone else
          wearing the same shape, the whole premise in one silhouette. */}
      <Circle cx={198} cy={68} r={30} fill={p.ink} opacity={0.25} />

      {/* One eye visible, the rest held behind a mask — the tell, not the disguise. */}
      <Bust cx={160} bodyColor={p.error} headColor={p.surface} ink={p.ink} />
      <G transform="translate(160 82)">
        <Circle cx={-13} cy={-4} r={4} fill={p.ink} />
        <Path d="M6 4 Q16 10 4 16 Q-4 12 -6 4 Q0 -6 6 4 Z" fill={p.onSurfaceVariant} stroke={p.ink} strokeWidth={3.5} />
      </G>
    </Svg>
  );
}
