/**
 * Auth boundary (docs/ARCHITECTURE.md §3 — infrastructure layer).
 *
 * The UI and stores talk only to this interface. `MockAuthGateway` implements
 * it today so every screen can be built and run in Expo Go; a
 * `FirebaseAuthGateway` implements the same surface later without any screen
 * changing. This is the same insurance policy §18 buys for realtime transport.
 */

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
}

export type AuthErrorCode =
  | 'invalid-email'
  | 'weak-password'
  | 'email-in-use'
  | 'user-not-found'
  | 'wrong-password'
  | 'unknown';

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Human-readable copy for every failure the UI can surface. */
export const AUTH_ERROR_COPY: Record<AuthErrorCode, string> = {
  'invalid-email': 'That email address does not look right.',
  'weak-password': 'Passwords need at least 8 characters.',
  'email-in-use': 'An account already exists for that email.',
  'user-not-found': 'No account found for that email.',
  'wrong-password': 'Incorrect password. Try again.',
  unknown: 'Something went wrong. Please try again.',
};

export interface AuthGateway {
  /** Resolves the persisted session on cold start, or null when signed out. */
  restore(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthUser>;
  register(email: string, password: string, displayName: string): Promise<AuthUser>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
}
