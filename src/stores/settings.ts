import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * User preferences that must survive a restart: appearance and language.
 *
 * Both default to `system`, so a fresh install matches whatever the phone is
 * already set to and the user only has to touch this if they disagree.
 */

export type ThemePref = 'light' | 'dark' | 'system';
export type LocalePref = 'en' | 'tr' | 'system';

interface SettingsState {
  themePref: ThemePref;
  localePref: LocalePref;
  /** False until AsyncStorage has been read, so we never flash the wrong theme. */
  hydrated: boolean;

  setThemePref: (pref: ThemePref) => void;
  setLocalePref: (pref: LocalePref) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themePref: 'system',
      localePref: 'system',
      hydrated: false,

      setThemePref: (themePref) => set({ themePref }),
      setLocalePref: (localePref) => set({ localePref }),
    }),
    {
      name: 'ludora.settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ themePref: s.themePref, localePref: s.localePref }),
      onRehydrateStorage: () => (state) => {
        // Runs whether or not stored data existed, so a first launch still
        // clears the gate rather than hanging on the splash forever.
        useSettings.setState({ hydrated: true, ...(state ? {} : {}) });
      },
    },
  ),
);
