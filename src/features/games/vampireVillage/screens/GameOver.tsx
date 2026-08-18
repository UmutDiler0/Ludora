import { View } from 'react-native';

import { Avatar, Button, Card, Chip, Label, Row, Screen, StatTile, Text } from '@/components/ui';
import { awardForGame } from '@/features/economy/levels';
import { palette, roleColors, spacing } from '@/theme/tokens';
import { ROLES } from '../roles';
import type { VVPlayerView } from '../state';

/**
 * Game Over — the designed "Game Over - Victory" screen.
 *
 * Awards are computed with the same pure `awardForGame` the server will use
 * (§22.3), so the preview here can never drift from the real payout. It is
 * still only a preview: the client never writes XP or gold (§10.1).
 */
export function GameOverScreen({ view, onPlayAgain }: { view: VVPlayerView; onPlayAgain: () => void }) {
  const youWon = view.winner === view.you.alignment;
  const accent = youWon ? palette.secondary : palette.error;
  const award = awardForGame({ won: youWon, isFirstGameOfDay: false });

  return (
    <Screen>
      <Card accent={accent} style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <Label color={accent} center>
          {youWon ? 'Victory' : 'Defeat'}
        </Label>
        <Text variant="hero" color={accent} center>
          {view.winner === 'village' ? 'The village holds' : 'The village falls'}
        </Text>
        <Text variant="body" color={palette.onSurfaceVariant} center>
          {view.winner === 'village'
            ? 'Every vampire has been exiled.'
            : 'The vampires now outnumber the living.'}
        </Text>
      </Card>

      <Row>
        <StatTile value={`+${award.xp}`} caption="XP earned" color={palette.primary} />
        <StatTile value={`+${award.gold}`} caption="Gold earned" color={palette.tertiary} />
        <StatTile value={String(view.round)} caption="Rounds" />
      </Row>

      <Label>Final roster</Label>
      <View style={{ gap: spacing.sm }}>
        {view.players.map((p) => {
          const role = p.role;
          const color = role ? roleColors[role] : palette.onSurfaceVariant;
          const won = role ? ROLES[role].alignment === view.winner : false;
          return (
            <Card key={p.uid} style={{ paddingVertical: spacing.md }}>
              <Row>
                <Avatar uid={p.uid} name={p.displayName} dimmed={!p.alive} ring={won ? color : undefined} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{p.uid === view.you.uid ? 'You' : p.displayName}</Text>
                  <Text variant="caption" color={palette.onSurfaceVariant}>
                    {p.alive ? 'Survived' : 'Eliminated'}
                  </Text>
                </View>
                {role && <Chip color={color}>{ROLES[role].name}</Chip>}
              </Row>
            </Card>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      <Button label="Play again" onPress={onPlayAgain} />
    </Screen>
  );
}
