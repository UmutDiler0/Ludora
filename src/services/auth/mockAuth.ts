import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthError, type AuthGateway, type AuthUser } from './types';

/**
 * Local-only auth for the UI-first build. Accounts live in AsyncStorage so
 * register → sign out → sign in works across app restarts, which is what makes
 * the auth screens genuinely testable on a device.
 *
 * Deliberately NOT secure: passwords are stored in plaintext because nothing
 * here ever leaves the device and every account is throwaway. When
 * `FirebaseAuthGateway` lands this file is deleted, not hardened.
 */

const ACCOUNTS_KEY = 'ludora.mock.accounts';
const SESSION_KEY = 'ludora.mock.session';

interface StoredAccount {
  uid: string;
  email: string;
  password: string;
  displayName: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalise = (email: string) => email.trim().toLowerCase();
const publicUser = ({ uid, email, displayName }: StoredAccount): AuthUser => ({
  uid,
  email,
  displayName,
});

async function readAccounts(): Promise<StoredAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

const writeAccounts = (accounts: StoredAccount[]) =>
  AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

/** Keeps the mock feeling like a network call so loading states are real. */
const latency = () => new Promise<void>((resolve) => setTimeout(resolve, 350));

export const mockAuthGateway: AuthGateway = {
  async restore() {
    const uid = await AsyncStorage.getItem(SESSION_KEY);
    if (!uid) return null;
    const account = (await readAccounts()).find((a) => a.uid === uid);
    return account ? publicUser(account) : null;
  },

  async signIn(email, password) {
    await latency();
    const account = (await readAccounts()).find((a) => a.email === normalise(email));
    if (!account) throw new AuthError('user-not-found', 'No account for that email.');
    if (account.password !== password) throw new AuthError('wrong-password', 'Incorrect password.');
    await AsyncStorage.setItem(SESSION_KEY, account.uid);
    return publicUser(account);
  },

  async register(email, password, displayName) {
    await latency();
    const clean = normalise(email);
    if (!EMAIL_RE.test(clean)) throw new AuthError('invalid-email', 'Malformed email.');
    if (password.length < 8) throw new AuthError('weak-password', 'Password too short.');

    const accounts = await readAccounts();
    if (accounts.some((a) => a.email === clean)) {
      throw new AuthError('email-in-use', 'Email already registered.');
    }

    const account: StoredAccount = {
      uid: `u_${Date.now().toString(36)}`,
      email: clean,
      password,
      displayName: displayName.trim() || clean.split('@')[0],
    };
    await writeAccounts([...accounts, account]);
    await AsyncStorage.setItem(SESSION_KEY, account.uid);
    return publicUser(account);
  },

  async sendPasswordReset(email) {
    await latency();
    if (!EMAIL_RE.test(normalise(email))) {
      throw new AuthError('invalid-email', 'Malformed email.');
    }
    // Intentionally silent about whether the account exists — the real
    // implementation must not leak account existence either.
  },

  async signOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};
