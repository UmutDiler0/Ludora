import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { fonts, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * In-session tab bar (decision D1): Game · Roles · Chat · Log.
 *
 * Chat is omitted here rather than shipped as a dead route — it needs the
 * realtime backend (D10), which is deliberately not wired yet.
 */
export default function GameLayout() {
  const { palette } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: palette.surface,
          // Thick ink rule, matching every other surface in the cartoon kit.
          borderTopColor: palette.ink,
          borderTopWidth: stroke.base,
          height: 80,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.label,
          fontSize: 11.5,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Game',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roles"
        options={{
          title: 'Roles',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
