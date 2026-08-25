import { useEffect, useState } from 'react';
import { TextInput } from 'react-native';

import { Button, Card, Chip, Label, ProgressBar, Row, Screen, Text } from '@/components/ui';
import { radius, spacing, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { PassCurtain } from '../../core/PassCurtain';
import type { ZartaPlayerView } from '../state';

/**
 * One player's turn to write a bluff. Rendered fresh for every writer in
 * `pendingWriters` — the phone changes hands each time `onSubmit` fires, so
 * this component sees a new `view.currentWriterUid` and, through
 * `PassCurtain`, shows the curtain again before the next person sees the
 * question.
 */
export function WritingScreen({
  view,
  onReady,
  onSubmit,
  onTimeUp,
}: {
  view: ZartaPlayerView;
  onReady: () => void;
  onSubmit: (text: string) => void;
  onTimeUp: () => void;
}) {
  if (!view.currentWriterUid) return <Screen>{null}</Screen>;

  return (
    <PassCurtain
      uid={view.currentWriterUid}
      name={view.currentWriterName ?? ''}
      subtitle="Write a believable lie. If someone falls for it, you score."
      buttonLabel={`I'm ${view.currentWriterName} — show me the question`}
      onReveal={onReady}>
      <WritingForm view={view} onSubmit={onSubmit} onTimeUp={onTimeUp} />
    </PassCurtain>
  );
}

function WritingForm({
  view,
  onSubmit,
  onTimeUp,
}: {
  view: ZartaPlayerView;
  onSubmit: (text: string) => void;
  onTimeUp: () => void;
}) {
  const { palette } = useTheme();
  const [text, setText] = useState('');
  const secondsLeft = useCountdown(view.deadlineAt, onTimeUp);

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Chip color={palette.secondary} filled>
          Round {view.round} / {view.totalRounds}
        </Chip>
        <Text variant="bodyStrong" color={secondsLeft <= 5 ? palette.error : palette.onSurface}>
          {secondsLeft}s
        </Text>
      </Row>
      <ProgressBar
        value={secondsLeft / view.answerSeconds}
        color={secondsLeft <= 5 ? palette.error : palette.secondary}
        height={10}
      />

      <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Label color={palette.onSurfaceVariant}>{view.currentWriterName}, answer this</Label>
        <Text variant="heading" center>
          {view.question}
        </Text>
      </Card>

      <Label>Your bluff</Label>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write something believable…"
        placeholderTextColor={palette.onSurfaceVariant}
        maxLength={60}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
        style={{
          minHeight: 52,
          borderRadius: radius.md,
          borderWidth: stroke.thin,
          borderColor: palette.ink,
          backgroundColor: palette.surface,
          paddingHorizontal: spacing.lg,
          color: palette.onSurface,
        }}
      />

      <Button label="Lock in my answer" size="lg" onPress={submit} disabled={!text.trim()} />
    </Screen>
  );
}

/**
 * Same clock discipline as Taboo's `Describing.tsx` and Sketch It's
 * `Drawing.tsx`: ticks from `deadlineAt` rather than a client-side constant,
 * because the deadline is the authoritative fact. Remounted fresh for every
 * writer (see `PassCurtain`), so `secondsLeft`'s initial value always reads
 * the current turn's own deadline rather than carrying over the last one.
 */
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
