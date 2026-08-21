import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import {
  armGeometry,
  bustLine,
  garmentPath,
  CENTRE,
  HEAD,
  INK,
  legPath,
  legX,
  THIN,
  torsoPath,
  Y,
  type BuildMetrics,
} from './geometry';

/**
 * Per-slot geometric pieces (docs/ARCHITECTURE.md §22.4 placeholder tier, SVG
 * instead of Skia — see catalogue.ts for why). Each function returns bare SVG
 * elements, not a wrapping <Svg>, so `AvatarRenderer` can layer them onto one
 * canvas and a thumbnail can crop to whichever part of that canvas matters.
 *
 * Everything lives in the 160 × 280 full-body space defined in geometry.ts, and
 * every garment derives its shape from the same `BuildMetrics` the body uses.
 * That is the rule worth keeping: nothing here hard-codes a silhouette, so a
 * fourth build would be one entry in the metrics table rather than a redraw of
 * the whole wardrobe.
 */

interface PieceProps {
  variant: string;
  color: string;
  ink: string;
}

type BuildProps = PieceProps & { build: BuildMetrics };

function Star({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const r = size / 2;
  return (
    <Path
      transform={`translate(${x} ${y})`}
      d={`M0 ${-r} L${r * 0.28} ${-r * 0.28} L${r} 0 L${r * 0.28} ${r * 0.28} L0 ${r} L${-r * 0.28} ${r * 0.28} L${-r} 0 L${-r * 0.28} ${-r * 0.28} Z`}
      fill={color}
    />
  );
}

/* ---------------------------------------------------------- background */

export function BackgroundPiece({ color }: { color: string }) {
  // Bleeds well past the viewBox on every side. An SVG root clips to its
  // viewport, not its viewBox, so this keeps the colour edge-to-edge under any
  // crop or aspect mismatch instead of leaving a strip of whatever is behind.
  return <Rect x={-60} y={-60} width={280} height={400} fill={color} />;
}

/* --------------------------------------------------------------- body */

export function BodyPiece({ color, ink, build }: { color: string; ink: string; build: BuildMetrics }) {
  const b = build;
  const legWidth = b.thigh * 2;

  return (
    <G strokeLinejoin="round">
      {/* Legs and bare feet first — everything else overlaps them. */}
      {([-1, 1] as const).map((side) => (
        <G key={`leg${side}`}>
          <Path d={legPath(b, side, Y.ankle, legWidth)} fill={color} stroke={ink} strokeWidth={INK} />
          <Ellipse
            cx={legX(b, side) + side * 3}
            cy={Y.sole - 7}
            rx={b.thigh + 1}
            ry={8}
            fill={color}
            stroke={ink}
            strokeWidth={THIN}
          />
        </G>
      ))}

      <Rect x={CENTRE - 11} y={Y.neckTop} width={22} height={28} fill={color} stroke={ink} strokeWidth={THIN} />

      <Path d={torsoPath(b)} fill={color} stroke={ink} strokeWidth={INK} />

      {([-1, 1] as const).map((side) => {
        const a = armGeometry(b, side);
        return (
          <G key={`arm${side}`}>
            <Rect
              x={a.x}
              y={a.y}
              width={a.width}
              height={a.height}
              rx={a.rx}
              fill={color}
              stroke={ink}
              strokeWidth={THIN}
              transform={`rotate(${a.rotation} ${a.x + a.width / 2} ${a.y})`}
            />
            <Circle cx={a.handX} cy={a.handY} r={a.width * 0.62} fill={color} stroke={ink} strokeWidth={THIN} />
          </G>
        );
      })}

      {/* Ears before the head, so the skull outline closes over their inner edge. */}
      <Circle cx={HEAD.cx - HEAD.r + 2} cy={HEAD.cy + 6} r={8} fill={color} stroke={ink} strokeWidth={THIN} />
      <Circle cx={HEAD.cx + HEAD.r - 2} cy={HEAD.cy + 6} r={8} fill={color} stroke={ink} strokeWidth={THIN} />
      <Circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={color} stroke={ink} strokeWidth={INK} />
    </G>
  );
}

/* --------------------------------------------------------------- face */

export function FacePiece({ variant, color }: { variant: string; color: string }) {
  if (variant === 'freckles') {
    return (
      <G fill={color}>
        {[
          [58, 66],
          [63, 70],
          [54, 71],
          [102, 66],
          [97, 70],
          [106, 71],
        ].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={2.2} />
        ))}
      </G>
    );
  }
  if (variant === 'blush') {
    return (
      <G opacity={0.55} fill={color}>
        <Ellipse cx={58} cy={68} rx={10} ry={6} />
        <Ellipse cx={102} cy={68} rx={10} ry={6} />
      </G>
    );
  }
  if (variant === 'beauty') {
    return <Circle cx={98} cy={76} r={2.6} fill={color} />;
  }
  return null;
}

