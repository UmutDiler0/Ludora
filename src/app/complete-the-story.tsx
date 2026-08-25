import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Chip, EmptyState, ListRow, Screen, ScreenHeader } from '@/components/ui';
import { ContentTile } from '@/features/games/core/ContentTile';
import { COMPLETE_STORY_ENTRIES } from '@/features/games/story/stories';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Complete the Story's landing screen — the sibling of `/detective-stories`,
 * same shape and same reason: there is no config to collect, only a fragment
 * to pick. A row's subtitle shows the actual one-or-two-sentence opening a
 * player would get, since that fragment *is* the pitch here, not a separate
 * marketing teaser the way Detective's case blurbs are.
 *
 * Rows aren't pressable yet — there is no "find the whole story" screen to
 * send them to, and none should exist until real fragments do (see
 * `features/games/story/stories.ts`).
 */
export default function CompleteTheStory() {
  const router = useRouter();
  const { palette } = useTheme();

  return (
    <Screen>
      <ScreenHeader
        title="Complete the Story"
        subtitle="One or two sentences is all you get. Work out the rest."
        onBack={() => router.back()}
      />

      {COMPLETE_STORY_ENTRIES.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="No stories yet"
          body="Fragments are still being written — free ones and premium ones both. Check back soon."
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {COMPLETE_STORY_ENTRIES.map((story) => (
            <ListRow
              key={story.id}
              leading={<ContentTile id={story.id} icon={story.icon} />}
              title={story.title}
              subtitle={story.opening}
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
