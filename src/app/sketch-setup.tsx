import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, Label, NumberStepper, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import {
  DEFAULT_SKETCH_CONFIG,
  SKETCH_CONFIG_FIELDS,
  SKETCH_MAX_PLAYERS,
  SKETCH_MIN_PLAYERS,
  SKETCH_PRESETS,
  validateSketchConfig,
  type SketchConfig,
} from '@/features/games/sketchIt/config';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Game Configuration for Sketch It — reached from Play's Sketch It card and
 * Home's trending strip, exactly the way Vampire Village's `game-setup.tsx`
 * is reached from "Configure the room". Two dials only: how many players and
 * how long each artist gets, which is the whole of what was asked for.
 *
 * Renders `SKETCH_CONFIG_FIELDS` generically, same discipline as every other
 * game's setup screen — adding a rule later is a change to that one array in
 * config.ts, never to this file.
 */

type FieldKey = (typeof SKETCH_CONFIG_FIELDS)[number]['key'];

export default function SketchSetup() {
  const router = useRouter();
  const { palette } = useTheme();

  const [playerCount, setPlayerCount] = useState(4);
  const [config, setConfig] = useState<SketchConfig>(DEFAULT_SKETCH_CONFIG);
  const [preset, setPreset] = useState<keyof typeof SKETCH_PRESETS | 'custom'>('classic');

  const set = (key: FieldKey, value: number) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setPreset('custom');
  };

  const applyPreset = (name: keyof typeof SKETCH_PRESETS) => {
    setConfig(SKETCH_PRESETS[name]);
    setPreset(name);
  };

  const result = useMemo(() => validateSketchConfig(config), [config]);

  const start = () => {
    if (!result.ok) return;
    router.push({
      pathname: '/sketch-lobby',
      params: { playerCount: String(playerCount), config: JSON.stringify(result.value) },
    });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Set Up Sketch It"
        subtitle="Everyone draws once — set the table, then start the room."
        onBack={() => router.back()}
      />

      <Card style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Players</Label>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {SKETCH_MIN_PLAYERS}–{SKETCH_MAX_PLAYERS}
          </Text>
        </Row>
        <NumberStepper
          value={playerCount}
          min={SKETCH_MIN_PLAYERS}
          max={SKETCH_MAX_PLAYERS}
          onChange={setPlayerCount}
          format={(n) => `${n} players`}
        />
        <Text variant="caption" color={palette.onSurfaceVariant}>
          Pass the phone around — everyone gets one turn to draw.
        </Text>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Label>Presets</Label>
        <Row gap={spacing.sm}>
          {(Object.keys(SKETCH_PRESETS) as (keyof typeof SKETCH_PRESETS)[]).map((name) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected: preset === name }}
              onPress={() => applyPreset(name)}
              style={({ pressed }) => [
                presetStyle(palette),
                preset === name && { borderColor: palette.primary, backgroundColor: palette.primaryContainer },
                pressed && { opacity: 0.85 },
              ]}>
              <Text
                variant="bodyStrong"
                color={preset === name ? palette.onPrimary : palette.onSurface}
                style={{ textTransform: 'capitalize' }}>
                {name}
              </Text>
            </Pressable>
          ))}
        </Row>
      </Card>

      <Card style={{ gap: spacing.lg }}>
        <Label>Rules</Label>
        {SKETCH_CONFIG_FIELDS.map((field) => (
          <View key={field.key} style={{ gap: spacing.xs }}>
            <Label>{field.label}</Label>
            <NumberStepper
              value={config[field.key]}
              min={field.min}
              max={field.max}
              step={field.type === 'seconds' ? 15 : 1}
              onChange={(v) => set(field.key, v)}
              format={(n) => (field.type === 'seconds' ? `${n}s` : `${n}`)}
            />
          </View>
        ))}
      </Card>

      <Card accent={result.ok ? palette.secondary : palette.error} style={{ gap: spacing.xs }}>
        <Row gap={spacing.sm}>
          <Ionicons
            name={result.ok ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={result.ok ? palette.secondary : palette.error}
          />
          <Text variant="bodyStrong">
            {result.ok
              ? `${playerCount} players, ${config.roundSeconds}s to draw each turn.`
              : 'Fix the setting above before starting.'}
          </Text>
        </Row>
      </Card>

      <Button label="Continue to Lobby" size="lg" onPress={start} disabled={!result.ok} />
    </Screen>
  );
}

const presetStyle = (p: Palette) => ({
  flex: 1,
  paddingVertical: spacing.md,
  borderRadius: radius.md,
  borderWidth: stroke.thin,
  borderColor: p.ink,
  backgroundColor: p.surface,
  alignItems: 'center' as const,
});
