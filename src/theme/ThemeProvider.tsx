import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useSettings, type ThemePref } from '@/stores/settings';
import {
  avatarHuesFor,
  paletteFor,
  roleColorsFor,
  type Palette,
  type ResolvedScheme,
  type RoleColors,
} from './palettes';

/**
 * Resolves the three appearance options — Light, Dark, System — into one
 * active palette, and republishes it through context so every component
 * re-renders when the user changes it.
 *
 * `system` follows the OS, which can change while the app is open (Android
 * auto dark mode, iOS scheduled dark). `useColorScheme` already emits on that,
 * so the whole tree follows without any listener of our own.
 */

export interface Theme {
  palette: Palette;
  roleColors: RoleColors;
  avatarHues: string[];
  /** What is actually being displayed right now. */
  scheme: ResolvedScheme;
  /** What the user picked — may be 'system'. */
  pref: ThemePref;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export function resolveScheme(pref: ThemePref, systemScheme: ResolvedScheme): ResolvedScheme {
  return pref === 'system' ? systemScheme : pref;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = useSettings((s) => s.themePref);
  // Null on first frame and on web before hydration; light is the safe default.
  const system: ResolvedScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const scheme = resolveScheme(pref, system);

  const value = useMemo<Theme>(
    () => ({
      palette: paletteFor(scheme),
      roleColors: roleColorsFor(scheme),
      avatarHues: avatarHuesFor(scheme),
      scheme,
      pref,
      isDark: scheme === 'dark',
    }),
    [scheme, pref],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
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
