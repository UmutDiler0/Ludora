import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mockAuthGateway } from '@/services/auth/mockAuth';
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

/** `Guest12345678` — random 8-digit suffix, unique enough for a throwaway local id. */
const makeGuestId = () => `Guest${Math.floor(10_000_000 + Math.random() * 90_000_000)}`;

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
  playAsGuest: () => void;
  sendPasswordReset: (email: string) => Promise<boolean>;
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
    // A real sign-in/register always wins over a leftover guest session.
    set(
      user
        ? { user, status: 'signed-in', busy: false, isGuest: false, guestId: null }
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
        const { isGuest, guestId } = get();
        if (isGuest && guestId) {
          set({ user: { uid: guestId, email: '', displayName: guestId }, status: 'signed-in' });
          return;
        }
        const user = await mockAuthGateway.restore();
        set({ user, status: user ? 'signed-in' : 'signed-out' });
      },

      completeOnboarding: () => set({ hasOnboarded: true }),

      signIn: (email, password) =>
        attempt(set, () => mockAuthGateway.signIn(email, password)),

      register: (email, password, displayName) =>
        attempt(set, () => mockAuthGateway.register(email, password, displayName)),

      playAsGuest: () => {
        const guestId = makeGuestId();
        set({
          user: { uid: guestId, email: '', displayName: guestId },
          status: 'signed-in',
          isGuest: true,
          guestId,
          error: null,
        });
      },

      sendPasswordReset: (email) =>
        attempt(set, async () => {
          await mockAuthGateway.sendPasswordReset(email);
          return null;
        }),

      async signOut() {
        await mockAuthGateway.signOut();
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
      // hasOnboarded intentionally left out of partialize while onboarding is
      // still being tested, so it always resets to false on cold start and
      // the flow shows every launch. Re-add it here once onboarding is done.
      partialize: (s) => ({
        pendingRoomCode: s.pendingRoomCode,
        isGuest: s.isGuest,
        guestId: s.guestId,
      }),
    },
  ),
);
