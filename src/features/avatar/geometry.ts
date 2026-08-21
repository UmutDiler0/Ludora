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
  neutral: { shoulder: 34, chest: 32, waist: 27, hip: 31, thigh: 13, legGap: 2, armWidth: 13 },
  feminine: { shoulder: 30, chest: 29, waist: 23, hip: 34, thigh: 13, legGap: 2, armWidth: 12 },
  masculine: { shoulder: 38, chest: 36, waist: 31, hip: 30, thigh: 14, legGap: 2, armWidth: 14 },
};

export const buildMetrics = (variant: string | undefined): BuildMetrics =>
  BUILDS[(variant as BuildVariant) ?? 'neutral'] ?? BUILDS.neutral;

/**
 * The torso outline, from shoulders to hips.
 *
 * `inflate` grows it evenly so a garment can be drawn as the same silhouette a
 * few units larger — which is what keeps a hoodie looking like it is worn by
 * this body rather than pasted onto it.
 */
export function torsoPath(b: BuildMetrics, inflate = 0): string {
  const sh = b.shoulder + inflate;
  const ch = b.chest + inflate;
  const wa = b.waist + inflate;
  const hi = b.hip + inflate;
  const top = Y.shoulder - inflate;
  const bottom = Y.hip + inflate;

  return [
    `M ${CENTRE - sh} ${top}`,
    `Q ${CENTRE} ${top - 13} ${CENTRE + sh} ${top}`,
    `C ${CENTRE + ch + 2} ${Y.chest} ${CENTRE + wa + 2} ${Y.waist - 8} ${CENTRE + wa} ${Y.waist}`,
    `C ${CENTRE + hi} ${Y.hip - 12} ${CENTRE + hi} ${bottom - 6} ${CENTRE + hi - 4} ${bottom}`,
    `L ${CENTRE - hi + 4} ${bottom}`,
    `C ${CENTRE - hi} ${bottom - 6} ${CENTRE - hi} ${Y.hip - 12} ${CENTRE - wa} ${Y.waist}`,
    `C ${CENTRE - wa - 2} ${Y.waist - 8} ${CENTRE - ch - 2} ${Y.chest} ${CENTRE - sh} ${top}`,
    'Z',
  ].join(' ');
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
