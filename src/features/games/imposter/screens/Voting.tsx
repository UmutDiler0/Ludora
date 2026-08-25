import { Pressable, View } from 'react-native';

import { Card, Label, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { PassCurtain } from '../../core/PassCurtain';
import { radius, spacing, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import type { ImposterPlayerView } from '../state';

/**
 * One player's turn to accuse. Rendered fresh for every voter in
 * `pendingVoters` behind `PassCurtain`, same hand-off Zarta's voting screen
 * uses — nobody sees who anyone else accused until the vote resolves,
 * which is what keeps this an independent judgment call instead of a
 * bandwagon.
 */
export function ImposterVotingScreen({
  view,
  onSubmit,
}: {
  view: ImposterPlayerView;
  onSubmit: (target: string) => void;
}) {
  const { t } = useI18n();
  if (!view.currentVoterUid) return <Screen>{null}</Screen>;

  return (
    <PassCurtain
      uid={view.currentVoterUid}
      name={view.currentVoterName ?? ''}
      subtitle={t((s) => s.imposter.voting.subtitle)}
      buttonLabel={t((s) => s.imposter.voting.passButton)(view.currentVoterName ?? '')}
      onReveal={() => {}}>
      <VotingForm view={view} onSubmit={onSubmit} />
    </PassCurtain>
  );
}

function VotingForm({
  view,
  onSubmit,
}: {
  view: ImposterPlayerView;
  onSubmit: (target: string) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();

  return (
    <Screen>
      <Card style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg }}>
        <Label color={palette.onSurfaceVariant}>{t((s) => s.imposter.voting.castAccusation)(view.currentVoterName ?? '')}</Label>
        <Text variant="heading" center>
          {t((s) => s.imposter.voting.whoIsImposter)}
        </Text>
      </Card>

      <View style={{ gap: spacing.sm, flex: 1 }}>
        {view.players
          .filter((p) => p.uid !== view.currentVoterUid)
          .map((p) => (
            <Pressable
              key={p.uid}
              accessibilityRole="button"
              onPress={() => onSubmit(p.uid)}
              style={({ pressed }) => [optionStyle(palette), pressed && { opacity: 0.85 }]}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="bodyStrong">{p.displayName}</Text>
              </Row>
            </Pressable>
          ))}
      </View>
    </Screen>
  );
}

const optionStyle = (p: Palette) => ({
  padding: spacing.lg,
  borderRadius: radius.md,
  borderWidth: stroke.base,
  borderColor: p.ink,
  borderBottomWidth: stroke.depth,
  backgroundColor: p.surface,
});
