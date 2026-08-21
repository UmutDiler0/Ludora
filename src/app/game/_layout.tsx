import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, Text } from '@/components/ui';
import { PeerAlert } from '@/features/network/PeerAlert';
import { presenceGateway } from '@/services/network/mockPresence';
import { useLocalGame } from '@/stores/localGame';
import { fonts, spacing, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Dev-only: publish a `lost` event for a real seat in the current game, so the
 * peer pop-up can be checked against a name that is actually in the room.
 */
function simulatePeerDrop() {
  const state = useLocalGame.getState().state;
  const other = state?.order.map((uid) => state.players[uid]).find((p) => p.uid !== 'you');
  if (!other) return;
  presenceGateway.emit({
    uid: other.uid,
    displayName: other.displayName,
    kind: 'lost',
    at: Date.now(),
  });
}

/**
 * In-session tab bar (decision D1): Game · Roles · Chat · Log.
 *
 * Chat is omitted here rather than shipped as a dead route — it needs the
 * realtime backend (D10), which is deliberately not wired yet.
 *
 * `header` is shared across all three tabs so there is exactly one back
 * control for the whole session rather than one per screen — this nested
 * Tabs navigator replaces the main tab bar entirely, so without it there was
 * no way out of a game short of finishing it.
 */
export default function GameLayout() {
  const { palette } = useTheme();

  return (
    <>
      <PeerAlert />
      <GameTabs palette={palette} />
    </>
  );
}

function GameTabs({ palette }: { palette: ReturnType<typeof useTheme>['palette'] }) {
  return (
    <Tabs
      screenOptions={{
        header: () => <GameHeader />,
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

function GameHeader() {
  const { palette } = useTheme();
  const router = useRouter();

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        backgroundColor: palette.surface,
        borderBottomWidth: stroke.base,
        borderBottomColor: palette.ink,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        }}>
        <IconButton name="chevron-back" label="Leave game" onPress={leave} />
        {/* Long-press the title in a dev build to fire a peer drop. The real
            events come from the presence gateway, which is silent until §18's
            transport exists — without this there is no way to see the pop-up
            work. Stripped from release builds by the __DEV__ guard. */}
        <Pressable onLongPress={__DEV__ ? simulatePeerDrop : undefined} delayLongPress={600}>
          <Text variant="bodyStrong">Vampire Village</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
