/**
 * Ludora design tokens — cartoon theme.
 *
 * Supersedes the Stitch dark/neon palette by explicit request. The semantic
 * mapping from docs/ARCHITECTURE.md §20 is preserved, just re-pitched bright:
 * grape = identity & progression, lagoon = realtime & presence,
 * sunshine = gold & economy, tomato = danger & elimination.
 *
 * Token *keys* are unchanged from the previous theme so screens did not have
 * to be rewritten — only these values and the primitives in components/ui.
 *
 * The cartoon look comes from three devices, applied in components/ui:
 *   1. thick `ink` outlines on every surface
 *   2. an over-thick bottom border, so controls read as physical and pressable
 *   3. generous corner radii and chunky rounded type
 */

/* The cartoon "black" — a deep plum, never pure #000, so outlines feel drawn. */
const INK = '#2E2545';

export const palette = {
  /** Warm paper, not white — the page reads as a printed comic panel. */
  background: '#FFF6E5',
  surface: '#FFFFFF',
  surfaceLowest: '#FFFCF5',
  surfaceLow: '#FFF0D6',
  surfaceContainer: '#FFFFFF',
  surfaceHigh: '#FFE9C7',
  surfaceHighest: '#FFDFAF',
  surfaceBright: '#FFFFFF',

  onSurface: INK,
  onSurfaceVariant: '#6B5F86',
  outline: INK,
  outlineVariant: '#CFC5E4',

  /** Grape — identity, progression, primary actions. */
  primary: '#7C4DFF',
  primaryContainer: '#8B5CF6',
  onPrimary: '#FFFFFF',
  brand: '#8B5CF6',

  /** Lagoon — realtime, presence, voting. */
  secondary: '#0FB6D8',
  secondaryContainer: '#16C4E8',
  onSecondary: '#04303A',

  /** Sunshine — gold, rewards, economy. */
  tertiary: '#F0A81E',
  tertiaryContainer: '#FFC93C',
  onTertiary: '#4A3200',

  /** Tomato — danger, elimination, vampires. */
  error: '#FF5B4A',
  errorContainer: '#FF8B7E',
  onError: '#FFFFFF',

  /** Lime — success and confirmation. */
  success: '#2FCB74',

  /** Night phase panels stay cartoon, just after dark. */
  night: '#2A2150',
  onNight: '#FFF1D6',

  ink: INK,
} as const;

/** Role accents — each role reads as a distinct character colour. */
export const roleColors = {
  vampire: '#FF3B5C',
  investigator: '#7C4DFF',
  protector: '#16C4E8',
  villager: '#FF9F1C',
} as const;

/** Chunky, rounded. Cartoon UI has no tight corners. */
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

export type Palette = typeof palette;
export type RoleColorKey = keyof typeof roleColors;
