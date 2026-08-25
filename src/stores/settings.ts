import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * User preferences that must survive a restart: language, for now.
 *
 * Defaults to `system`, so a fresh install matches whatever the phone is
 * already set to and the user only has to touch this if they disagree.
 */

export type LocalePref = 'en' | 'tr' | 'system';

interface SettingsState {
  localePref: LocalePref;
  /** False until AsyncStorage has been read, so we never flash the wrong language. */
  hydrated: boolean;

  setLocalePref: (pref: LocalePref) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      localePref: 'system',
      hydrated: false,

      setLocalePref: (localePref) => set({ localePref }),
    }),
    {
      name: 'ludora.settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ localePref: s.localePref }),
      onRehydrateStorage: () => (state) => {
        // Runs whether or not stored data existed, so a first launch still
        // clears the gate rather than hanging on the splash forever.
        useSettings.setState({ hydrated: true, ...(state ? {} : {}) });
      },
    },
  ),
);
