import { useEffect, useState, type ReactNode } from 'react';

import { Button, Card, Screen, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The "pass the phone" beat — Zarta's writing/voting screens and Imposter's
 * role reveal all use it, the shared equivalent of Taboo's Turn Intro and
 * Sketch It's Round Intro for a hand-off that happens more than once per
 * round.
 *
 * Deliberately a client-only curtain, not a distinct engine phase: dismissing
 * it calls `onReveal` (Zarta's `READY` action, Imposter's `ACK_ROLE`), which
 * is what actually starts the player's clock or advances the reveal. Keyed on
 * `uid` so a new player at the front of the queue always sees the curtain
 * again, even though the component itself never unmounts between turns.
 */
export function PassCurtain({
  uid,
  name,
  subtitle,
  buttonLabel,
  onReveal,
  children,
}: {
  uid: string;
  name: string;
  subtitle: string;
  buttonLabel: string;
  onReveal: () => void;
  children: ReactNode;
}) {
  const { palette } = useTheme();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [uid]);

  if (revealed) return <>{children}</>;

  return (
    <Screen>
      <Card
        accent={palette.tertiary}
        style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl, flex: 1, justifyContent: 'center' }}>
        <Text variant="hero" center color={palette.tertiary}>
          Pass to {name}
        </Text>
        <Text variant="body" color={palette.onSurfaceVariant} center style={{ paddingHorizontal: spacing.md }}>
          {subtitle}
        </Text>
      </Card>
      <Button
        label={buttonLabel}
        size="lg"
        onPress={() => {
          onReveal();
          setRevealed(true);
        }}
      />
    </Screen>
  );
}
