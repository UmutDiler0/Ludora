import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Button, Dialog, DialogActions, Label, Row, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { useConnection } from '@/stores/connection';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { ConnectingSpinner } from './ConnectingSpinner';
import { isInterrupted } from './policy';

/**
 * The blocking connection dialog (docs/ARCHITECTURE.md §14).
 *
 * Mounted once at the root so it covers every screen. It shows only for
 * `reconnecting` and `disconnected` — never for `connecting`, or every cold
 * start would flash it in the half-second before the first probe answers.
 *
 * While reconnecting there is no way to dismiss it, on purpose: the app cannot
 * honour a tap it will not be able to send. Once we have given up, the dialog
 * becomes dismissible, because at that point the user knows more than we do
 * about whether it is worth waiting.
 */
export function ConnectionDialog() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();

  const status = useConnection((s) => s.status);
  const attempt = useConnection((s) => s.attempt);
  const countdown = useConnection((s) => s.countdown);
  const droppedFromGame = useConnection((s) => s.droppedFromGame);
  const dismissed = useConnection((s) => s.dismissed);
  const retry = useConnection((s) => s.retry);
  const dismiss = useConnection((s) => s.dismiss);
  const giveUpNow = useConnection((s) => s.giveUpNow);

  const failed = status === 'disconnected';
  const visible = isInterrupted(status) && !dismissed;

  // Being dropped mid-game leaves the session routes rendering nothing, so
  // leave them. Done here rather than in the store: navigation is a UI
  // concern, and the store must stay testable without a router.
  useEffect(() => {
    if (droppedFromGame) router.replace('/(tabs)');
  }, [droppedFromGame, router]);

  return (
    <Dialog
      visible={visible}
      // Reconnecting has no dismiss; the backdrop tap must not become one.
      onDismiss={failed ? dismiss : () => {}}
      contentKey={failed ? 'failed' : 'trying'}
      label={failed ? t((s) => s.connection.couldNotConnectTitle) : t((s) => s.connection.tryingToConnectTitle)}>
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <ConnectingSpinner failed={failed} />

        <View style={{ gap: spacing.sm, alignItems: 'center' }}>
          <Text variant="heading" center>
            {failed ? t((s) => s.connection.couldNotConnectHeading) : t((s) => s.connection.tryingToConnectHeading)}
          </Text>

          <Text variant="body" color={palette.onSurfaceVariant} center>
            {failed
              ? droppedFromGame
                ? t((s) => s.connection.droppedFromGame)
                : t((s) => s.connection.stoppedTrying)
              : t((s) => s.connection.wentOffline)}
          </Text>
        </View>

        {!failed && (
          <Row gap={spacing.sm}>
            <Label>{t((s) => s.connection.attempt)(attempt)}</Label>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              {t((s) => s.connection.givingUpIn)(countdown)}
            </Text>
          </Row>
        )}
      </View>

      {failed ? (
        <DialogActions
          cancelLabel={t((s) => s.connection.notNow)}
          confirmLabel={t((s) => s.connection.tryAgain)}
          onCancel={dismiss}
          onConfirm={retry}
        />
      ) : (
        // One escape hatch even while blocking: skipping the wait is the only
        // action that does not need the network to work. It ends the outage
        // for real rather than just hiding the dialog, so the consequences —
        // leaving the game, telling the room — are the same either way.
        <Button label={t((s) => s.connection.stopWaiting)} tone="ghost" onPress={giveUpNow} />
      )}
    </Dialog>
  );
}