/* --------------------------------------------------------------- eyes */

const EYE = { left: 66, right: 94, y: 56 } as const;

export function EyesPiece({ variant, ink }: { variant: string; ink: string }) {
  if (variant === 'happy') {
    return (
      <G stroke={ink} strokeWidth={THIN} fill="none" strokeLinecap="round">
        <Path d={`M${EYE.left - 7} ${EYE.y + 3} Q${EYE.left} ${EYE.y - 6} ${EYE.left + 7} ${EYE.y + 3}`} />
        <Path d={`M${EYE.right - 7} ${EYE.y + 3} Q${EYE.right} ${EYE.y - 6} ${EYE.right + 7} ${EYE.y + 3}`} />
      </G>
    );
  }
  if (variant === 'sparkle') {
    return (
      <G>
        <Star x={EYE.left} y={EYE.y} size={15} color={ink} />
        <Star x={EYE.right} y={EYE.y} size={15} color={ink} />
      </G>
    );
  }
  if (variant === 'wink') {
    return (
      <G>
        <Circle cx={EYE.left} cy={EYE.y} r={5.5} fill={ink} />
        <Path
          d={`M${EYE.right - 7} ${EYE.y + 2} Q${EYE.right} ${EYE.y - 6} ${EYE.right + 7} ${EYE.y + 2}`}
          stroke={ink}
          strokeWidth={THIN}
          fill="none"
          strokeLinecap="round"
        />
      </G>
    );
  }
  if (variant === 'sleepy') {
    return (
      <G stroke={ink} strokeWidth={THIN} fill="none" strokeLinecap="round">
        <Path d={`M${EYE.left - 7} ${EYE.y} Q${EYE.left} ${EYE.y + 6} ${EYE.left + 7} ${EYE.y}`} />
        <Path d={`M${EYE.right - 7} ${EYE.y} Q${EYE.right} ${EYE.y + 6} ${EYE.right + 7} ${EYE.y}`} />
      </G>
    );
  }
  if (variant === 'wide') {
    return (
      <G>
        {[EYE.left, EYE.right].map((x) => (
          <G key={x}>
            <Circle cx={x} cy={EYE.y} r={8} fill="#FFFFFF" stroke={ink} strokeWidth={THIN} />
            <Circle cx={x} cy={EYE.y + 1} r={3.6} fill={ink} />
          </G>
        ))}
      </G>
    );
  }
  return (
    <G fill={ink}>
      <Circle cx={EYE.left} cy={EYE.y} r={5.5} />
      <Circle cx={EYE.right} cy={EYE.y} r={5.5} />
    </G>
  );
}

/* -------------------------------------------------------------- mouth */

export function MouthPiece({ variant, ink }: { variant: string; ink: string }) {
  const stroke = { stroke: ink, strokeWidth: THIN, fill: 'none', strokeLinecap: 'round' as const };

  if (variant === 'grin') {
    return (
      <G>
        <Path d="M66 72 Q80 88 94 72 Z" fill={ink} />
        <Path d="M69 74 Q80 79 91 74" stroke="#FFFFFF" strokeWidth={2.5} fill="none" />
      </G>
    );
  }
  if (variant === 'smirk') return <Path d="M70 76 Q82 84 92 74" {...stroke} />;
  if (variant === 'open') {
    return <Ellipse cx={80} cy={77} rx={8} ry={9} fill={ink} />;
  }
  if (variant === 'flat') return <Line x1={70} y1={77} x2={90} y2={77} {...stroke} />;
  return <Path d="M68 74 Q80 86 92 74" {...stroke} />;
}

/* -------------------------------------------------------- facial hair */

/**
 * Drawn before the mouth (see `SLOT_ORDER`), so a full beard frames the mouth
 * instead of covering it — the same reason a moustache can sit above the lip
 * without either piece knowing about the other.
 */
