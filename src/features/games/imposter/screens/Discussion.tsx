import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  Label,
  ProgressBar,
  Row,
  Screen,
  Text,
} from '@/components/ui';
import { radius, spacing, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { IMPOSTER_CATEGORIES } from '../categories';
import type { ImposterPlayerView } from '../state';

/**
 * The open-floor phase — everyone shares this one screen and talks out loud,
 * so unlike every other phase in this game it deliberately never renders
 * `view.value` (see `localImposter.ts`'s file header for why that would leak
 * it). The candidate values shown in the guess dialog come straight from the
 * public `categories.ts` content rather than `view.poolChoices` — the pool
 * for an already-disclosed category isn't secret, and sourcing it locally
 * means the guess control works no matter which seat turns out to be the
 * imposter, not just whichever seat this device happens to be projecting.
 */
export function ImposterDiscussionScreen({
  view,
  onCallVote,
  onGuess,
  onTimeUp,
}: {
  view: ImposterPlayerView;
  onCallVote: () => void;
  onGuess: (valueId: string) => void;
  onTimeUp: () => void;
}) {
  const { palette } = useTheme();
  const [guessOpen, setGuessOpen] = useState(false);
  const secondsLeft = useCountdown(view.deadlineAt, onTimeUp);
  const category = IMPOSTER_CATEGORIES.find((c) => c.id === view.categoryId);

  const guess = (valueId: string) => {
    setGuessOpen(false);
    onGuess(valueId);
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Chip color={palette.secondary} filled>
          {view.categoryName}
        </Chip>
        <Text variant="bodyStrong" color={secondsLeft <= 20 ? palette.error : palette.onSurface}>
          {formatClock(secondsLeft)}
        </Text>
      </Row>
      <ProgressBar
        value={secondsLeft / view.discussionSeconds}
        color={secondsLeft <= 20 ? palette.error : palette.secondary}
        height={10}
      />

      <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
        <Label color={palette.onSurfaceVariant}>Talk it out</Label>
        <Text variant="body" center>
          Everyone but the imposter already knows the value. Ask questions, drop hints, and figure out who
          doesn&apos;t.
        </Text>
      </Card>

      <Label>At the table</Label>
      <View style={{ gap: spacing.sm }}>
        {view.players.map((p) => (
          <Row key={p.uid} gap={spacing.md}>
            <Avatar uid={p.uid} name={p.displayName} size={36} />
            <Text variant="body">{p.displayName}</Text>
          </Row>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <Button label="Call a Vote" icon="hand-left" size="lg" onPress={onCallVote} />

      <View style={{ gap: spacing.xs }}>
        <Button
          label={view.imposterGuessedWrong ? 'Guess already used' : 'Imposter: Guess the Value'}
          tone="danger"
          onPress={() => setGuessOpen(true)}
          disabled={view.imposterGuessedWrong}
        />
        <Text variant="caption" color={palette.onSurfaceVariant} center>
          Only the imposter should use this — everyone else, focus on the vote.
        </Text>
      </View>

      <Dialog visible={guessOpen} onDismiss={() => setGuessOpen(false)} label="Guess the value">
        <Text variant="heading">What&apos;s the {view.categoryName.toLowerCase()}?</Text>
        <Text variant="caption" color={palette.onSurfaceVariant}>
          One guess only — choose carefully.
        </Text>
        <View style={{ gap: spacing.sm }}>
          {category?.values.map((v) => (
            <Pressable
              key={v.id}
              accessibilityRole="button"
              onPress={() => guess(v.id)}
              style={({ pressed }) => [optionStyle(palette), pressed && { opacity: 0.85 }]}>
              <Text variant="bodyStrong">{v.text}</Text>
            </Pressable>
          ))}
        </View>
      </Dialog>
    </Screen>
  );
}

const optionStyle = (p: Palette) => ({
  padding: spacing.md,
  borderRadius: radius.md,
  borderWidth: stroke.base,
  borderColor: p.ink,
  borderBottomWidth: stroke.depth,
  backgroundColor: p.surface,
});

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Same deadline-driven clock discipline as Zarta's writing/voting screens. */
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
