import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import {
  Button,
  Card,
  IconButton,
  Label,
  NumberStepper,
  Row,
  Screen,
  ScreenHeader,
  Text,
} from '@/components/ui';
import type { PlayerSeat } from '@/features/games/core/types';
import {
  DEFAULT_TABOO_CONFIG,
  TABOO_CONFIG_FIELDS,
  TABOO_MAX_PLAYERS,
  TABOO_MIN_PLAYERS,
  TABOO_PRESETS,
  validateTabooConfig,
  type TabooConfig,
} from '@/features/games/taboo/config';
import type { TabooTeamId } from '@/features/games/taboo/state';
import { useLocalTaboo } from '@/stores/localTaboo';
import { useProfile } from '@/stores/profile';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Game Configuration for Taboo — the room owner's setup screen, same job
 * `game-setup.tsx` does for Vampire Village and reached the same way, from
 * Play's Taboo card.
 *
 * It differs from that screen in exactly the way Taboo differs from Vampire
 * Village: there is a roster to build, not just a headcount, because *who is
 * on which team* is a real choice here rather than something fair to leave to
 * a shuffle. Everything below the roster — round length, skip limit, points to
 * win — still renders straight off `TABOO_CONFIG_FIELDS`, the same discipline
 * `VV_CONFIG_FIELDS` keeps.
 */

type FieldKey = (typeof TABOO_CONFIG_FIELDS)[number]['key'];

interface RosterEntry {
  uid: string;
  name: string;
  team: TabooTeamId;
}

const TEAM_NAME: Record<TabooTeamId, string> = { A: 'Red', B: 'Blue' };
const teamAccent = (p: Palette, id: TabooTeamId) => (id === 'A' ? p.error : p.secondary);

