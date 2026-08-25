import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Chip, Label, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { t } = useI18n();
  if (!view.nextToRevealUid) return <Screen>{null}</Screen>;

  const name = view.players.find((p) => p.uid === view.nextToRevealUid)?.displayName ?? '';

  return (
    <PassCurtain
      uid={view.nextToRevealUid}
      name={name}
      subtitle={t((s) => s.imposter.roleReveal.subtitle)}
      buttonLabel={t((s) => s.imposter.roleReveal.passButton)(name)}
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
  const { t } = useI18n();
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
        <Label color={palette.onSurfaceVariant}>{t((s) => s.imposter.roleReveal.category)}</Label>
        <Text variant="heading" center>
          {view.categoryName}
        </Text>

        {isImposter ? (
          <>
            <Chip color={palette.error} filled>
              {t((s) => s.imposter.roleReveal.youAreImposter)}
            </Chip>
            <Text
              variant="body"
              color={palette.onSurfaceVariant}
              center
              style={{ paddingHorizontal: spacing.md }}>
              {t((s) => s.imposter.roleReveal.imposterBody)}
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
              {t((s) => s.imposter.roleReveal.crewBody)}
            </Text>
          </>
        )}
      </Card>
      <Button label={t((s) => s.imposter.roleReveal.gotIt)(name)} size="lg" onPress={onContinue} />
    </Screen>
  );
}
