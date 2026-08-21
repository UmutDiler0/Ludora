import type { BuildVariant } from './types';

/**
 * The shared full-body coordinate space, 160 × 280.
 *
 * Every piece is drawn here, and the two view modes are just different windows
 * onto the same drawing: `full` shows all of it, `bust` crops to the head and
 * shoulders for the circular avatars that appear in lists and leaderboards.
 * That is why there is no separate "portrait" artwork — one drawing, two crops,
 * so a hat can never look right in one place and wrong in the other.
 *
 * Proportions are deliberately cartoon: the head is roughly a quarter of the
 * total height, where a realistic figure would be an eighth.
 */

export const CANVAS = { width: 160, height: 280 } as const;
export const CENTRE = 80;

/** Window onto the canvas for each render mode. */
export const VIEWBOX = {
  full: '0 0 160 280',
  bust: '20 10 120 120',
} as const;

export const HEAD = { cx: CENTRE, cy: 58, r: 34 } as const;

export const Y = {
  neckTop: 86,
  shoulder: 106,
  chest: 128,
  waist: 160,
  hip: 178,
  knee: 214,
  ankle: 248,
  sole: 266,
} as const;

/** Outline weights, matching the cartoon kit's ink-first look. */
export const INK = 6;
export const THIN = 4;

export interface BuildMetrics {
  /** Half-widths at each landmark. */
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  /** Half-width of one thigh, and half the gap between the legs. */
  thigh: number;
  legGap: number;
  armWidth: number;
  /**
   * Extra outward curve at chest height. Zero means the torso runs straight
   * from shoulder to waist. Garments inherit it through `torsoPath`, so a top
   * follows the chest without any per-build clothing artwork.
   */
  bust: number;
}

/**
 * The three silhouettes.
 *
 * They differ only in the shoulder-to-hip relationship, which is what actually
 * reads as build at this size — feminine narrows the shoulders and widens the
 * hips, masculine does the reverse, neutral sits between them. Height, head
 * size and limb length are identical across all three, so switching build never
 * changes how a hat or a pair of shoes fits.
 */
const BUILDS: Record<BuildVariant, BuildMetrics> = {
  neutral: { shoulder: 34, chest: 32, waist: 27, hip: 31, thigh: 13, legGap: 2, armWidth: 13, bust: 0 },
  feminine: { shoulder: 30, chest: 29, waist: 23, hip: 34, thigh: 13, legGap: 2, armWidth: 12, bust: 5 },
  masculine: { shoulder: 38, chest: 36, waist: 31, hip: 30, thigh: 14, legGap: 2, armWidth: 14, bust: 0 },
};

export const buildMetrics = (variant: string | undefined): BuildMetrics =>
  BUILDS[(variant as BuildVariant) ?? 'neutral'] ?? BUILDS.neutral;

export interface GarmentOptions {
  /** Grows the whole shape evenly, so a top sits outside the body it covers. */
  inflate?: number;
  /** Y of the top edge. Lower than the shoulder for sleeveless cuts. */
  top?: number;
  /** Half-width at `top`. Defaults to the shoulder. */
  topHalf?: number;
  /** How far the top edge arcs. Positive rises over the shoulders, negative scoops into a neckline. */
  neckArc?: number;
}

/**
 * The torso outline, from a top edge down to the hips.
 *
 * Every garment is this same shape with different arguments, which is the point:
 * the bust curve, the waist taper and the hip flare are defined once, so a top
 * cannot drift out of agreement with the body underneath it. A tank that drew
 * its own outline is exactly how the feminine build ended up looking identical
 * to the others while wearing one.
 */