export function FacialHairPiece({ variant, color, ink }: PieceProps) {
  const outline = { fill: color, stroke: ink, strokeWidth: 2.5, strokeLinejoin: 'round' as const };

  if (variant === 'stubble') {
    // No outline: stubble is a tone on the skin, not a shape sitting on it.
    return <Path d="M50 62 Q52 94 80 97 Q108 94 110 62 Q104 83 80 83 Q56 83 50 62 Z" fill={color} opacity={0.32} />;
  }
  if (variant === 'moustache') {
    return <Path d="M64 70 Q72 63 80 70 Q88 63 96 70 Q88 78 80 73 Q72 78 64 70 Z" {...outline} />;
  }
  if (variant === 'goatee') {
    return (
      <G>
        <Path d="M66 70 Q73 64 80 70 Q87 64 94 70 Q87 77 80 73 Q73 77 66 70 Z" {...outline} />
        <Path d="M71 84 Q80 81 89 84 Q87 96 80 98 Q73 96 71 84 Z" {...outline} />
      </G>
    );
  }
  if (variant === 'chops') {
    return (
      <G {...outline}>
        <Path d="M49 52 Q47 78 57 87 Q61 71 59 52 Z" />
        <Path d="M111 52 Q113 78 103 87 Q99 71 101 52 Z" />
      </G>
    );
  }
  // 'beard' — full
  return (
    <Path
      d="M48 56 Q48 96 80 100 Q112 96 112 56 Q108 82 95 81 Q88 73 80 73 Q72 73 65 81 Q52 82 48 56 Z"
      {...outline}
      strokeWidth={THIN}
    />
  );
}

/* --------------------------------------------------------------- hair */

const DOME = 'M46 60 Q46 22 80 22 Q114 22 114 60 Q114 46 80 44 Q46 46 46 60 Z';

export function HairPiece({ variant, color, ink }: PieceProps) {
  const outline = { fill: color, stroke: ink, strokeWidth: INK, strokeLinejoin: 'round' as const };

  if (variant === 'buzz') {
    return <Path d="M48 56 Q48 26 80 26 Q112 26 112 56 Q112 48 80 46 Q48 48 48 56 Z" {...outline} strokeWidth={THIN} />;
  }
  if (variant === 'curly') {
    return (
      <G fill={color} stroke={ink} strokeWidth={THIN}>
        {[
          [50, 44, 14],
          [64, 28, 15],
          [82, 22, 16],
          [100, 28, 15],
          [113, 44, 14],
        ].map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} />
        ))}
      </G>
    );
  }
  if (variant === 'afro') {
    // A halo of overlapping circles, not one big disc. Hair draws after the
    // head, so a single circle wide enough to read as an afro simply covers
    // the face — this arcs around the skull instead and leaves it clear.
    return (
      <G fill={color} stroke={ink} strokeWidth={THIN}>
        {[
          [40, 62, 16],
          [42, 40, 18],
          [58, 22, 18],
          [80, 16, 19],
          [102, 22, 18],
          [118, 40, 18],
          [120, 62, 16],
        ].map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} />
        ))}
      </G>
    );
  }
  if (variant === 'mohawk') {
    return (
      <G {...outline}>
        <Path d="M48 54 Q48 34 80 32 Q112 34 112 54 Q112 46 80 44 Q48 46 48 54 Z" strokeWidth={THIN} />
        <Path d="M68 44 L80 2 L92 44 Z" />
      </G>
    );
  }
  if (variant === 'long') {
    return (
      <G {...outline}>
        <Path d="M40 60 Q34 108 42 138 L58 138 Q48 104 50 60 Z" strokeWidth={THIN} />
        <Path d="M120 60 Q126 108 118 138 L102 138 Q112 104 110 60 Z" strokeWidth={THIN} />
        <Path d={DOME} />
      </G>
    );
  }
  if (variant === 'bob') {
    return (
      <G {...outline}>
        <Path d="M42 58 Q42 96 54 100 Q46 82 48 58 Z" strokeWidth={THIN} />
        <Path d="M118 58 Q118 96 106 100 Q114 82 112 58 Z" strokeWidth={THIN} />
        <Path d={DOME} />
      </G>
    );
  }
  if (variant === 'ponytail') {
    return (
      <G {...outline}>
        <Path d="M112 46 Q136 52 134 84 Q132 106 118 112 Q128 92 124 72 Q120 54 106 50 Z" strokeWidth={THIN} />
        <Path d={DOME} />
      </G>
    );
  }
  if (variant === 'bun') {
    return (
      <G {...outline}>
        <Circle cx={80} cy={16} r={14} strokeWidth={THIN} />
        <Path d={DOME} />
      </G>
    );
  }
  // 'short' — default dome.
  return <Path d={DOME} {...outline} />;
}

