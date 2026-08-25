import * as Localization from 'expo-localization';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useSettings, type LocalePref } from '@/stores/settings';
import { en, type Strings } from './en';
import { tr } from './tr';

/**
 * Resolves the three language options — English, Turkish, System — into one
 * active string tree, the same shape `ThemeProvider` resolves Light/Dark/
 * System into one active palette. `system` follows the device's own language
 * at the moment the app starts; unlike appearance, there's no RN hook that
 * re-emits when the OS language changes while the app is already open, so
 * (like every other app) that takes a restart to pick up — acceptable, since
 * changing your phone's language mid-session is not something anyone expects
 * an open app to react to live.
 */

export type Locale = 'en' | 'tr';

const STRINGS: Record<Locale, Strings> = { en, tr };

export function resolveLocale(pref: LocalePref, systemLocale: Locale): Locale {
  return pref === 'system' ? systemLocale : pref;
}

/** Best-effort read of the device's language, folded down to what this app ships. */
export function systemLocale(): Locale {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === 'tr' ? 'tr' : 'en';
}

export interface I18n {
  strings: Strings;
  /** Select a string (or a formatter function) out of the active tree —
   *  `t((s) => s.common.cancel)` — the same selector shape `useSettings`
   *  and every other zustand store in this app already use, so a typo in a
   *  key path is a compile error instead of `undefined` at runtime. */
  t: <T>(select: (strings: Strings) => T) => T;
  locale: Locale;
  /** What the user picked — may be 'system'. */
  pref: LocalePref;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const pref = useSettings((s) => s.localePref);
  const locale = resolveLocale(pref, systemLocale());

  const value = useMemo<I18n>(() => {
    const strings = STRINGS[locale];
    return {
      strings,
      t: (select) => select(strings),
      locale,
      pref,
    };
  }, [locale, pref]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside <I18nProvider>. Check the root layout.');
  }
  return ctx;
}

/** Shorthand for the common case — most call sites only need `t`. */
export const useT = (): I18n['t'] => useI18n().t;
