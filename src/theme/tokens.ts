/**
 * Design tokens outside the color palette.
 *
 * Colour lives in `palettes.ts` and is served through `ThemeProvider`.
 * Everything here — geometry, weights, type — is unrelated to color and can
 * be imported directly.
 *
 * The cartoon look comes from three devices, applied in components/ui:
 *   1. thick `ink` outlines on every surface
 *   2. an over-thick bottom border, so controls read as physical and pressable
 *   3. generous corner radii and chunky rounded type
 */

export { type Palette, type RoleColors } from './palettes';

/** Chunky and rounded. Cartoon UI has no tight corners. */
export const radius = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Outline weights — the single most important cartoon signal. */
export const stroke = {
  thin: 2,
  base: 3,
  /** Bottom edge, so the element looks like a physical object with depth. */
  depth: 6,
  depthPressed: 2,
} as const;

export const fonts = {
  display: 'Fredoka_600SemiBold',
  displayExtra: 'Fredoka_700Bold',
  body: 'Nunito_600SemiBold',
  bodyMedium: 'Nunito_700Bold',
  bodyBold: 'Nunito_800ExtraBold',
  label: 'Nunito_800ExtraBold',
  labelBold: 'Nunito_900Black',
} as const;

export const type = {
  hero: { fontFamily: fonts.displayExtra, fontSize: 42, lineHeight: 48 },
  title: { fontFamily: fonts.displayExtra, fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: fonts.display, fontSize: 21, lineHeight: 27 },
  body: { fontFamily: fonts.body, fontSize: 15.5, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15.5, lineHeight: 23 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.label, fontSize: 11.5, letterSpacing: 1.2 },
  mono: { fontFamily: fonts.displayExtra, fontSize: 34, letterSpacing: 6 },
} as const;
