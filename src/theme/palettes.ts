/**
 * Light and dark cartoon palettes.
 *
 * Dark mode is not an inversion. The cartoon look depends on every shape
 * having a drawn outline, so the `ink` token flips role: in light it is a deep
 * plum drawn on cream paper, in dark it becomes warm cream drawn on a night
 * ground — the same "sticker" reading, chalk instead of pen.
 *
 * Both palettes expose identical keys, so a component never branches on mode.
 * Semantic mapping is constant across both (docs/ARCHITECTURE.md §20):
 * grape = identity, lagoon = realtime, sunshine = economy, tomato = danger.
 */

const LIGHT_INK = '#2E2545';
const DARK_INK = '#FFF1DA';

export const lightPalette = {
  background: '#FFF6E5',
  surface: '#FFFFFF',
  surfaceLowest: '#FFFCF5',
  surfaceLow: '#FFF0D6',
  surfaceContainer: '#FFFFFF',
  surfaceHigh: '#FFE9C7',
  surfaceHighest: '#FFDFAF',
  surfaceBright: '#FFFFFF',

  onSurface: LIGHT_INK,
  onSurfaceVariant: '#6B5F86',
  outline: LIGHT_INK,
  outlineVariant: '#CFC5E4',

  primary: '#7C4DFF',
  primaryContainer: '#8B5CF6',
  onPrimary: '#FFFFFF',
  brand: '#8B5CF6',

  secondary: '#0FB6D8',
  secondaryContainer: '#16C4E8',
  onSecondary: '#04303A',

  tertiary: '#F0A81E',
  tertiaryContainer: '#FFC93C',
  onTertiary: '#4A3200',

  error: '#FF5B4A',
  errorContainer: '#FF8B7E',
  onError: '#FFFFFF',

  success: '#2FCB74',

  night: '#2A2150',
  onNight: '#FFF1D6',

  // Podium metals. Separate from the semantic ramp because a rank badge must
  // read as a medal, not as "economy" or "danger" (§20).
  medalGold: '#F0A81E',
  medalSilver: '#A9A6C0',
  medalBronze: '#C57B45',

  ink: LIGHT_INK,
} as const;

export type Palette = { -readonly [K in keyof typeof lightPalette]: string };

export const darkPalette: Palette = {
  background: '#191233',
  surface: '#251C46',
  surfaceLowest: '#120D26',
  surfaceLow: '#1F1739',
  surfaceContainer: '#251C46',
  surfaceHigh: '#322557',
  surfaceHighest: '#3F2F6B',
  surfaceBright: '#4A387D',

  onSurface: DARK_INK,
  onSurfaceVariant: '#C3B3E6',
  outline: DARK_INK,
  outlineVariant: '#4A3D75',

  primary: '#A98BFF',
  primaryContainer: '#9B7BFF',
  onPrimary: '#1A1033',
  brand: '#A98BFF',

  secondary: '#4FDCF7',
  secondaryContainer: '#22C6E8',
  onSecondary: '#04262E',

  tertiary: '#FFCE5A',
  tertiaryContainer: '#F0A81E',
  onTertiary: '#3B2600',

  error: '#FF7A6B',
  errorContainer: '#FF5B4A',
  onError: '#3B0A03',

  success: '#4CE08C',

  night: '#120D26',
  onNight: DARK_INK,

  medalGold: '#FFCE5A',
  medalSilver: '#C9C5E0',
  medalBronze: '#E0925A',

  ink: DARK_INK,
};

export type RoleColors = {
  vampire: string;
  investigator: string;
  protector: string;
  villager: string;
};

/** Role accents, brightened in dark so they hold against a night ground. */
export const lightRoleColors: RoleColors = {
  vampire: '#FF3B5C',
  investigator: '#7C4DFF',
  protector: '#16C4E8',
  villager: '#FF9F1C',
};

export const darkRoleColors: RoleColors = {
  vampire: '#FF6B82',
  investigator: '#A98BFF',
  protector: '#4FDCF7',
  villager: '#FFB454',
};

/** Avatar placeholder hues (decision D19), tuned per mode. */
export const lightAvatarHues = ['#7C4DFF', '#16C4E8', '#FFC93C', '#FF5B4A', '#2FCB74', '#FF9F1C'];
export const darkAvatarHues = ['#9B7BFF', '#22C6E8', '#F0A81E', '#FF6B5B', '#3ED484', '#FFA83C'];

export type ResolvedScheme = 'light' | 'dark';

export const paletteFor = (scheme: ResolvedScheme): Palette =>
  scheme === 'dark' ? darkPalette : (lightPalette as unknown as Palette);

export const roleColorsFor = (scheme: ResolvedScheme): RoleColors =>
  scheme === 'dark' ? darkRoleColors : lightRoleColors;

export const avatarHuesFor = (scheme: ResolvedScheme): string[] =>
  scheme === 'dark' ? darkAvatarHues : lightAvatarHues;
