import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { TABS } from '@/constants/app';
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
          height: 72,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.label, fontSize: 10, letterSpacing: 0.6 },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: TABS.home, tabBarIcon: icon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ title: TABS.leaderboard, tabBarIcon: icon('trophy-outline', 'trophy') }}
      />
      <Tabs.Screen
        name="play"
        options={{ title: TABS.play, tabBarIcon: icon('play-circle-outline', 'play-circle') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: TABS.profile, tabBarIcon: icon('person-outline', 'person') }}
      />
    </Tabs>
  );
}
