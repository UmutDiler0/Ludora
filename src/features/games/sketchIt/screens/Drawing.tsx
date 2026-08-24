import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Chip, IconButton, Label, ProgressBar, Row, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';
import type { SketchPlayerView } from '../state';
import { SketchCanvas, type SketchStroke } from './Canvas';
import { BRUSH_COLORS, BRUSH_SIZES } from './shared';

/**
 * The screen the whole feature is built around: a blank page, a palette, a
 * brush, and a clock. Only the artist ever holds the device while this phase
 * is live (see `localSketch.ts`'s file header), so there is one view here,
 * not an artist/guesser split — everyone else in the room is watching this
 * same screen and shouting out guesses, which the artist taps to credit as
 * they land.
 */
export function DrawingScreen({
  view,
  onMarkGuess,
  onTimeUp,
}: {
  view: SketchPlayerView;
  onMarkGuess: (uid: string) => void;
  onTimeUp: () => void;
}) {
  const { palette } = useTheme();
  const secondsLeft = useCountdown(view.deadlineAt, onTimeUp);
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);
  const [color, setColor] = useState(BRUSH_COLORS[0]);
  const [brushWidth, setBrushWidth] = useState<number>(BRUSH_SIZES[1].width);

  // A new artist is a blank page — strokes are ephemeral (see engine.ts's
  // file header), never part of engine state, so they reset per round.
  useEffect(() => {
    setStrokes([]);
  }, [view.round, view.artistUid]);

  return (
    <Screen scroll={false}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Chip color={palette.tertiary} filled>
          Round {view.round} / {view.totalRounds}
        </Chip>
        <Text variant="bodyStrong" color={secondsLeft <= 10 ? palette.error : palette.onSurface}>
          {secondsLeft}s
        </Text>
      </Row>
      <ProgressBar
        value={secondsLeft / view.roundSeconds}
        color={secondsLeft <= 10 ? palette.error : palette.tertiary}
        height={10}
      />

      <SketchCanvas
        strokes={strokes}
        onAddStroke={(s) => setStrokes((prev) => [...prev, s])}
        editable
        color={color}
        brushWidth={brushWidth}
      />

      <Row gap={spacing.xs}>
        <IconButton
          name="arrow-undo"
          label="Undo last stroke"
          onPress={() => setStrokes((prev) => prev.slice(0, -1))}
        />
        <IconButton name="trash" label="Clear canvas" onPress={() => setStrokes([])} />
        <View style={{ flex: 1 }} />
        {BRUSH_SIZES.map((b) => (
          <BrushDot key={b.label} diameter={b.width} active={brushWidth === b.width} onPress={() => setBrushWidth(b.width)} />
        ))}
      </Row>

      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {BRUSH_COLORS.map((c) => (
          <ColorSwatch key={c} color={c} active={color === c} onPress={() => setColor(c)} />
        ))}
      </Row>

      <View style={{ gap: spacing.xs }}>
        <Label>Who&apos;s got it?</Label>
        <Row gap={spacing.xs} style={{ flexWrap: 'wrap' }}>
          {view.guessers.map((g) => (
            <Chip key={g.uid} color={palette.success} filled>
              ✓ {g.displayName}
            </Chip>
          ))}
          {view.waitingOn.map((p) => (
            <Pressable key={p.uid} accessibilityRole="button" onPress={() => onMarkGuess(p.uid)} style={guessChip(palette)}>
              <Text variant="label">{p.displayName}</Text>
            </Pressable>
          ))}
        </Row>
      </View>
    </Screen>
  );
}

/**
 * Ticks from `deadlineAt` rather than counting down from a fixed constant —
 * the same clock discipline `Describing.tsx` uses for Taboo, for the same
 * reason: the deadline is the authoritative fact, not a client-side timer
 * that could drift from it.
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

function ColorSwatch({ color, active, onPress }: { color: string; active: boolean; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Colour ${color}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: color,
        borderWidth: active ? stroke.base : stroke.thin,
        borderColor: active ? palette.primary : palette.ink,
      }}
    />
  );
}

function BrushDot({ diameter, active, onPress }: { diameter: number; active: boolean; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Brush size ${diameter}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={6}
      style={{
        width: 36,
        height: 36,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: active ? stroke.base : stroke.thin,
        borderColor: active ? palette.primary : palette.ink,
        backgroundColor: palette.surface,
      }}>
      <View
        style={{
          width: Math.min(diameter, 20),
          height: Math.min(diameter, 20),
          borderRadius: 10,
          backgroundColor: palette.ink,
        }}
      />
    </Pressable>
  );
}

const guessChip = (p: Palette) => ({
  paddingHorizontal: spacing.md,
  paddingVertical: 5,
  borderRadius: radius.pill,
  borderWidth: stroke.thin,
  borderColor: p.ink,
  backgroundColor: p.surface,
});
