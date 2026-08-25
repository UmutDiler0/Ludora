import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Chip, Label, Screen, Text } from '@/components/ui';
import { PassCurtain } from '../../core/PassCurtain';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { ImposterPlayerView } from '../state';

/**
 * Pass-and-play role reveal — walks `state.order` one seat at a time via
 * `PassCurtain`, same hand-off beat Zarta's writing/voting screens use.
 * `onReveal` is intentionally a no-op: acking happens only once the player
 * has actually read their role and tapped through (`onAck`), not the moment
 * they dismiss the curtain — acking immediately would advance
 * `nextToRevealUid` before they'd read anything, which resets the curtain
 * (it's keyed on `uid`) and hides their own role out from under them.
 */
export function ImposterRoleRevealScreen({
  view,
  onAck,
}: {
  view: ImposterPlayerView;
  onAck: () => void;
}) {
  if (!view.nextToRevealUid) return <Screen>{null}</Screen>;

  const name = view.players.find((p) => p.uid === view.nextToRevealUid)?.displayName ?? '';

  return (
    <PassCurtain
      uid={view.nextToRevealUid}
      name={name}
      subtitle="Everyone but the imposter learns the secret value. Read yours, then pass it on."
      buttonLabel={`I'm ${name} — show me my role`}
      onReveal={() => {}}>
      <RoleCard name={name} view={view} onContinue={onAck} />
    </PassCurtain>
  );
}

function RoleCard({
  name,
  view,
  onContinue,
}: {
  name: string;
  view: ImposterPlayerView;
  onContinue: () => void;
}) {
  const { palette } = useTheme();
  const isImposter = view.you.isImposter;
  const accent = isImposter ? palette.error : palette.secondary;

  return (
    <Screen>
      <Card
        accent={accent}
        style={{
          alignItems: 'center',
          gap: spacing.lg,
          paddingVertical: spacing.xxl,
          flex: 1,
          justifyContent: 'center',
        }}>
        <Ionicons name={isImposter ? 'help-circle' : 'eye'} size={40} color={accent} />
        <Label color={palette.onSurfaceVariant}>Category</Label>
        <Text variant="heading" center>
          {view.categoryName}
        </Text>

        {isImposter ? (
          <>
            <Chip color={palette.error} filled>
              You are the Imposter
            </Chip>
            <Text
              variant="body"
              color={palette.onSurfaceVariant}
              center
              style={{ paddingHorizontal: spacing.md }}>
              You don&apos;t know the value. Listen close, blend in, and try to guess it before anyone
              catches you.
            </Text>
          </>
        ) : (
          <>
            <Text variant="hero" center color={palette.secondary}>
              {view.value}
            </Text>
            <Text
              variant="body"
              color={palette.onSurfaceVariant}
              center
              style={{ paddingHorizontal: spacing.md }}>
              Don&apos;t say it outright — one player at this table doesn&apos;t know it.
            </Text>
          </>
        )}
      </Card>
      <Button label={`Got it, ${name} — pass the phone`} size="lg" onPress={onContinue} />
    </Screen>
  );
}
