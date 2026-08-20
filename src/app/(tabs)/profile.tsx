import { useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  Avatar,
  Button,
  Card,
  GoldPill,
  IconButton,
  Label,
  ProgressBar,
  Row,
  Screen,
  ScreenHeader,
  StatTile,
  Text,
} from '@/components/ui';
import { TABS } from '@/constants/app';
import { useLevel, useProfile, useWinRate } from '@/stores/profile';
import { useSession } from '@/stores/session';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Profile dashboard (spec §34). The avatar, shop, inventory, achievements and
 * history sub-routes land in later batches; this is the hub they hang from and
 * already reads real values out of the profile store.
 */
export default function Profile() {
  const { palette } = useTheme();

  const router = useRouter();
  const { displayName, handle, gold, stats } = useProfile();
  const level = useLevel();
  const winRate = useWinRate();
  const signOut = useSession((s) => s.signOut);

  const leave = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Screen>
      <ScreenHeader
        title={TABS.profile}
        trailing={
          <Row gap={spacing.sm}>
            <GoldPill amount={gold} />
            <IconButton
              name="settings-outline"
              label="Settings"
              onPress={() => router.push('/settings')}
            />
          </Row>
        }
      />

      <Card style={{ gap: spacing.lg }}>
        <Row gap={spacing.lg}>
          <Avatar uid={handle} name={displayName} size={64} ring={palette.primaryContainer} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="heading" numberOfLines={1}>
              {displayName}
            </Text>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              {handle}
            </Text>
          </View>
        </Row>

        <View style={{ gap: spacing.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Label color={palette.primary}>Level {level.level}</Label>
            <Text variant="caption" color={palette.onSurfaceVariant}>
              {level.xpIntoLevel.toLocaleString()} / {level.xpForLevel.toLocaleString()} XP
            </Text>
          </Row>
          <ProgressBar value={level.fraction} />
        </View>
      </Card>

      <Row gap={spacing.sm} style={{ alignItems: 'stretch' }}>
        <StatTile value={String(stats.gamesPlayed)} caption="Played" />
        <StatTile value={String(stats.gamesWon)} caption="Won" color={palette.secondary} />
        <StatTile value={`${winRate}%`} caption="Win rate" color={palette.tertiary} />
      </Row>

      <Button label="Sign out" tone="danger" onPress={leave} />
    </Screen>
  );
}
