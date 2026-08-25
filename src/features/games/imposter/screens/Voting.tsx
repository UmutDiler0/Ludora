import { Pressable, View } from 'react-native';

import { Card, Label, Row, Screen, Text } from '@/components/ui';
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
  if (!view.currentVoterUid) return <Screen>{null}</Screen>;

  return (
    <PassCurtain
      uid={view.currentVoterUid}
      name={view.currentVoterName ?? ''}
      subtitle="Who do you think is the imposter?"
      buttonLabel={`I'm ${view.currentVoterName} — show me the vote`}
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

  return (
    <Screen>
      <Card style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg }}>
        <Label color={palette.onSurfaceVariant}>{view.currentVoterName}, cast your accusation</Label>
        <Text variant="heading" center>
          Who is the imposter?
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