export function garmentPath(b: BuildMetrics, options: GarmentOptions = {}): string {
  const { inflate = 0, top = Y.shoulder, topHalf = b.shoulder, neckArc = 13 } = options;

  const th = topHalf + inflate;
  const wa = b.waist + inflate;
  const hi = b.hip + inflate;
  const t = top - inflate;
  const bottom = Y.hip + inflate;

  // The chest control point carries the bust: pulled outward and slightly up,
  // it bows the top-to-waist run into a curve rather than a straight taper.
  const cpX = b.chest + inflate + 2 + b.bust * 1.7;
  const cpY = Y.chest - b.bust * 1.2;

  return [
    `M ${CENTRE - th} ${t}`,
    `Q ${CENTRE} ${t - neckArc} ${CENTRE + th} ${t}`,
    `C ${CENTRE + cpX} ${cpY} ${CENTRE + wa + 2} ${Y.waist - 8} ${CENTRE + wa} ${Y.waist}`,
    `C ${CENTRE + hi} ${Y.hip - 12} ${CENTRE + hi} ${bottom - 6} ${CENTRE + hi - 4} ${bottom}`,
    `L ${CENTRE - hi + 4} ${bottom}`,
    `C ${CENTRE - hi} ${bottom - 6} ${CENTRE - hi} ${Y.hip - 12} ${CENTRE - wa} ${Y.waist}`,
    `C ${CENTRE - wa - 2} ${Y.waist - 8} ${CENTRE - cpX} ${cpY} ${CENTRE - th} ${t}`,
    'Z',
  ].join(' ');
}

/** The bare torso — a garment with no adjustments. */
export const torsoPath = (b: BuildMetrics, inflate = 0): string => garmentPath(b, { inflate });

/** Underbust shading line, for builds that have one. Empty otherwise. */
export function bustLine(b: BuildMetrics): string {
  if (b.bust <= 0) return '';
  const w = b.chest * 0.52;
  const y = Y.chest + 5;
  return `M${CENTRE - w} ${y} Q${CENTRE - w * 0.45} ${y + 9} ${CENTRE} ${y} Q${CENTRE + w * 0.45} ${y + 9} ${CENTRE + w} ${y}`;
}

/** Centre-line x of one leg. */
export const legX = (b: BuildMetrics, side: -1 | 1): number =>
  CENTRE + side * (b.legGap + b.thigh);

/**
 * One leg as a rounded column from the hip down to `toY`.
 *
 * Trousers, shorts and bare legs are all this same shape at different lengths
 * and widths, so a new garment length is a number rather than a new path.
 */
export function legPath(b: BuildMetrics, side: -1 | 1, toY: number, width: number): string {
  const cx = legX(b, side);
  const half = width / 2;
  const r = Math.min(half, 10);
  return [
    `M ${cx - half} ${Y.hip - 6}`,
    `L ${cx - half} ${toY - r}`,
    `Q ${cx - half} ${toY} ${cx - half + r} ${toY}`,
    `L ${cx + half - r} ${toY}`,
    `Q ${cx + half} ${toY} ${cx + half} ${toY - r}`,
    `L ${cx + half} ${Y.hip - 6}`,
    'Z',
  ].join(' ');
}

/**
 * Arm geometry: a rounded column angled slightly away from the body.
 *
 * The centre line sits *outside* the shoulder half-width on purpose. Garments
 * inflate the torso by 4, so an arm centred on the shoulder is completely
 * hidden under any top — the figure renders as an armless bowling pin.
 */
export function armGeometry(b: BuildMetrics, side: -1 | 1) {
  const x = CENTRE + side * (b.shoulder + b.armWidth * 0.55);
  const top = Y.shoulder - 4;
  const height = Y.waist + 6 - top;
  const degrees = side * 7;
  const radians = (degrees * Math.PI) / 180;

  return {
    x: x - b.armWidth / 2,
    y: top,
    width: b.armWidth,
    height,
    rx: b.armWidth / 2,
    rotation: degrees,
    // Derived from the rotation rather than eyeballed, so the hand stays
    // welded to the cuff at any angle or arm length. The rect pivots about
    // (x, top), so the far end lands here.
    handX: x + Math.sin(radians) * height,
    handY: top + Math.cos(radians) * height,
  };
}
