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

/** Seeded so `x@gmail.com` / `x` signs straight in while the auth screens are still being tested. */
const SEED_ACCOUNT: StoredAccount = {
  uid: 'u_seed_tester',
  email: 'x@gmail.com',
  password: 'x',
  displayName: 'Tester',
};

const EMAIL_RE = /^\S+@\S+$/;
const normalise = (email: string) => email.trim().toLowerCase();
const publicUser = ({ uid, email, displayName }: StoredAccount): AuthUser => ({
  uid,
  email,
  displayName,
});

async function readAccounts(): Promise<StoredAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  if (!raw) {
    await writeAccounts([SEED_ACCOUNT]);
    return [SEED_ACCOUNT];
  }
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

/** The account behind the current session, or a `user-not-found` for a guest/signed-out call. */
async function currentAccount(): Promise<StoredAccount> {
  const uid = await AsyncStorage.getItem(SESSION_KEY);
  const account = uid && (await readAccounts()).find((a) => a.uid === uid);
  if (!account) throw new AuthError('user-not-found', 'No signed-in account.');
  return account;
}

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
    if (password.length < 1) throw new AuthError('weak-password', 'Password required.');

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

  async changePassword(currentPassword, newPassword) {
    await latency();
    const account = await currentAccount();
    if (account.password !== currentPassword) throw new AuthError('wrong-password', 'Incorrect password.');
    if (newPassword.length < 1) throw new AuthError('weak-password', 'Password required.');

    const accounts = await readAccounts();
    await writeAccounts(
      accounts.map((a) => (a.uid === account.uid ? { ...a, password: newPassword } : a)),
    );
  },

  async deleteAccount(password) {
    await latency();
    const account = await currentAccount();
    if (account.password !== password) throw new AuthError('wrong-password', 'Incorrect password.');

    const accounts = await readAccounts();
    await writeAccounts(accounts.filter((a) => a.uid !== account.uid));
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};
