import { useEffect, useState, type ReactNode } from 'react';

import { Button, Card, Screen, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The "pass the phone" beat, shared by the writing and voting screens —
 * Zarta's equivalent of Taboo's Turn Intro and Sketch It's Round Intro,
 * except it fires once per player per phase instead of once per round (see
 * engine.ts's file header for why).
 *
 * Deliberately a client-only curtain, not a distinct engine phase: dismissing
 * it dispatches `onReveal` (the `READY` action), which is what actually
 * starts the player's clock. Keyed on `uid` so a new player at the front of
 * the queue always sees the curtain again, even though the component itself
 * never unmounts between turns.
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
