/**
 * The cartoon palette. Ludora ships one look, not a light/dark pair — every
 * shape has a drawn `ink` outline, deep plum on cream paper, the "sticker"
 * reading the whole design language is built around.
 *
 * Semantic mapping (docs/ARCHITECTURE.md §20): grape = identity, lagoon =
 * realtime, sunshine = economy, tomato = danger.
 */

const INK = '#2E2545';

export const palette = {
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

  ink: INK,
} as const;

export type Palette = { -readonly [K in keyof typeof palette]: string };

export type RoleColors = {
  vampire: string;
  investigator: string;
  protector: string;
  villager: string;
};

export const roleColors: RoleColors = {
  vampire: '#FF3B5C',
  investigator: '#7C4DFF',
  protector: '#16C4E8',
  villager: '#FF9F1C',
};

/** Avatar placeholder hues (decision D19) — the round avatar bubble's background color. */
export const avatarHues = ['#7C4DFF', '#16C4E8', '#FFC93C', '#FF5B4A', '#2FCB74', '#FF9F1C'];
