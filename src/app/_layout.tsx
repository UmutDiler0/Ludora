import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useSession } from '@/stores/session';
import { palette } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout. Holds the native splash until fonts are loaded and the session
 * has been restored, so the app never flashes a signed-out frame at a
 * signed-in user (spec §4: "perform required initialization in the
 * background").
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const status = useSession((s) => s.status);
  const restore = useSession((s) => s.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  const ready = fontsLoaded && status !== 'booting';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: palette.background }} />;
  }

  return (
    <>
      {/* Dark status bar content — the cartoon theme is a light theme. */}
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          animation: 'fade',
        }}
      />
    </>
  );
}
