// AsyncStorage is a native module, so it has no implementation under Jest.
// The package ships an in-memory mock for exactly this; without it any test
// that touches a persisted store fails on import rather than on behaviour.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
