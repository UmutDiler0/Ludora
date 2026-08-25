import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, Text } from '@/components/ui';
import { ChatRoom } from '@/features/games/vampireVillage/screens/Chat';
import { PeerAlert } from '@/features/network/PeerAlert';
import { useI18n } from '@/i18n/I18nProvider';
import { presenceGateway } from '@/services/network/mockPresence';
import { useChat, useUnreadCount } from '@/stores/chat';
import { useLocalGame, useMyView } from '@/stores/localGame';
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
 * In-session tab bar (decision D1): Game · Roles · Log.
 *
 * Chat is not a tab. It is a full-height dialog reached from the header,
 * because it is something you do *while* looking at the game — a tab would
 * make you leave the vote in order to read the argument about it. The room
 * itself is `ChatRoom`; the header only carries the button and the unread mark.
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
      <ChatRoom />
      <GameTabs palette={palette} />
    </>
  );
}

function GameTabs({ palette }: { palette: ReturnType<typeof useTheme>['palette'] }) {
  const { t } = useI18n();
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
          title: t((s) => s.vampireVillage.session.tabGame),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roles"
        options={{
          title: t((s) => s.vampireVillage.session.tabRoles),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: t((s) => s.vampireVillage.session.tabLog),
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

function GameHeader() {
  const { palette } = useTheme();
  const { t } = useI18n();
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
        <IconButton name="chevron-back" label={t((s) => s.vampireVillage.session.leaveGame)} onPress={leave} />
        {/* Long-press the title in a dev build to fire a peer drop. The real
            events come from the presence gateway, which is silent until §18's
            transport exists — without this there is no way to see the pop-up
            work. Stripped from release builds by the __DEV__ guard. */}
        <Pressable
          onLongPress={__DEV__ ? simulatePeerDrop : undefined}
          delayLongPress={600}
          style={{ flex: 1 }}>
          <Text variant="bodyStrong">{t((s) => s.vampireVillage.session.title)}</Text>
        </Pressable>

        <ChatButton />
      </View>
    </SafeAreaView>
  );
}

/**
 * Opens the room, and says how much has been said since you last looked.
 *
 * The count only includes messages you are actually allowed to read — a badge
 * for coven talk you cannot see would send you into an empty room.
 */
function ChatButton() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const view = useMyView();
  const open = useChat((s) => s.open);
  const unread = useUnreadCount(view);

  return (
    <View>
      <IconButton
        name="chatbubbles"
        label={unread > 0 ? t((s) => s.vampireVillage.session.openChatUnread)(unread) : t((s) => s.vampireVillage.session.openChat)}
        onPress={open}
      />
      {unread > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -4,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            borderWidth: stroke.thin,
            borderColor: palette.ink,
            backgroundColor: palette.tertiary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          // Announced by the button's own label instead; a second live region
          // here would read the number twice.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Text variant="label" color={palette.ink} style={{ fontSize: 10 }}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      )}
    </View>
  );
}
