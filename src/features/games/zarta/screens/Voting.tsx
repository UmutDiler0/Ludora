import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card, Chip, Label, ProgressBar, Row, Screen, Text } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { radius, spacing, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { PassCurtain } from '../../core/PassCurtain';
import type { ZartaPlayerView } from '../state';

/**
 * One player's turn to vote. Rendered fresh for every voter in
 * `pendingVoters`, same hand-off pattern `WritingScreen` uses. The options
 * shown are already the true anonymised set — `view.voteChoices` has no
 * author information at all (see engine.ts's `projectFor`), so there is
 * nothing here to accidentally leak even if a future screen tried to.
 */
export function VotingScreen({
  view,
  onReady,
  onSubmit,
  onTimeUp,
}: {
  view: ZartaPlayerView;
  onReady: () => void;
  onSubmit: (optionId: string) => void;
  onTimeUp: () => void;
}) {
  const { t } = useI18n();
  if (!view.currentVoterUid) return <Screen>{null}</Screen>;

  return (
    <PassCurtain
      uid={view.currentVoterUid}
      name={view.currentVoterName ?? ''}
      subtitle={t((s) => s.zarta.voting.subtitle)}
      buttonLabel={t((s) => s.zarta.voting.passButton)(view.currentVoterName ?? '')}
      onReveal={onReady}>
      <VotingForm view={view} onSubmit={onSubmit} onTimeUp={onTimeUp} />
    </PassCurtain>
  );
}

function VotingForm({
  view,
  onSubmit,
  onTimeUp,
}: {
  view: ZartaPlayerView;
  onSubmit: (optionId: string) => void;
  onTimeUp: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const secondsLeft = useCountdown(view.deadlineAt, onTimeUp);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Chip color={palette.secondary} filled>
          {t((s) => s.zarta.session.round)(view.round, view.totalRounds)}
        </Chip>
        <Text variant="bodyStrong" color={secondsLeft <= 5 ? palette.error : palette.onSurface}>
          {secondsLeft}s
        </Text>
      </Row>
      <ProgressBar
        value={secondsLeft / view.voteSeconds}
        color={secondsLeft <= 5 ? palette.error : palette.secondary}
        height={10}
      />

      <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
        <Label color={palette.onSurfaceVariant}>{t((s) => s.zarta.voting.whichIsTrue)(view.currentVoterName ?? '')}</Label>
        <Text variant="heading" center>
          {view.question}
        </Text>
      </Card>

      <View style={{ gap: spacing.sm, flex: 1 }}>
        {view.voteChoices.map((choice) => (
          <Pressable
            key={choice.id}
            accessibilityRole="button"
            onPress={() => onSubmit(choice.id)}
            style={({ pressed }) => [optionStyle(palette), pressed && { opacity: 0.85 }]}>
            <Text variant="bodyStrong">{choice.text}</Text>
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

function useCountdown(deadlineAt: number, onExpire: () => void): number {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)));

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      return remaining;
    };

    if (tick() <= 0) {
      onExpire();
      return;
    }

    const id = setInterval(() => {
      if (tick() <= 0) {
        clearInterval(id);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineAt]);

  return secondsLeft;
}
