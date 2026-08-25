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

import { ConnectionDialog } from '@/features/network/ConnectionDialog';
import { AchievementBanner } from '@/features/progression/AchievementBanner';
import { I18nProvider } from '@/i18n/I18nProvider';
import { useConnection } from '@/stores/connection';
import { useSession } from '@/stores/session';
import { useSettings } from '@/stores/settings';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { lightPalette } from '@/theme/palettes';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout. Holds the native splash until fonts are loaded, the session is
 * restored, and the saved appearance preference has been read back, so the app
 * never flashes a signed-out frame at a signed-in user — or a light frame at
 * someone who chose dark (spec §4: "perform required initialization in the
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
  const settingsHydrated = useSettings((s) => s.hydrated);

  useEffect(() => {
    void restore();
  }, [restore]);

  const ready = fontsLoaded && status !== 'booting' && settingsHydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    // Pre-theme frame: the preference is not known yet, so this must not
    // commit to either palette's ground. It sits under the native splash.
    return <View style={{ flex: 1, backgroundColor: lightPalette.background }} />;
  }

  return (
    <I18nProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </I18nProvider>
  );
}

/** Inside the provider, so it can react to Light / Dark / System. */
function Shell() {
  const { palette, isDark } = useTheme();
  const startMonitoring = useConnection((s) => s.start);
  const stopMonitoring = useConnection((s) => s.stop);

  // Monitoring runs for the life of the app, not per screen: an outage is not
  // something only one route needs to know about, and restarting the probe on
  // every navigation would reset the grace window mid-outage.
  useEffect(() => {
    startMonitoring();
    return stopMonitoring;
  }, [startMonitoring, stopMonitoring]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          animation: 'fade',
        }}
      />
      {/* Above the navigator, so both cover whatever screen is showing.
          The banner is mounted at the root because an achievement can land
          during a game, on the shop, anywhere — it belongs to the app, not to
          the screen that happened to trigger it. */}
      <AchievementBanner />
      <ConnectionDialog />
    </>
  );
}
