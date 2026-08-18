/**
 * Ludora design tokens.
 *
 * Verbatim from the Stitch project's own theme (docs/ARCHITECTURE.md §20) —
 * these are canonical, not invented. The design set is dark-only, so the app
 * commits to dark rather than shipping a half-considered light mode.
 *
 * Semantic mapping: violet = identity & progression, cyan = realtime &
 * presence, amber = gold & economy, red = danger & elimination.
 */

export const palette = {
  background: '#0b1326',
  surface: '#0b1326',
  surfaceLowest: '#060e20',
  surfaceLow: '#131b2e',
  surfaceContainer: '#171f33',
  surfaceHigh: '#222a3d',
  surfaceHighest: '#2d3449',
  surfaceBright: '#31394d',

  onSurface: '#dae2fd',
  onSurfaceVariant: '#cbc3d7',
  outline: '#958ea0',
  outlineVariant: '#494454',

  primary: '#d0bcff',
  primaryContainer: '#a078ff',
  onPrimary: '#3c0091',
  brand: '#8b5cf6',

  secondary: '#4cd7f6',
  secondaryContainer: '#03b5d3',
  onSecondary: '#003640',

  tertiary: '#ffb869',
  tertiaryContainer: '#ca801e',
  onTertiary: '#482900',

  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',
} as const;

/** Role accents, so a Vampire screen never reads the same as a Seer screen. */
export const roleColors = {
  vampire: palette.error,
  investigator: palette.primary,
  protector: palette.tertiary,
  villager: palette.onSurfaceVariant,
} as const;

/** Stitch roundness scale is ROUND_EIGHT — an 8px base. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
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

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayExtra: 'BricolageGrotesque_800ExtraBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodyBold: 'PlusJakartaSans_700Bold',
  label: 'SpaceGrotesk_500Medium',
  labelBold: 'SpaceGrotesk_700Bold',
} as const;

export const type = {
  hero: { fontFamily: fonts.displayExtra, fontSize: 40, lineHeight: 44 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 23 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.labelBold, fontSize: 11, letterSpacing: 1.4 },
  mono: { fontFamily: fonts.labelBold, fontSize: 34, letterSpacing: 6 },
} as const;

export type Palette = typeof palette;
export type RoleColorKey = keyof typeof roleColors;
