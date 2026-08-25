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
 */

const INK_WIDTH = 6;

/** Head + shoulders bust — the unit both characters below are built from,
 *  so "agent" and "imposter" read as the same figure with different tells
 *  rather than two unrelated drawings. */
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

export function AgentImposterArt() {
  const { palette } = useTheme();
  const p = palette as Palette;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 176" preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={320} height={176} fill={p.surfaceLow} />
      <Rect x={0} y={0} width={160} height={176} fill={p.primaryContainer} />
      <Rect x={160} y={0} width={160} height={176} fill={p.errorContainer} />

      {/* Agent — trench coat, tie, sunglasses. Confident, upright, nothing hidden. */}
      <Bust cx={94} bodyColor={p.primary} headColor={p.surface} ink={p.ink} />
      <G transform="translate(94 82)">
        <Rect x={-26} y={-6} width={52} height={10} rx={5} fill={p.ink} />
        <Circle cx={-13} cy={-1} r={7} fill={p.surfaceLow} />
        <Circle cx={13} cy={-1} r={7} fill={p.surfaceLow} />
      </G>
      <Path d="M78 118 L94 100 L110 118 L94 176 Z" fill={p.tertiary} stroke={p.ink} strokeWidth={INK_WIDTH * 0.7} />

      {/* Imposter — same silhouette, a mask held up over half the face. */}
      <Bust cx={226} bodyColor={p.error} headColor={p.surface} ink={p.ink} />
      <G transform="translate(226 82)">
        <Circle cx={-13} cy={-4} r={4} fill={p.ink} />
        <Path d="M6 4 Q16 10 4 16 Q-4 12 -6 4 Q0 -6 6 4 Z" fill={p.onSurfaceVariant} stroke={p.ink} strokeWidth={3.5} />
      </G>

      {/* Magnifying glass, centred over the seam — the deduction motif every
          social-deduction card in this app leans on. */}
      <G transform="translate(160 54)">
        <Circle cx={0} cy={0} r={26} fill={p.surface} stroke={p.ink} strokeWidth={INK_WIDTH} />
        <Path d="M18 18 L34 34" stroke={p.ink} strokeWidth={INK_WIDTH + 2} strokeLinecap="round" />
      </G>
    </Svg>
  );
}
