import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, Chip, Label, NumberStepper, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import {
  autoVampireCount,
  DEFAULT_VV_CONFIG,
  validateVVConfig,
  VV_CONFIG_FIELDS,
  VV_MAX_PLAYERS,
  VV_MIN_PLAYERS,
  VV_PRESETS,
  type VVConfig,
} from '@/features/games/vampireVillage/config';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Game Configuration (spec §14) — the room owner's setup screen, reached from
 * Play's "Configure" action before a Vampire Village session starts.
 *
 * Renders straight off `VV_CONFIG_FIELDS`, so adding a config option later is a
 * change to that one array in config.ts, never to this screen. This is the same
 * discipline `VV_CONFIG_FIELDS`'s own comment promises.
 *
 * There is no "room" yet — this drives the local hot-seat game, whose one human
 * player is standing in for the owner a real lobby will eventually have. The
 * config it produces is exactly `VVConfig`, so nothing here changes when the
 * multiplayer lobby lands; only who is allowed to open this screen will.
 */

/** A path into VVConfig, dotted for the one nested group (`durations`). */
type FieldKey = (typeof VV_CONFIG_FIELDS)[number]['key'];

function getField(config: VVConfig, key: FieldKey): number | boolean {
  if (key.startsWith('durations.')) {
    const sub = key.split('.')[1] as keyof VVConfig['durations'];
    return config.durations[sub];
  }
  return config[key as 'vampireCount' | 'enableSeer' | 'enableBodyguard' | 'maxRounds'];
}

function withField(config: VVConfig, key: FieldKey, value: number | boolean): VVConfig {
  if (key.startsWith('durations.')) {
    const sub = key.split('.')[1] as keyof VVConfig['durations'];
    return { ...config, durations: { ...config.durations, [sub]: value as number } };
  }
  return { ...config, [key]: value };
}

const STEP: Partial<Record<FieldKey, number>> = {
  'durations.night': 5,
  'durations.dayDiscussion': 15,
  'durations.dayVote': 5,
};

export default function GameSetup() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();

  const [playerCount, setPlayerCount] = useState(6);
  const [config, setConfig] = useState<VVConfig>(DEFAULT_VV_CONFIG);
  const [preset, setPreset] = useState<keyof typeof VV_PRESETS | 'custom'>('classic');

  const set = (key: FieldKey, value: number | boolean) => {
    setConfig((c) => withField(c, key, value));
    setPreset('custom');
  };

  const applyPreset = (name: keyof typeof VV_PRESETS) => {
    setConfig(VV_PRESETS[name]);
    setPreset(name);
  };

  // Re-validated on every change rather than trusted from the stepper bounds:
  // the automatic vampire count depends on player count too, and the two
  // steppers can only clamp themselves, not each other.
  const result = useMemo(() => validateVVConfig(config), [config]);
  const effectiveVampires =
    config.vampireCount > 0
      ? Math.min(config.vampireCount, Math.floor((playerCount - 1) / 2))
      : autoVampireCount(playerCount);

  const start = () => {
    if (!result.ok) return;
    router.push({
      pathname: '/game-lobby',
      params: { playerCount: String(playerCount), config: JSON.stringify(result.value) },
    });
  };

  return (
    <Screen>
      <ScreenHeader
        title={t((s) => s.vampireVillage.setup.title)}
        subtitle={t((s) => s.vampireVillage.setup.subtitle)}
        onBack={() => router.back()}
      />

      <Card style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>{t((s) => s.gameCore.players)}</Label>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {t((s) => s.common.playersRange)(VV_MIN_PLAYERS, VV_MAX_PLAYERS)}
          </Text>
        </Row>
        <NumberStepper
          value={playerCount}
          min={VV_MIN_PLAYERS}
          max={VV_MAX_PLAYERS}
          onChange={setPlayerCount}
          format={(n) => t((s) => s.common.players)(n)}
        />
        <Text variant="caption" color={palette.onSurfaceVariant}>
          {t((s) => s.vampireVillage.setup.botsNote)(playerCount - 1)}
        </Text>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Label>{t((s) => s.gameCore.presets)}</Label>
        <Row gap={spacing.sm}>
          {(Object.keys(VV_PRESETS) as (keyof typeof VV_PRESETS)[]).map((name) => (
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
              <Text variant="bodyStrong" color={preset === name ? palette.onPrimary : palette.onSurface}>
                {t((s) => s.vampireVillage.setup.preset)[name as 'classic' | 'quick']}
              </Text>
            </Pressable>
          ))}
        </Row>
      </Card>

      <Card style={{ gap: spacing.lg }}>
        <Label>{t((s) => s.gameCore.rules)}</Label>

        {VV_CONFIG_FIELDS.map((field) => {
          const value = getField(config, field.key);
          const label = t((s) => s.vampireVillage.setup.field)[field.key];

          if (field.type === 'bool') {
            return (
              <ToggleRow
                key={field.key}
                label={label}
                value={value as boolean}
                onChange={(v) => set(field.key, v)}
              />
            );
          }

          const numeric = value as number;
          const isVampireCount = field.key === 'vampireCount';
          const hint = field.key === 'vampireCount' ? t((s) => s.vampireVillage.setup.field.vampireCountHint) : undefined;

          return (
            <View key={field.key} style={{ gap: spacing.xs }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Label>{label}</Label>
                {!!hint && (
                  <Text variant="caption" color={palette.onSurfaceVariant}>
                    {hint}
                  </Text>
                )}
              </Row>
              <NumberStepper
                value={numeric}
                min={field.min}
                max={field.max}
                step={STEP[field.key] ?? 1}
                onChange={(v) => set(field.key, v)}
                format={(n) => {
                  if (isVampireCount && n === 0) return t((s) => s.vampireVillage.setup.autoVampires)(effectiveVampires);
                  return field.type === 'seconds' ? `${n}s` : `${n}`;
                }}
              />
            </View>
          );
        })}
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
              ? t((s) => s.vampireVillage.setup.vampiresAmong)(effectiveVampires, playerCount)
              : t((s) => s.gameCore.fixSetting)}
          </Text>
        </Row>
        {!result.ok && (
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {result.error.message}
          </Text>
        )}
      </Card>

      <Button label={t((s) => s.gameCore.continueToLobby)} size="lg" onPress={start} disabled={!result.ok} />
    </Screen>
  );
}

/* -------------------------------------------------------------- controls */

const presetStyle = (p: Palette) => ({
  flex: 1,
  paddingVertical: spacing.md,
  borderRadius: radius.md,
  borderWidth: stroke.thin,
  borderColor: p.ink,
  backgroundColor: p.surface,
  alignItems: 'center' as const,
});

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Label>{label}</Label>
      <Chip color={value ? palette.secondary : palette.onSurfaceVariant} filled={value}>
        {value ? t((s) => s.gameCore.on) : t((s) => s.gameCore.off)}
      </Chip>
    </Pressable>
  );
}
