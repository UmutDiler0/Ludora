import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

/**
 * Per-slot geometric placeholder pieces (docs/ARCHITECTURE.md §22.4
 * placeholder tier, SVG instead of Skia — see catalogue.ts for why). Each
 * function returns bare SVG elements, not a wrapping <Svg>, so `AvatarRenderer`
 * can layer them on one canvas and the shop can drop a single piece into a
 * small preview `<Svg>` of its own.
 *
 * Shared 160x160 coordinate space, head centered at (80, 68) r=40.
 */

const INK = 6;
const THIN = 4;

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

export function BackgroundPiece({ color }: { color: string }) {
  return <Rect x={0} y={0} width={160} height={160} fill={color} />;
}

export function BodyPiece({ color, ink }: { color: string; ink: string }) {
  return <Circle cx={80} cy={68} r={40} fill={color} stroke={ink} strokeWidth={INK} />;
}

export function FacePiece({ variant, color }: { variant: string; color: string }) {
  if (variant === 'freckles') {
    return (
      <G fill={color}>
        {[
          [58, 80],
          [63, 84],
          [54, 85],
          [102, 80],
          [97, 84],
          [106, 85],
        ].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={2} />
        ))}
      </G>
    );
  }
  if (variant === 'blush') {
    return (
      <G opacity={0.55} fill={color}>
        <Ellipse cx={58} cy={80} rx={9} ry={6} />
        <Ellipse cx={102} cy={80} rx={9} ry={6} />
      </G>
    );
  }
  return null;
}

export function EyesPiece({ variant, ink }: { variant: string; ink: string }) {
  if (variant === 'happy') {
    return (
      <G stroke={ink} strokeWidth={THIN} fill="none" strokeLinecap="round">
        <Path d="M58 66 Q64 58 70 66" />
        <Path d="M90 66 Q96 58 102 66" />
      </G>
    );
  }
  if (variant === 'sparkle') {
    return (
      <G fill={ink}>
        <Star x={64} y={64} size={14} color={ink} />
        <Star x={96} y={64} size={14} color={ink} />
      </G>
    );
  }
  return (
    <G fill={ink}>
      <Circle cx={64} cy={64} r={5} />
      <Circle cx={96} cy={64} r={5} />
    </G>
  );
}

export function MouthPiece({ ink }: { ink: string }) {
  return <Path d="M66 88 Q80 100 94 88" stroke={ink} strokeWidth={THIN} fill="none" strokeLinecap="round" />;
}

export function HairPiece({ variant, color, ink }: { variant: string; color: string; ink: string }) {
  if (variant === 'curly') {
    return (
      <G fill={color} stroke={ink} strokeWidth={THIN}>
        {[
          [44, 40, 14],
          [62, 28, 15],
          [80, 24, 16],
          [98, 28, 15],
          [116, 40, 14],
        ].map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} />
        ))}
      </G>
    );
  }
  if (variant === 'mohawk') {
    return (
      <G fill={color} stroke={ink} strokeWidth={THIN}>
        <Path d="M68 44 L80 6 L92 44 Z" />
      </G>
    );
  }
  if (variant === 'long') {
    return (
      <G fill={color} stroke={ink} strokeWidth={INK}>
        <Path d="M38 58 Q38 14 80 14 Q122 14 122 58 Q122 46 80 44 Q38 46 38 58 Z" />
        <Path d="M36 56 Q30 90 36 118 L48 118 Q42 88 46 56 Z" strokeWidth={THIN} />
        <Path d="M124 56 Q130 90 124 118 L112 118 Q118 88 114 56 Z" strokeWidth={THIN} />
      </G>
    );
  }
  // 'short' — default dome.
  return (
    <Path
      d="M38 58 Q38 14 80 14 Q122 14 122 58 Q122 46 80 44 Q38 46 38 58 Z"
      fill={color}
      stroke={ink}
      strokeWidth={INK}
    />
  );
}

