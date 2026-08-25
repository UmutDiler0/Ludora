import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, Label, NumberStepper, Row, Screen, ScreenHeader, Text } from '@/components/ui';
import {
  DEFAULT_ZARTA_CONFIG,
  ZARTA_CONFIG_FIELDS,
  ZARTA_MAX_PLAYERS,
  ZARTA_MIN_PLAYERS,
  ZARTA_PRESETS,
  validateZartaConfig,
  type ZartaConfig,
} from '@/features/games/zarta/config';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Game Configuration for Zarta — reached from Play's Zarta card and Home's
 * trending strip, same shape every other game's setup screen keeps: player
 * count, presets, then `ZARTA_CONFIG_FIELDS` rendered generically so a new
 * rule later is a change to config.ts, never to this file.
 */

type FieldKey = (typeof ZARTA_CONFIG_FIELDS)[number]['key'];

export default function ZartaSetup() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();

  const [playerCount, setPlayerCount] = useState(4);
  const [config, setConfig] = useState<ZartaConfig>(DEFAULT_ZARTA_CONFIG);
  const [preset, setPreset] = useState<keyof typeof ZARTA_PRESETS | 'custom'>('classic');

  const set = (key: FieldKey, value: number) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setPreset('custom');
  };

  const applyPreset = (name: keyof typeof ZARTA_PRESETS) => {
    setConfig(ZARTA_PRESETS[name]);
    setPreset(name);
  };

  const result = useMemo(() => validateZartaConfig(config), [config]);

  const start = () => {
    if (!result.ok) return;
    router.push({
      pathname: '/zarta-lobby',
      params: { playerCount: String(playerCount), config: JSON.stringify(result.value) },
    });
  };

  return (
    <Screen>
      <ScreenHeader
        title={t((s) => s.zarta.setup.title)}
        subtitle={t((s) => s.zarta.setup.subtitle)}
        onBack={() => router.back()}
      />

      <Card style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>{t((s) => s.gameCore.players)}</Label>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {t((s) => s.common.playersRange)(ZARTA_MIN_PLAYERS, ZARTA_MAX_PLAYERS)}
          </Text>
        </Row>
        <NumberStepper
          value={playerCount}
          min={ZARTA_MIN_PLAYERS}
          max={ZARTA_MAX_PLAYERS}
          onChange={setPlayerCount}
          format={(n) => t((s) => s.common.players)(n)}
        />
        <Text variant="caption" color={palette.onSurfaceVariant}>
          {t((s) => s.zarta.setup.passPhoneBody)}
        </Text>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Label>{t((s) => s.gameCore.presets)}</Label>
        <Row gap={spacing.sm}>
          {(Object.keys(ZARTA_PRESETS) as (keyof typeof ZARTA_PRESETS)[]).map((name) => (
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
                {t((s) => s.gameCore.presetName)[name as 'classic' | 'quick' | 'marathon']}
              </Text>
            </Pressable>
          ))}
        </Row>
      </Card>

      <Card style={{ gap: spacing.lg }}>
        <Label>{t((s) => s.gameCore.rules)}</Label>
        {ZARTA_CONFIG_FIELDS.map((field) => (
          <View key={field.key} style={{ gap: spacing.xs }}>
            <Label>{t((s) => s.zarta.setup.field)[field.key]}</Label>
            <NumberStepper
              value={config[field.key]}
              min={field.min}
              max={field.max}
              step={field.type === 'seconds' ? 5 : 1}
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
              ? t((s) => s.zarta.setup.resultSummary)(playerCount, config.totalRounds)
              : t((s) => s.gameCore.fixSetting)}
          </Text>
        </Row>
      </Card>

      <Button label={t((s) => s.gameCore.continueToLobby)} size="lg" onPress={start} disabled={!result.ok} />
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
