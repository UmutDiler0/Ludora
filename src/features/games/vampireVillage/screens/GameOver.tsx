import { View } from 'react-native';

import { Avatar, Button, Card, Chip, Label, Row, Screen, StatTile, Text } from '@/components/ui';
import { awardForGame } from '@/features/economy/levels';
import { useI18n } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
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
  const { palette, roleColors } = useTheme();
  const { t } = useI18n();

  const youWon = view.winner === view.you.alignment;
  const accent = youWon ? palette.secondary : palette.error;
  const award = awardForGame({ won: youWon, isFirstGameOfDay: false });
  const roleNames = t((s) => s.vampireVillage.role);

  return (
    <Screen>
      <Card accent={accent} style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <Label color={accent} center>
          {youWon ? t((s) => s.vampireVillage.gameOver.victory) : t((s) => s.vampireVillage.gameOver.defeat)}
        </Label>
        <Text variant="hero" color={accent} center>
          {view.winner === 'village' ? t((s) => s.vampireVillage.gameOver.villageHolds) : t((s) => s.vampireVillage.gameOver.villageFalls)}
        </Text>
        <Text variant="body" color={palette.onSurfaceVariant} center>
          {view.winner === 'village'
            ? t((s) => s.vampireVillage.gameOver.everyVampireExiled)
            : t((s) => s.vampireVillage.gameOver.vampiresOutnumber)}
        </Text>
      </Card>

      <Row>
        <StatTile value={`+${award.xp}`} caption={t((s) => s.vampireVillage.gameOver.xpEarned)} color={palette.primary} />
        <StatTile value={`+${award.gold}`} caption={t((s) => s.vampireVillage.gameOver.goldEarned)} color={palette.tertiary} />
        <StatTile value={String(view.round)} caption={t((s) => s.vampireVillage.gameOver.rounds)} />
      </Row>

      <Label>{t((s) => s.vampireVillage.gameOver.finalRoster)}</Label>
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
                  <Text variant="bodyStrong">{p.uid === view.you.uid ? t((s) => s.vampireVillage.gameOver.you) : p.displayName}</Text>
                  <Text variant="caption" color={palette.onSurfaceVariant}>
                    {p.alive ? t((s) => s.vampireVillage.gameOver.survived) : t((s) => s.vampireVillage.gameOver.eliminated)}
                  </Text>
                </View>
                {role && <Chip color={color}>{roleNames[role].name}</Chip>}
              </Row>
            </Card>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      <Button label={t((s) => s.vampireVillage.gameOver.playAgain)} onPress={onPlayAgain} />
    </Screen>
  );
}
