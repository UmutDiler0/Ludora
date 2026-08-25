import { createContext, useContext, type ReactNode } from 'react';

import { avatarHues, palette, roleColors, type Palette, type RoleColors } from './palettes';

/**
 * Publishes the one cartoon theme through context. There is no light/dark
 * choice to resolve — this exists so every screen keeps reading colors via
 * `useTheme()` rather than importing `palettes.ts` directly, the same
 * indirection that would let a second theme come back later without every
 * consumer changing again.
 */

export interface Theme {
  palette: Palette;
  roleColors: RoleColors;
  avatarHues: string[];
}

const THEME: Theme = { palette: palette as unknown as Palette, roleColors, avatarHues };

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={THEME}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>. Check the root layout.');
  }
  return ctx;
}

/** Shorthand for the common case. */
export const usePalette = (): Palette => useTheme().palette;