export default function TabooSetup() {
  const router = useRouter();
  const { palette } = useTheme();

  const you = useProfile((s) => s.displayName);
  const newGameWithRoster = useLocalTaboo((s) => s.newGameWithRoster);

  const nextId = useRef(4);
  const [roster, setRoster] = useState<RosterEntry[]>(() => [
    { uid: 'you', name: you, team: 'A' },
    { uid: 'p1', name: 'Player 2', team: 'B' },
    { uid: 'p2', name: 'Player 3', team: 'A' },
    { uid: 'p3', name: 'Player 4', team: 'B' },
  ]);

  const [config, setConfig] = useState<TabooConfig>(DEFAULT_TABOO_CONFIG);
  const [preset, setPreset] = useState<keyof typeof TABOO_PRESETS | 'custom'>('classic');

  const counts = useMemo(
    () => ({
      A: roster.filter((p) => p.team === 'A').length,
      B: roster.filter((p) => p.team === 'B').length,
    }),
    [roster],
  );

  const addPlayer = () => {
    if (roster.length >= TABOO_MAX_PLAYERS) return;
    // Balances onto whichever team is smaller right now, so a room built one
    // tap at a time still ends up close to even without anyone arranging it.
    const team: TabooTeamId = counts.A <= counts.B ? 'A' : 'B';
    const uid = `p${nextId.current++}`;
    setRoster((r) => [...r, { uid, name: `Player ${r.length + 1}`, team }]);
  };

  const removePlayer = (uid: string) => {
    if (roster.length <= TABOO_MIN_PLAYERS) return;
    setRoster((r) => r.filter((p) => p.uid !== uid));
  };

  const renamePlayer = (uid: string, name: string) =>
    setRoster((r) => r.map((p) => (p.uid === uid ? { ...p, name } : p)));

  const setTeam = (uid: string, team: TabooTeamId) =>
    setRoster((r) => r.map((p) => (p.uid === uid ? { ...p, team } : p)));

  const set = (key: FieldKey, value: number) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setPreset('custom');
  };

  const applyPreset = (name: keyof typeof TABOO_PRESETS) => {
    setConfig(TABOO_PRESETS[name]);
    setPreset(name);
  };

  const configResult = useMemo(() => validateTabooConfig(config), [config]);
  // Checked client-side too, not just left to the engine's own rejection —
  // this is the one roster shape that would actually break the game (a
  // describerless team), so it earns an explicit message rather than a
  // generic "couldn't start" surfaced from the engine's INVALID_CONFIG.
  const rosterOk = counts.A > 0 && counts.B > 0;
  const canStart = configResult.ok && rosterOk;

  const start = () => {
    if (!configResult.ok || !rosterOk) return;
    const seats: PlayerSeat[] = roster.map((p) => ({ uid: p.uid, displayName: p.name.trim() || p.name, team: p.team }));
    newGameWithRoster(seats, configResult.value);
    router.push('/taboo');
  };

  return (
    <Screen>
      <ScreenHeader
        title="Set Up Taboo"
        subtitle="Build the roster, split the teams, then start the room."
        onBack={() => router.back()}
      />

      <Card style={{ gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Players</Label>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {roster.length} / {TABOO_MAX_PLAYERS}
          </Text>
        </Row>

        <View style={{ gap: spacing.sm }}>
          {roster.map((p, i) => (
            <RosterRow
              key={p.uid}
              entry={p}
              isYou={i === 0}
              canRemove={roster.length > TABOO_MIN_PLAYERS}
              onRename={(name) => renamePlayer(p.uid, name)}
              onSetTeam={(team) => setTeam(p.uid, team)}
              onRemove={() => removePlayer(p.uid)}
            />
          ))}
        </View>

        <Button
          label="Add player"
          icon="person-add"
          tone="ghost"
          onPress={addPlayer}
          disabled={roster.length >= TABOO_MAX_PLAYERS}
        />

        <Row style={{ justifyContent: 'center' }} gap={spacing.lg}>
          <Text variant="caption" color={teamAccent(palette, 'A')}>
            Team Red · {counts.A}
          </Text>
          <Text variant="caption" color={teamAccent(palette, 'B')}>
            Team Blue · {counts.B}
          </Text>
        </Row>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Label>Presets</Label>
        <Row gap={spacing.sm}>
          {(Object.keys(TABOO_PRESETS) as (keyof typeof TABOO_PRESETS)[]).map((name) => (
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
        {TABOO_CONFIG_FIELDS.map((field) => (
          <View key={field.key} style={{ gap: spacing.xs }}>
            <Label>{field.label}</Label>
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

      <Card accent={canStart ? palette.secondary : palette.error} style={{ gap: spacing.xs }}>
        <Row gap={spacing.sm}>
          <Ionicons
            name={canStart ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={canStart ? palette.secondary : palette.error}
          />
          <Text variant="bodyStrong">
            {!rosterOk
              ? 'Every team needs at least one player.'
              : configResult.ok
                ? `${roster.length} players, first to ${configResult.value.targetScore} wins.`
                : 'Fix the setting above before starting.'}
          </Text>
        </Row>
      </Card>

      <Button label="Start Game" size="lg" onPress={start} disabled={!canStart} />
    </Screen>
  );
}

function RosterRow({
  entry,
  isYou,
  canRemove,
  onRename,
  onSetTeam,
  onRemove,
}: {
  entry: RosterEntry;
  isYou: boolean;
  canRemove: boolean;
  onRename: (name: string) => void;
  onSetTeam: (team: TabooTeamId) => void;
  onRemove: () => void;
}) {
  const { palette } = useTheme();

  return (
    <Row gap={spacing.sm} style={{ alignItems: 'center' }}>
      <TextInput
        value={entry.name}
        onChangeText={onRename}
        placeholder="Player name"
        placeholderTextColor={palette.onSurfaceVariant}
        maxLength={20}
        style={{
          flex: 1,
          minHeight: 40,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          borderWidth: stroke.thin,
          borderColor: palette.ink,
          backgroundColor: palette.surface,
          color: palette.onSurface,
        }}
      />

      <Row gap={4}>
        {(['A', 'B'] as TabooTeamId[]).map((team) => {
          const active = entry.team === team;
          const accent = teamAccent(palette, team);
          return (
            <Pressable
              key={team}
              accessibilityRole="button"
              accessibilityLabel={`Team ${TEAM_NAME[team]}${isYou ? ', you' : ''}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSetTeam(team)}
              style={{
                width: 34,
                height: 34,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: active ? stroke.base : stroke.thin,
                borderColor: active ? accent : palette.ink,
                backgroundColor: active ? accent : palette.surface,
              }}>
              <Text variant="label" color={active ? palette.onPrimary : palette.onSurfaceVariant}>
                {TEAM_NAME[team].charAt(0)}
              </Text>
            </Pressable>
          );
        })}
      </Row>

      {/* You are always seated — removing yourself would leave nobody to hold
          the phone for a screen that only ever renders one seat's view. Hidden
          rather than disabled once the table hits the minimum, so there is no
          dead control sitting in a row that still looks tappable. */}
      {!isYou && canRemove && (
        <IconButton name="close" label={`Remove ${entry.name}`} onPress={onRemove} color={palette.error} />
      )}
    </Row>
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
