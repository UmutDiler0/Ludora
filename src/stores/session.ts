import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { firebaseAuthGateway } from '@/services/auth/firebaseAuth';
import { AUTH_ERROR_COPY, AuthError, type AuthUser } from '@/services/auth/types';

/**
 * Session state — authentication plus the once-per-install onboarding flag
 * (spec §5) and the deep-link handoff slot (spec §39).
 *
 * Only `hasOnboarded` and `pendingRoomCode` persist. The signed-in user is
 * restored from the auth gateway on boot instead, so there is exactly one
 * source of truth for who is signed in.
 */

type Status = 'booting' | 'signed-out' | 'signed-in';

interface SessionState {
  status: Status;
  user: AuthUser | null;
  hasOnboarded: boolean;
  /** True once the current session came from "Play as guest" rather than a real account. */
  isGuest: boolean;
  /** Persisted so a guest session survives an app restart without a real account. */
  guestId: string | null;
  /** Room code captured from a deep link before auth; consumed after sign-in. */
  pendingRoomCode: string | null;

  /** In-flight flag and last error for the auth forms. */
  busy: boolean;
  error: string | null;

  restore: () => Promise<void>;
  completeOnboarding: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  playAsGuest: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  /** Deletes the mock account and signs out on success. */
  deleteAccount: (password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  setPendingRoomCode: (code: string | null) => void;
  clearError: () => void;
}

/** Every gateway call funnels through here so error copy is never duplicated. */
async function attempt(
  set: (partial: Partial<SessionState>) => void,
  run: () => Promise<AuthUser | null>,
): Promise<boolean> {
  set({ busy: true, error: null });
  try {
    const user = await run();
    // `isGuest`/`guestId` are derived from the real Firebase session's own
    // `isAnonymous` flag, not tracked independently — a real sign-in/register
    // naturally reads as `isGuest: false` here, `playAsGuest` as `true`,
    // with no special-casing needed for either.
    set(
      user
        ? { user, status: 'signed-in', busy: false, isGuest: user.isAnonymous, guestId: user.isAnonymous ? user.uid : null }
        : { busy: false },
    );
    return true;
  } catch (e) {
    const code = e instanceof AuthError ? e.code : 'unknown';
    set({ busy: false, error: AUTH_ERROR_COPY[code] });
    return false;
  }
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      status: 'booting',
      user: null,
      hasOnboarded: false,
      isGuest: false,
      guestId: null,
      pendingRoomCode: null,
      busy: false,
      error: null,

      async restore() {
        const user = await firebaseAuthGateway.restore();
        set({
          user,
          status: user ? 'signed-in' : 'signed-out',
          isGuest: user?.isAnonymous ?? false,
          guestId: user?.isAnonymous ? user.uid : null,
        });
      },

      completeOnboarding: () => set({ hasOnboarded: true }),

      signIn: (email, password) =>
        attempt(set, () => firebaseAuthGateway.signIn(email, password)),

      register: (email, password, displayName) =>
        attempt(set, () => firebaseAuthGateway.register(email, password, displayName)),

      playAsGuest: () => attempt(set, () => firebaseAuthGateway.playAsGuest()),

      sendPasswordReset: (email) =>
        attempt(set, async () => {
          await firebaseAuthGateway.sendPasswordReset(email);
          return null;
        }),

      changePassword: (currentPassword, newPassword) =>
        attempt(set, async () => {
          await firebaseAuthGateway.changePassword(currentPassword, newPassword);
          return null;
        }),

      async deleteAccount(password) {
        set({ busy: true, error: null });
        try {
          await firebaseAuthGateway.deleteAccount(password);
          set({ user: null, status: 'signed-out', error: null, isGuest: false, guestId: null, busy: false });
          return true;
        } catch (e) {
          const code = e instanceof AuthError ? e.code : 'unknown';
          set({ busy: false, error: AUTH_ERROR_COPY[code] });
          return false;
        }
      },

      async signOut() {
        await firebaseAuthGateway.signOut();
        set({ user: null, status: 'signed-out', error: null, isGuest: false, guestId: null });
      },

      setPendingRoomCode: (code) => set({ pendingRoomCode: code }),
      clearError: () => {
        if (get().error) set({ error: null });
      },
    }),
    {
      name: 'ludora.session',
      storage: createJSONStorage(() => AsyncStorage),
      // `user`/`status`/`isGuest`/`guestId` are deliberately not persisted
      // here — `restore()` re-derives all four from the auth gateway's own
      // session record (including its real `isAnonymous` flag now that guest
      // sessions are real Firebase Anonymous Auth, not a locally-faked user)
      // on every boot, so there is exactly one source of truth for who is
      // signed in. `hasOnboarded` persists so onboarding, once completed,
      // never forces a returning user back through login.
      partialize: (s) => ({
        hasOnboarded: s.hasOnboarded,
        pendingRoomCode: s.pendingRoomCode,
      }),
    },
  ),
);
