import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { fonts, palette } from '@/theme/tokens';

/**
 * In-session tab bar (decision D1): Game · Roles · Chat · Log.
 *
 * Chat is omitted here rather than shipped as a dead route — it needs the
 * realtime backend (D10), which is deliberately not wired yet.
 */
export default function GameLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.outline,
        tabBarStyle: {
          backgroundColor: palette.surfaceLow,
          borderTopColor: palette.surfaceHigh,
          borderTopWidth: 1,
          height: 78,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.label,
          fontSize: 11,
          letterSpacing: 0.8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Game',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roles"
        options={{
          title: 'Roles',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