/* ------------------------------------------------------------ clothes */

/**
 * Soft shading under the chest, for builds that have one. Drawn on the garment
 * rather than the skin: `clothes` is never empty, so a line on the body would
 * be permanently hidden.
 */
function BustLine({ b, ink }: { b: BuildMetrics; ink: string }) {
  const d = bustLine(b);
  if (!d) return null;
  return <Path d={d} stroke={ink} strokeWidth={2.5} fill="none" opacity={0.35} strokeLinecap="round" />;
}

/** Sleeves follow the arms, so a garment never floats beside the body. */
function Sleeves({ b, color, ink, fraction }: { b: BuildMetrics; color: string; ink: string; fraction: number }) {
  return (
    <G>
      {([-1, 1] as const).map((side) => {
        const a = armGeometry(b, side);
        return (
          <Rect
            key={side}
            x={a.x - 2}
            y={a.y - 2}
            width={a.width + 4}
            height={a.height * fraction}
            rx={(a.width + 4) / 2}
            fill={color}
            stroke={ink}
            strokeWidth={THIN}
            transform={`rotate(${a.rotation} ${a.x + a.width / 2} ${a.y})`}
          />
        );
      })}
    </G>
  );
}

export function ClothesPiece({ variant, color, ink, build }: BuildProps) {
  const b = build;
  const body = torsoPath(b, 4);
  const outline = { fill: color, stroke: ink, strokeWidth: INK, strokeLinejoin: 'round' as const };

  if (variant === 'hoodie') {
    return (
      <G>
        <Sleeves b={b} color={color} ink={ink} fraction={1} />
        <Path d={body} {...outline} />
        <Path
          d={`M${CENTRE - 26} ${Y.shoulder + 2} Q${CENTRE} ${Y.shoulder + 26} ${CENTRE + 26} ${Y.shoulder + 2} L${CENTRE + 20} ${Y.shoulder + 12} Q${CENTRE} ${Y.shoulder + 32} ${CENTRE - 20} ${Y.shoulder + 12} Z`}
          fill={color}
          stroke={ink}
          strokeWidth={THIN}
        />
        <Rect x={CENTRE - 22} y={Y.waist - 22} width={44} height={20} rx={6} fill="none" stroke={ink} strokeWidth={THIN} />
        <Circle cx={CENTRE - 8} cy={Y.shoulder + 30} r={3} fill={ink} />
        <Circle cx={CENTRE + 8} cy={Y.shoulder + 30} r={3} fill={ink} />
      </G>
    );
  }

  if (variant === 'jacket') {
    return (
      <G>
        <Sleeves b={b} color={color} ink={ink} fraction={1} />
        <Path d={body} {...outline} />
        <Line x1={CENTRE} y1={Y.shoulder} x2={CENTRE} y2={Y.hip + 2} stroke={ink} strokeWidth={THIN} />
        <Path d={`M${CENTRE - 16} ${Y.shoulder + 2} L${CENTRE - 24} ${Y.chest} L${CENTRE - 6} ${Y.chest - 8} Z`} fill={color} stroke={ink} strokeWidth={THIN} />
        <Path d={`M${CENTRE + 16} ${Y.shoulder + 2} L${CENTRE + 24} ${Y.chest} L${CENTRE + 6} ${Y.chest - 8} Z`} fill={color} stroke={ink} strokeWidth={THIN} />
      </G>
    );
  }

  if (variant === 'sweater') {
    return (
      <G>
        <Sleeves b={b} color={color} ink={ink} fraction={1} />
        <Path d={body} {...outline} />
        <Rect x={CENTRE - b.waist - 4} y={Y.hip - 12} width={(b.waist + 4) * 2} height={14} rx={5} fill={color} stroke={ink} strokeWidth={THIN} />
        <G stroke={ink} strokeWidth={2} opacity={0.5}>
          {[0, 1, 2, 3].map((i) => (
            <Line key={i} x1={CENTRE - 18 + i * 12} y1={Y.chest - 8} x2={CENTRE - 18 + i * 12} y2={Y.waist} />
          ))}
        </G>
      </G>
    );
  }

  if (variant === 'striped') {
    return (
      <G>
        <Sleeves b={b} color={color} ink={ink} fraction={0.45} />
        <Path d={body} {...outline} />
        <G stroke="#FFFFFF" strokeWidth={7} opacity={0.85}>
          {[0, 1, 2, 3].map((i) => (
            <Line key={i} x1={CENTRE - b.chest} y1={Y.chest - 6 + i * 14} x2={CENTRE + b.chest} y2={Y.chest - 6 + i * 14} />
          ))}
        </G>
        <Path d={body} fill="none" stroke={ink} strokeWidth={INK} />
      </G>
    );
  }

  if (variant === 'tank') {
    const topHalf = b.chest - 1;
    return (
      <G>
        {/* Straps first, so the body of the garment closes over their ends. */}
        {([-1, 1] as const).map((side) => (
          <Path
            key={side}
            d={`M${CENTRE + side * topHalf * 0.6} ${Y.shoulder + 14} L${CENTRE + side * (topHalf * 0.62)} ${Y.shoulder - 10}`}
            stroke={color}
            strokeWidth={11}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {/* Same silhouette generator as every other top — a scooped neckline
            and a lower top edge, not a bespoke outline. */}
        <Path d={garmentPath(b, { inflate: 2, top: Y.shoulder + 6, topHalf, neckArc: -16 })} {...outline} />
        <BustLine b={b} ink={ink} />
      </G>
    );
  }

  if (variant === 'dress') {
    return (
      <G>
        <Sleeves b={b} color={color} ink={ink} fraction={0.35} />
        <Path
          d={`M${CENTRE - b.shoulder - 2} ${Y.shoulder - 2} Q${CENTRE} ${Y.shoulder - 15} ${CENTRE + b.shoulder + 2} ${Y.shoulder - 2} C${CENTRE + b.chest + 4} ${Y.chest} ${CENTRE + b.waist + 4} ${Y.waist - 6} ${CENTRE + b.waist + 2} ${Y.waist} L${CENTRE + b.hip + 22} ${Y.knee} L${CENTRE - b.hip - 22} ${Y.knee} L${CENTRE - b.waist - 2} ${Y.waist} C${CENTRE - b.waist - 4} ${Y.waist - 6} ${CENTRE - b.chest - 4} ${Y.chest} ${CENTRE - b.shoulder - 2} ${Y.shoulder - 2} Z`}
          {...outline}
        />
        <Line x1={CENTRE - b.waist - 2} y1={Y.waist} x2={CENTRE + b.waist + 2} y2={Y.waist} stroke={ink} strokeWidth={THIN} />
        <BustLine b={b} ink={ink} />
      </G>
    );
  }

  if (variant === 'overalls') {
    return (
      <G>
        <Path
          d={`M${CENTRE - 22} ${Y.chest - 6} L${CENTRE + 22} ${Y.chest - 6} L${CENTRE + b.waist + 2} ${Y.waist} L${CENTRE + b.hip} ${Y.hip + 2} L${CENTRE - b.hip} ${Y.hip + 2} L${CENTRE - b.waist - 2} ${Y.waist} Z`}
          {...outline}
        />
        <Path d={`M${CENTRE - 20} ${Y.chest - 6} L${CENTRE - 24} ${Y.shoulder - 4}`} stroke={color} strokeWidth={9} strokeLinecap="round" fill="none" />
        <Path d={`M${CENTRE + 20} ${Y.chest - 6} L${CENTRE + 24} ${Y.shoulder - 4}`} stroke={color} strokeWidth={9} strokeLinecap="round" fill="none" />
        <Circle cx={CENTRE - 18} cy={Y.chest} r={3} fill={ink} />
        <Circle cx={CENTRE + 18} cy={Y.chest} r={3} fill={ink} />
      </G>
    );
  }

  // 'tee'
  return (
    <G>
      <Sleeves b={b} color={color} ink={ink} fraction={0.45} />
      <Path d={body} {...outline} />
      <Path
        d={`M${CENTRE - 12} ${Y.shoulder} L${CENTRE} ${Y.shoulder + 16} L${CENTRE + 12} ${Y.shoulder}`}
        stroke={ink}
        strokeWidth={THIN}
        fill="none"
        strokeLinecap="round"
      />
      <BustLine b={b} ink={ink} />
    </G>
  );
}

/* -------------------------------------------------------------- pants */

export function PantsPiece({ variant, color, ink, build }: BuildProps) {
  const b = build;
  const outline = { fill: color, stroke: ink, strokeWidth: INK, strokeLinejoin: 'round' as const };
  const waistband = (
    <Rect
      x={CENTRE - b.hip - 1}
      y={Y.hip - 22}
      width={(b.hip + 1) * 2}
      height={28}
      rx={9}
      fill={color}
      stroke={ink}
      strokeWidth={INK}
    />
  );

  if (variant === 'skirt') {
    return (
      <G>
        <Path
          d={`M${CENTRE - b.hip - 1} ${Y.hip - 22} L${CENTRE + b.hip + 1} ${Y.hip - 22} L${CENTRE + b.hip + 20} ${Y.knee - 6} L${CENTRE - b.hip - 20} ${Y.knee - 6} Z`}
          {...outline}
        />
        <Line x1={CENTRE - b.hip - 1} y1={Y.hip - 8} x2={CENTRE + b.hip + 1} y2={Y.hip - 8} stroke={ink} strokeWidth={THIN} />
      </G>
    );
  }

  const legs = (toY: number, width: number) => (
    <G>
      {([-1, 1] as const).map((side) => (
        <Path key={side} d={legPath(b, side, toY, width)} {...outline} />
      ))}
    </G>
  );

  if (variant === 'shorts') {
    return (
      <G>
        {legs(Y.knee - 4, b.thigh * 2 + 8)}
        {waistband}
      </G>
    );
  }

  if (variant === 'joggers') {
    return (
      <G>
        {legs(Y.ankle - 8, b.thigh * 2 + 7)}
        {waistband}
        {([-1, 1] as const).map((side) => (
          <Rect
            key={side}
            x={legX(b, side) - b.thigh - 1}
            y={Y.ankle - 16}
            width={(b.thigh + 1) * 2}
            height={12}
            rx={5}
            fill={color}
            stroke={ink}
            strokeWidth={THIN}
          />
        ))}
      </G>
    );
  }

  if (variant === 'cargo') {
    return (
      <G>
        {legs(Y.ankle - 2, b.thigh * 2 + 9)}
        {waistband}
        {([-1, 1] as const).map((side) => (
          <Rect
            key={side}
            x={legX(b, side) + side * (b.thigh - 3) - 7}
            y={Y.knee - 22}
            width={14}
            height={18}
            rx={3}
            fill="none"
            stroke={ink}
            strokeWidth={THIN}
          />
        ))}
      </G>
    );
  }

  if (variant === 'leggings') {
    return (
      <G>
        {legs(Y.ankle - 2, b.thigh * 2 + 1)}
        {waistband}
      </G>
    );
  }

  // 'jeans'
  return (
    <G>
      {legs(Y.ankle - 2, b.thigh * 2 + 5)}
      {waistband}
      <Line x1={CENTRE} y1={Y.hip - 20} x2={CENTRE} y2={Y.hip + 2} stroke={ink} strokeWidth={2} opacity={0.6} />
    </G>
  );
}

/* -------------------------------------------------------------- shoes */

export function ShoesPiece({ variant, color, ink, build }: BuildProps) {
  const b = build;

  /** One shoe, toe pointing away from the centre line. */
  const shoe = (side: -1 | 1, topY: number) => {
    const cx = legX(b, side);
    const w = b.thigh + 2;
    const toe = side * 9;
    return [
      `M ${cx - w} ${topY}`,
      `L ${cx - w} ${Y.sole - 10}`,
      `Q ${cx - w} ${Y.sole} ${cx - w + 9} ${Y.sole}`,
      `L ${cx + w + toe - side * 2} ${Y.sole}`,
      `Q ${cx + w + toe} ${Y.sole} ${cx + w + toe} ${Y.sole - 9}`,
      `L ${cx + w} ${topY}`,
      'Z',
    ].join(' ');
  };

  const outline = { fill: color, stroke: ink, strokeWidth: INK, strokeLinejoin: 'round' as const };

  if (variant === 'boot') {
    return (
      <G>
        {([-1, 1] as const).map((side) => (
          <G key={side}>
            <Path d={shoe(side, Y.ankle - 26)} {...outline} />
            <Line
              x1={legX(b, side) - b.thigh - 2}
              y1={Y.ankle - 6}
              x2={legX(b, side) + b.thigh + 2}
              y2={Y.ankle - 6}
              stroke={ink}
              strokeWidth={THIN}
            />
          </G>
        ))}
      </G>
    );
  }

  if (variant === 'hitop') {
    return (
      <G>
        {([-1, 1] as const).map((side) => (
          <G key={side}>
            <Path d={shoe(side, Y.ankle - 18)} {...outline} />
            <G stroke="#FFFFFF" strokeWidth={2.5}>
              {[0, 1, 2].map((i) => (
                <Line
                  key={i}
                  x1={legX(b, side) - b.thigh + 2}
                  y1={Y.ankle - 12 + i * 7}
                  x2={legX(b, side) + b.thigh - 2}
                  y2={Y.ankle - 12 + i * 7}
                />
              ))}
            </G>
          </G>
        ))}
      </G>
    );
  }

  if (variant === 'sandal') {
    return (
      <G>
        {([-1, 1] as const).map((side) => (
          <G key={side}>
            <Path
              d={`M ${legX(b, side) - b.thigh - 1} ${Y.sole - 8} L ${legX(b, side) + b.thigh + side * 8} ${Y.sole - 8} Q ${legX(b, side) + b.thigh + side * 10} ${Y.sole} ${legX(b, side) + b.thigh + side * 6} ${Y.sole} L ${legX(b, side) - b.thigh + 2} ${Y.sole} Z`}
              {...outline}
              strokeWidth={THIN}
            />
            <Line
              x1={legX(b, side) - b.thigh}
              y1={Y.sole - 14}
              x2={legX(b, side) + b.thigh}
              y2={Y.sole - 10}
              stroke={color}
              strokeWidth={5}
              strokeLinecap="round"
            />
          </G>
        ))}
      </G>
    );
  }

  if (variant === 'loafer') {
    return (
      <G>
        {([-1, 1] as const).map((side) => (
          <G key={side}>
            <Path d={shoe(side, Y.ankle - 4)} {...outline} strokeWidth={THIN} />
            <Ellipse cx={legX(b, side) + side * 3} cy={Y.ankle - 2} rx={b.thigh - 3} ry={4} fill={ink} opacity={0.35} />
          </G>
        ))}
      </G>
    );
  }

  // 'sneaker'
  return (
    <G>
      {([-1, 1] as const).map((side) => (
        <G key={side}>
          <Path d={shoe(side, Y.ankle - 10)} {...outline} />
          <Path
            d={`M ${legX(b, side) - b.thigh - 2} ${Y.sole - 9} L ${legX(b, side) + b.thigh + side * 9} ${Y.sole - 9}`}
            stroke="#FFFFFF"
            strokeWidth={5}
          />
        </G>
      ))}
    </G>
  );
}

/* ---------------------------------------------------------------- hat */

export function HatPiece({ variant, color, ink }: PieceProps) {
  const outline = { fill: color, stroke: ink, strokeWidth: INK, strokeLinejoin: 'round' as const };

  if (variant === 'beanie') {
    return (
      <G>
        <Path d="M46 52 Q46 18 80 18 Q114 18 114 52 L114 42 Q114 24 80 24 Q46 24 46 42 Z" {...outline} />
        <Rect x={44} y={42} width={72} height={16} rx={8} fill={color} stroke={ink} strokeWidth={THIN} />
        <Circle cx={80} cy={16} r={7} fill={color} stroke={ink} strokeWidth={THIN} />
      </G>
    );
  }
  if (variant === 'party') {
    return (
      <G>
        <Path d="M80 4 L106 48 L54 48 Z" {...outline} />
        <Circle cx={80} cy={4} r={5} fill={ink} />
        <Circle cx={73} cy={32} r={3} fill={ink} opacity={0.5} />
        <Circle cx={88} cy={24} r={3} fill={ink} opacity={0.5} />
      </G>
    );
  }
  if (variant === 'crown') {
    return (
      <G fill={color} stroke={ink} strokeWidth={THIN} strokeLinejoin="round">
        <Path d="M48 48 L54 20 L68 36 L80 16 L92 36 L106 20 L112 48 Z" />
        <Circle cx={54} cy={20} r={4} />
        <Circle cx={80} cy={16} r={4} />
        <Circle cx={106} cy={20} r={4} />
      </G>
    );
  }
  if (variant === 'bucket') {
    return (
      <G>
        <Path d="M52 46 Q52 20 80 20 Q108 20 108 46 Z" {...outline} />
        <Path d="M38 46 Q80 38 122 46 Q80 60 38 46 Z" fill={color} stroke={ink} strokeWidth={THIN} />
      </G>
    );
  }
  if (variant === 'headband') {
    return (
      <G>
        <Path d="M46 42 Q80 30 114 42 L114 50 Q80 38 46 50 Z" fill={color} stroke={ink} strokeWidth={THIN} strokeLinejoin="round" />
      </G>
    );
  }
  // 'cap'
  return (
    <G>
      <Path d="M46 50 Q46 18 80 18 Q114 18 114 50 Q114 40 80 38 Q46 40 46 50 Z" {...outline} />
      <Path d="M106 42 Q130 42 134 50 Q120 53 104 50 Z" fill={color} stroke={ink} strokeWidth={THIN} />
    </G>
  );
}

/* ---------------------------------------------------------- accessory */

export function AccessoryPiece({ variant, color, ink }: PieceProps) {
  if (variant === 'glasses') {
    return (
      <G stroke={color} strokeWidth={THIN} fill="none">
        <Circle cx={EYE.left} cy={EYE.y} r={13} />
        <Circle cx={EYE.right} cy={EYE.y} r={13} />
        <Line x1={EYE.left + 13} y1={EYE.y} x2={EYE.right - 13} y2={EYE.y} />
      </G>
    );
  }
  if (variant === 'sunglasses') {
    return (
      <G>
        <Rect x={EYE.left - 15} y={EYE.y - 9} width={30} height={18} rx={7} fill={color} stroke={ink} strokeWidth={2.5} />
        <Rect x={EYE.right - 15} y={EYE.y - 9} width={30} height={18} rx={7} fill={color} stroke={ink} strokeWidth={2.5} />
        <Line x1={EYE.left + 15} y1={EYE.y - 2} x2={EYE.right - 15} y2={EYE.y - 2} stroke={ink} strokeWidth={3} />
      </G>
    );
  }
  if (variant === 'earrings') {
    return (
      <G fill={color} stroke={ink} strokeWidth={2}>
        <Circle cx={HEAD.cx - HEAD.r + 1} cy={HEAD.cy + 15} r={5} />
        <Circle cx={HEAD.cx + HEAD.r - 1} cy={HEAD.cy + 15} r={5} />
      </G>
    );
  }
  if (variant === 'headphones') {
    return (
      <G>
        <Path d="M44 56 Q44 20 80 20 Q116 20 116 56" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />
        <Rect x={36} y={50} width={16} height={26} rx={7} fill={color} stroke={ink} strokeWidth={2.5} />
        <Rect x={108} y={50} width={16} height={26} rx={7} fill={color} stroke={ink} strokeWidth={2.5} />
      </G>
    );
  }
  if (variant === 'star') {
    return <Star x={104} y={72} size={20} color={color} />;
  }
  if (variant === 'scarf') {
    return (
      <G>
        <Path
          d={`M${CENTRE - 26} ${Y.neckTop + 16} Q${CENTRE} ${Y.shoulder + 8} ${CENTRE + 26} ${Y.neckTop + 16} L${CENTRE + 26} ${Y.shoulder + 4} Q${CENTRE} ${Y.shoulder + 24} ${CENTRE - 26} ${Y.shoulder + 4} Z`}
          fill={color}
          stroke={ink}
          strokeWidth={THIN}
          strokeLinejoin="round"
        />
        <Path
          d={`M${CENTRE - 6} ${Y.shoulder + 10} L${CENTRE - 14} ${Y.chest + 16} L${CENTRE + 4} ${Y.chest + 6} Z`}
          fill={color}
          stroke={ink}
          strokeWidth={THIN}
          strokeLinejoin="round"
        />
      </G>
    );
  }
  return null;
}