export function ClothesPiece({ variant, color, ink }: { variant: string; color: string; ink: string }) {
  const shoulders = 'M30 160 L46 106 Q80 96 114 106 L130 160 Z';
  if (variant === 'hoodie') {
    return (
      <G>
        <Path d={shoulders} fill={color} stroke={ink} strokeWidth={INK} />
        <Path d="M58 108 Q80 126 102 108 L96 116 Q80 132 64 116 Z" fill={color} stroke={ink} strokeWidth={THIN} />
        <Circle cx={72} cy={126} r={3} fill={ink} />
        <Circle cx={88} cy={126} r={3} fill={ink} />
      </G>
    );
  }
  if (variant === 'jacket') {
    return (
      <G>
        <Path d={shoulders} fill={color} stroke={ink} strokeWidth={INK} />
        <Line x1={80} y1={106} x2={80} y2={158} stroke={ink} strokeWidth={THIN} />
        <Path d="M64 110 L58 128 L70 124 Z" fill={color} stroke={ink} strokeWidth={THIN} />
        <Path d="M96 110 L102 128 L90 124 Z" fill={color} stroke={ink} strokeWidth={THIN} />
      </G>
    );
  }
  if (variant === 'tank') {
    return (
      <G>
        <Path d="M42 160 L52 110 Q80 102 108 110 L118 160 Z" fill={color} stroke={ink} strokeWidth={INK} />
        <Path d="M58 110 L62 96" stroke={ink} strokeWidth={THIN} strokeLinecap="round" />
        <Path d="M102 110 L98 96" stroke={ink} strokeWidth={THIN} strokeLinecap="round" />
      </G>
    );
  }
  // 'tee'
  return (
    <G>
      <Path d={shoulders} fill={color} stroke={ink} strokeWidth={INK} />
      <Path d="M68 108 L80 122 L92 108" stroke={ink} strokeWidth={THIN} fill="none" strokeLinecap="round" />
    </G>
  );
}

export function HatPiece({ variant, color, ink }: { variant: string; color: string; ink: string }) {
  if (variant === 'beanie') {
    return (
      <G>
        <Path d="M40 50 Q40 10 80 10 Q120 10 120 50 L120 38 Q120 16 80 16 Q40 16 40 38 Z" fill={color} stroke={ink} strokeWidth={INK} />
        <Rect x={38} y={38} width={84} height={16} rx={8} fill={color} stroke={ink} strokeWidth={THIN} />
        <Circle cx={80} cy={10} r={6} fill={color} stroke={ink} strokeWidth={THIN} />
      </G>
    );
  }
  if (variant === 'party') {
    return (
      <G>
        <Path d="M80 2 L108 46 L52 46 Z" fill={color} stroke={ink} strokeWidth={INK} strokeLinejoin="round" />
        <Circle cx={80} cy={2} r={5} fill={ink} />
        <Circle cx={72} cy={28} r={3} fill={ink} opacity={0.5} />
        <Circle cx={88} cy={20} r={3} fill={ink} opacity={0.5} />
      </G>
    );
  }
  if (variant === 'crown') {
    return (
      <G fill={color} stroke={ink} strokeWidth={THIN}>
        <Path d="M42 46 L48 16 L64 34 L80 12 L96 34 L112 16 L118 46 Z" strokeLinejoin="round" />
        <Circle cx={48} cy={16} r={4} />
        <Circle cx={80} cy={12} r={4} />
        <Circle cx={112} cy={16} r={4} />
      </G>
    );
  }
  // 'cap'
  return (
    <G>
      <Path d="M40 48 Q40 12 80 12 Q120 12 120 48 Q120 38 80 36 Q40 38 40 48 Z" fill={color} stroke={ink} strokeWidth={INK} />
      <Path d="M112 40 Q134 40 138 48 Q124 50 110 48 Z" fill={color} stroke={ink} strokeWidth={THIN} />
    </G>
  );
}

export function AccessoryPiece({ variant, color, ink }: { variant: string; color: string; ink: string }) {
  if (variant === 'glasses') {
    return (
      <G stroke={color} strokeWidth={THIN} fill="none">
        <Circle cx={64} cy={64} r={13} />
        <Circle cx={96} cy={64} r={13} />
        <Line x1={77} y1={64} x2={83} y2={64} />
      </G>
    );
  }
  if (variant === 'star') {
    return <Star x={104} y={80} size={20} color={color} />;
  }
  if (variant === 'scarf') {
    return (
      <G>
        <Path d="M52 102 Q80 118 108 102 L108 112 Q80 128 52 112 Z" fill={color} stroke={ink} strokeWidth={THIN} />
        <Path d="M76 112 L70 140 L84 130 Z" fill={color} stroke={ink} strokeWidth={THIN} />
      </G>
    );
  }
  return null;
}
