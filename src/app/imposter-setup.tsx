import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, Label, NumberStepper, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import {
  DEFAULT_IMPOSTER_CONFIG,
  IMPOSTER_CONFIG_FIELDS,
  IMPOSTER_MAX_PLAYERS,
  IMPOSTER_MIN_PLAYERS,
  IMPOSTER_PRESETS,
  validateImposterConfig,
  type ImposterConfig,
} from '@/features/games/imposter/config';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Game Configuration for Imposter — same shape every other game's setup
 * screen keeps: player count, presets, then `IMPOSTER_CONFIG_FIELDS`
 * rendered generically.
 */

type FieldKey = (typeof IMPOSTER_CONFIG_FIELDS)[number]['key'];

export default function ImposterSetup() {
  const router = useRouter();
  const { palette } = useTheme();

  const [playerCount, setPlayerCount] = useState(5);
  const [config, setConfig] = useState<ImposterConfig>(DEFAULT_IMPOSTER_CONFIG);
  const [preset, setPreset] = useState<keyof typeof IMPOSTER_PRESETS | 'custom'>('classic');

  const set = (key: FieldKey, value: number) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setPreset('custom');
  };

  const applyPreset = (name: keyof typeof IMPOSTER_PRESETS) => {
    setConfig(IMPOSTER_PRESETS[name]);
    setPreset(name);
  };

  const result = useMemo(() => validateImposterConfig(config), [config]);

  const start = () => {
    if (!result.ok) return;
    router.push({
      pathname: '/imposter-lobby',
      params: { playerCount: String(playerCount), config: JSON.stringify(result.value) },
    });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Set Up Imposter"
        subtitle="Everyone but one player learns the value — set the table, then start the room."
        onBack={() => router.back()}
      />

      <Card style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Players</Label>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {IMPOSTER_MIN_PLAYERS}–{IMPOSTER_MAX_PLAYERS}
          </Text>
        </Row>
        <NumberStepper
          value={playerCount}
          min={IMPOSTER_MIN_PLAYERS}
          max={IMPOSTER_MAX_PLAYERS}
          onChange={setPlayerCount}
          format={(n) => `${n} players`}
        />
        <Text variant="caption" color={palette.onSurfaceVariant}>
          Pass the phone around for the reveal, then put it down and talk.
        </Text>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Label>Presets</Label>
        <Row gap={spacing.sm}>
          {(Object.keys(IMPOSTER_PRESETS) as (keyof typeof IMPOSTER_PRESETS)[]).map((name) => (
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
        {IMPOSTER_CONFIG_FIELDS.map((field) => (
          <View key={field.key} style={{ gap: spacing.xs }}>
            <Label>{field.label}</Label>
            <NumberStepper
              value={config[field.key]}
              min={field.min}
              max={field.max}
              step={15}
              onChange={(v) => set(field.key, v)}
              format={(n) => `${Math.floor(n / 60)}:${(n % 60).toString().padStart(2, '0')}`}
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
              ? `${playerCount} players, one imposter.`
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
