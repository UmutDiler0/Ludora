import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n/I18nProvider';
import { fonts, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Main tab shell.
 *
 * Four rival tab bars exist across the Stitch designs (docs/ARCHITECTURE.md
 * §1.1) plus a fifth on Global Leaderboards. Decision D1 adopts the spec §3
 * structure — it is the only one that gives the leaderboards an entry point,
 * and leaderboards carry two spec sections and a scheduled backend job.
 * Shop, avatar, inventory, achievements and history all nest under Profil.
 */

type IconName = ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName, active: IconName) {
  function TabIcon({ color, focused, size }: { color: string; focused: boolean; size: number }) {
    return <Ionicons name={focused ? active : name} size={size} color={color} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const labels = t((s) => s.tabs);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.onSurfaceVariant,
        sceneStyle: { backgroundColor: palette.background },
        tabBarStyle: {
          backgroundColor: palette.surface,
          // Thick ink rule, matching every other surface in the cartoon kit.
          borderTopColor: palette.ink,
          borderTopWidth: stroke.base,
          // A fixed height with no allowance for the device's own bottom
          // inset sits the bar's content under Android's gesture/button nav
          // bar — 56 is the tab bar's actual content height, `insets.bottom`
          // is however much room that system nav needs on top of it.
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontFamily: fonts.label, fontSize: 10, letterSpacing: 0.6 },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: labels.home, tabBarIcon: icon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ title: labels.leaderboard, tabBarIcon: icon('trophy-outline', 'trophy') }}
      />
      <Tabs.Screen
        name="play"
        options={{ title: labels.play, tabBarIcon: icon('play-circle-outline', 'play-circle') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: labels.profile, tabBarIcon: icon('person-outline', 'person') }}
      />
    </Tabs>
  );
}
