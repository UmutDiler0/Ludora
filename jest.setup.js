// AsyncStorage is a native module, so it has no implementation under Jest.
// The package ships an in-memory mock for exactly this; without it any test
// that touches a persisted store fails on import rather than on behaviour.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// @react-native-firebase/auth is a native module too, and unlike AsyncStorage
// ships no jest mock of its own. Worse than a plain missing-native-module
// failure: under Jest it falls back to a *web* implementation that pulls in
// the raw `firebase` JS SDK as untransformed ESM, which crashes on import —
// so any test that merely imports stores/session.ts (which every game store
// does, transitively) fails before a single assertion runs. No test exercises
// real sign-in yet, so a bare stub is enough; `getAuth().currentUser` is the
// only shape `session.ts`'s `restore()` reads at import time.
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  deleteUser: jest.fn(),
  EmailAuthProvider: { credential: jest.fn() },
}));

// @react-native-firebase/database — same native-module problem as auth above.
// Nothing imports services/rooms/firebaseRooms.ts yet (it's written but not
// wired, see docs/firebase.md §1/§2), so this isn't fixing a failure today;
// it's here so wiring it later doesn't repeat this exact debugging pass.
jest.mock('@react-native-firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  get: jest.fn(),
  push: jest.fn(() => ({ key: 'mock-id' })),
  update: jest.fn(),
  onValue: jest.fn(() => () => {}),
}));
