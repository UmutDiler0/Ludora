import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from '@react-native-firebase/auth';

import { AuthError, type AuthErrorCode, type AuthGateway, type AuthUser } from './types';

/**
 * Real auth backed by @react-native-firebase/auth (modular API). Same
 * AuthGateway surface as `mockAuthGateway` (src/services/auth/mockAuth.ts) so
 * swapping the import in src/stores/session.ts is the only wiring change
 * needed.
 *
 * Requires: a Firebase project with Email/Password sign-in enabled, and
 * google-services.json / GoogleService-Info.plist at the project root (see
 * app.json). Needs a dev client — this does not run in Expo Go.
 */

const CODE_MAP: Record<string, AuthErrorCode> = {
  'auth/invalid-email': 'invalid-email',
  'auth/weak-password': 'weak-password',
  'auth/email-already-in-use': 'email-in-use',
  'auth/user-not-found': 'user-not-found',
  'auth/wrong-password': 'wrong-password',
  'auth/invalid-credential': 'wrong-password',
};

function toAuthError(err: unknown): AuthError {
  const code = (err as { code?: string })?.code ?? '';
  return new AuthError(CODE_MAP[code] ?? 'unknown', (err as Error)?.message ?? 'Auth error.');
}

const publicUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email ?? '',
  displayName: user.displayName ?? user.email?.split('@')[0] ?? '',
});

export const firebaseAuthGateway: AuthGateway = {
  async restore() {
    const user = getAuth().currentUser;
    return user ? publicUser(user) : null;
  },

  async signIn(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(getAuth(), email.trim(), password);
      return publicUser(user);
    } catch (err) {
      throw toAuthError(err);
    }
  },

  async register(email, password, displayName) {
    try {
      const { user } = await createUserWithEmailAndPassword(getAuth(), email.trim(), password);
      const name = displayName.trim() || email.split('@')[0];
      await updateProfile(user, { displayName: name });
      return { uid: user.uid, email: user.email ?? email.trim(), displayName: name };
    } catch (err) {
      throw toAuthError(err);
    }
  },

  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(getAuth(), email.trim());
    } catch (err) {
      throw toAuthError(err);
    }
  },

  async signOut() {
    await signOut(getAuth());
  },

  async changePassword(currentPassword, newPassword) {
    const user = getAuth().currentUser;
    if (!user?.email) throw new AuthError('user-not-found', 'No signed-in account.');
    try {
      // Firebase requires a recent sign-in before a sensitive op like this —
      // re-proving the current password is what satisfies that.
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      await updatePassword(user, newPassword);
    } catch (err) {
      throw toAuthError(err);
    }
  },

  async deleteAccount(password) {
    const user = getAuth().currentUser;
    if (!user?.email) throw new AuthError('user-not-found', 'No signed-in account.');
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      await deleteUser(user);
    } catch (err) {
      throw toAuthError(err);
    }
  },
};
