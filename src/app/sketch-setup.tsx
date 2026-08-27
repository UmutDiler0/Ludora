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
import { RoomVisibilityCard } from '@/features/games/core/RoomVisibilityCard';
import { useI18n } from '@/i18n/I18nProvider';
import { roomGateway } from '@/services/rooms/firebaseRooms';
import type { RoomVisibility } from '@/services/rooms/types';
import { useProfile } from '@/stores/profile';
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
  const { t } = useI18n();
  const you = useProfile((s) => s.displayName);

  const [playerCount, setPlayerCount] = useState(4);
  const [config, setConfig] = useState<SketchConfig>(DEFAULT_SKETCH_CONFIG);
  const [preset, setPreset] = useState<keyof typeof SKETCH_PRESETS | 'custom'>('classic');
  const [visibility, setVisibility] = useState<RoomVisibility>('public');

  const set = (key: FieldKey, value: number) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setPreset('custom');
  };

  const applyPreset = (name: keyof typeof SKETCH_PRESETS) => {
    setConfig(SKETCH_PRESETS[name]);
    setPreset(name);
  };

  const result = useMemo(() => validateSketchConfig(config), [config]);

  const start = async () => {
    if (!result.ok) return;
    const room = await roomGateway.createRoom({
      gameId: 'drawingGuess',
      hostName: you || t((s) => s.common.you),
      visibility,
      playerCount,
      maxPlayers: SKETCH_MAX_PLAYERS,
      route: '/sketch-lobby',
      params: { playerCount: String(playerCount), config: JSON.stringify(result.value) },
    });
    router.push({ pathname: room.route, params: room.params });
  };

  return (
    <Screen>
      <ScreenHeader
        title={t((s) => s.sketchIt.setup.title)}
        subtitle={t((s) => s.sketchIt.setup.subtitle)}
        onBack={() => router.back()}
      />

      <Card style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>{t((s) => s.gameCore.players)}</Label>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {t((s) => s.common.playersRange)(SKETCH_MIN_PLAYERS, SKETCH_MAX_PLAYERS)}
          </Text>
        </Row>
        <NumberStepper
          value={playerCount}
          min={SKETCH_MIN_PLAYERS}
          max={SKETCH_MAX_PLAYERS}
          onChange={setPlayerCount}
          format={(n) => t((s) => s.common.players)(n)}
        />
        <Text variant="caption" color={palette.onSurfaceVariant}>
          {t((s) => s.sketchIt.setup.passPhoneBody)}
        </Text>
      </Card>

      <RoomVisibilityCard value={visibility} onChange={setVisibility} />

      <Card style={{ gap: spacing.md }}>
        <Label>{t((s) => s.gameCore.presets)}</Label>
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
              <Text variant="bodyStrong" color={preset === name ? palette.onPrimary : palette.onSurface}>
                {t((s) => s.gameCore.presetName)[name as 'classic' | 'quick' | 'marathon']}
              </Text>
            </Pressable>
          ))}
        </Row>
      </Card>

      <Card style={{ gap: spacing.lg }}>
        <Label>{t((s) => s.gameCore.rules)}</Label>
        {SKETCH_CONFIG_FIELDS.map((field) => (
          <View key={field.key} style={{ gap: spacing.xs }}>
            <Label>{t((s) => s.sketchIt.setup.field)[field.key]}</Label>
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
              ? t((s) => s.sketchIt.setup.resultSummary)(playerCount, config.roundSeconds)
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
