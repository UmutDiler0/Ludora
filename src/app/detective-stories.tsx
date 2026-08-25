import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Chip, EmptyState, ListRow, Screen, ScreenHeader } from '@/components/ui';
import { DETECTIVE_STORIES } from '@/features/games/detective/stories';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Detective's landing screen — where every entry point into the game goes
 * instead of a config screen, because there is nothing to configure. Player
 * count and round rules are what the other four games' setup screens exist
 * to collect; Detective's only real choice is *which case*, so that's what
 * this screen asks first.
 *
 * Rows are not pressable yet — there is no case-detail/solving screen to
 * send them to, and none should exist until real cases do (see
 * `features/games/detective/stories.ts`). The list renders the real shape
 * either way, so wiring a row's `onPress` is the only change needed once
 * content lands.
 */
export default function DetectiveStories() {
  const router = useRouter();
  const { palette } = useTheme();

  return (
    <Screen>
      <ScreenHeader
        title="Detective Cases"
        subtitle="Pick a case and work it with the evidence you're given."
        onBack={() => router.back()}
      />

      {DETECTIVE_STORIES.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title="No cases yet"
          body="Cases are still being written — free ones and premium ones both. Check back soon."
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {DETECTIVE_STORIES.map((story) => (
            <ListRow
              key={story.id}
              title={story.title}
              subtitle={story.teaser}
              trailing={
                <Chip color={story.isPremium ? palette.tertiary : palette.secondary} filled={!story.isPremium}>
                  {story.isPremium ? 'Premium' : 'Free'}
                </Chip>
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
