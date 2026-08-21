import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Button, Dialog, Row, Text } from '@/components/ui';
import { presenceGateway } from '@/services/network/mockPresence';
import { PEER_EVENT_COPY, type PeerEventKind } from '@/services/network/types';
import { useLocalGame } from '@/stores/localGame';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/**
 * Tells the room when somebody else drops (docs/ARCHITECTURE.md §14).
 *
 * Mounted inside the game layout rather than at the root: who else is in the
 * room is only meaningful during a session, and a subscription that outlives
 * the screen is exactly what spec §37 forbids.
 *
 * Events arrive through `PresenceGateway`. Today that is the mock, which is
 * silent on a real device because there is no server to hear from — the pop-up
 * is fully wired but cannot fire until §18's transport lands. The dev-only
 * trigger in the game header exists so this path can be exercised meanwhile.
 */
export function PeerAlert() {
  const { palette } = useTheme();

  const event = useLocalGame((s) => s.peerEvents[0] ?? null);
  const notePeerEvent = useLocalGame((s) => s.notePeerEvent);
  const dismissPeerEvent = useLocalGame((s) => s.dismissPeerEvent);

  useEffect(() => presenceGateway.subscribe(notePeerEvent), [notePeerEvent]);

  const tone: Record<PeerEventKind, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    lost: { icon: 'cloud-offline', color: palette.error },
    returned: { icon: 'wifi', color: palette.success },
    left: { icon: 'exit-outline', color: palette.onSurfaceVariant },
  };

  const look = event ? tone[event.kind] : tone.lost;

  return (
    <Dialog
      visible={!!event}
      onDismiss={dismissPeerEvent}
      // Keyed by the event, so a second drop re-pops instead of silently
      // swapping the name inside a dialog the user has already read.
      contentKey={event ? `${event.uid}-${event.at}` : undefined}
      label="Player connection update">
      <Row gap={spacing.lg}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.surfaceHigh,
          }}>
          <Ionicons name={look.icon} size={26} color={look.color} />
        </View>

        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="bodyStrong">{event?.displayName ?? ''}</Text>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {event ? PEER_EVENT_COPY[event.kind](event.displayName) : ''}
          </Text>
        </View>
      </Row>

      <Button label="Got it" onPress={dismissPeerEvent} />
    </Dialog>
  );
}
