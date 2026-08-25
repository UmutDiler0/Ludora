/**
 * Small hex-color helpers shared by the theme's dark-mode derivations.
 *
 * `roleColors` legitimately gets *brighter* in dark mode (palettes.ts) — those
 * are small text/icon accents that need more contrast against a night ground.
 * Avatar colors are the opposite case: they are large flat fills (the
 * placeholder avatar bubble, a character's shirt or hair), and reusing the
 * same light-mode hue at full saturation on a dark surface reads as glaring,
 * not legible. `mutedForDark` blends a light-mode color partway toward a dark
 * anchor instead, so it calms down for dark mode rather than intensifying.
 */

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const rgbToHex = ([r, g, b]: [number, number, number]): string => {
  const channel = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
};

/** Blends `hex` toward `toward` by `amount` (0 = unchanged, 1 = fully `toward`). */
export function mutedForDark(hex: string, amount = 0.28, toward = '#191233'): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(toward);
  return rgbToHex([r1 + (r2 - r1) * amount, g1 + (g2 - g1) * amount, b1 + (b2 - b1) * amount]);
}
