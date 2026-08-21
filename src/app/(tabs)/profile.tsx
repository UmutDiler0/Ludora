import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import {
  Button,
  Card,
  GoldPill,
  IconButton,
  Label,
  ListRow,
  ProgressBar,
  Row,
  Screen,
  ScreenHeader,
  StatTile,
  Text,
} from '@/components/ui';
import { TABS } from '@/constants/app';
import { AvatarRenderer } from '@/features/avatar/AvatarRenderer';
import { completionOf } from '@/features/progression/achievements';
import { useLevel, useProfile, useWinRate } from '@/stores/profile';
import { useProgression } from '@/stores/progression';
import { useSession } from '@/stores/session';
import { radius, spacing, stroke } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Profile dashboard (spec §34). The avatar, shop, inventory, achievements and
 * history sub-routes land in later batches; this is the hub they hang from and
 * already reads real values out of the profile store.
 */
export default function Profile() {
  const { palette } = useTheme();

  const router = useRouter();
  const { displayName, handle, gold, stats, avatar } = useProfile();
  const level = useLevel();
  const winRate = useWinRate();
  const completion = completionOf(useProgression((s) => s.unlocked));
  const { signOut, isGuest } = useSession();

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

      {isGuest && (
        <Card accent={palette.primary} style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">You&apos;re browsing as a guest</Text>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            Sign up to save your progress, earn Gold and XP, and climb the leaderboards.
          </Text>
          <Button label="Sign Up" onPress={() => router.push('/(auth)/register')} />
        </Card>
      )}

      <Card style={{ gap: spacing.lg }}>
        <Row gap={spacing.lg}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Customize avatar"
            onPress={() => router.push('/avatar-customize')}
            style={{ width: 64, height: 64 }}>
            <AvatarRenderer config={avatar} size={64} ring={palette.primaryContainer} />
            <View
              style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 24,
                height: 24,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: palette.primary,
                borderWidth: stroke.thin,
                borderColor: palette.ink,
              }}>
              <Ionicons name="pencil" size={12} color={palette.onPrimary} />
            </View>
          </Pressable>
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

      <ListRow
        title="Achievements"
        subtitle={`${completion.done} of ${completion.total} earned`}
        accent={palette.medalGold}
        leading={<Ionicons name="trophy" size={22} color={palette.medalGold} />}
        trailing={<Ionicons name="chevron-forward" size={18} color={palette.onSurfaceVariant} />}
        onPress={() => router.push('/achievements')}
      />

      <Button label="Sign out" tone="danger" onPress={leave} />
    </Screen>
  );
}
