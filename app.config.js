/**
 * Dynamic config, not static app.json — `googleServicesFile` needs to read
 * from an environment variable at build time. Both `google-services.json`
 * and `GoogleService-Info.plist` are gitignored (per-developer/per-project
 * credentials, not committed — see docs/firebase.md §1), so EAS Build's
 * remote workers never see the local copies. EAS "file" environment
 * variables solve this: `eas env:create` uploads the file's contents once,
 * and at build time EAS writes it to a temp path and points the env var at
 * that path — which is exactly what `googleServicesFile` needs to resolve to
 * a real path either way, locally or on a build worker.
 *
 * Locally, the env vars are unset, so this falls back to the same relative
 * paths app.json always pointed at — nothing changes for a local build.
 */
module.exports = {
  expo: {
    name: 'Ludora',
    slug: 'Ludora',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'ludora',
    userInterfaceStyle: 'light',
    ios: {
      icon: './assets/expo.icon',
      bundleIdentifier: 'com.ludora.app',
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
    },
    android: {
      package: 'com.ludora.app',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      adaptiveIcon: {
        backgroundColor: '#FFF6E5',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#FFF6E5',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
    ],
    experiments: {
      typedRoutes: false,
      reactCompiler: true,
    },
    splash: {},
    extra: {
      router: {},
      eas: {
        projectId: '74aa8490-bf2c-497b-8c19-8c4ed969cbf8',
      },
    },
  },
};
