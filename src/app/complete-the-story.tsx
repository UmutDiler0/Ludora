import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Chip, EmptyState, ListRow, Screen, ScreenHeader } from '@/components/ui';
import { ContentTile } from '@/features/games/core/ContentTile';
import { COMPLETE_STORY_ENTRIES } from '@/features/games/story/stories';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { t } = useI18n();

  return (
    <Screen>
      <ScreenHeader
        title={t((s) => s.story.title)}
        subtitle={t((s) => s.story.subtitle)}
        onBack={() => router.back()}
      />

      {COMPLETE_STORY_ENTRIES.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title={t((s) => s.story.noStoriesYet)}
          body={t((s) => s.story.noStoriesBody)}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {COMPLETE_STORY_ENTRIES.map((entry) => (
            <ListRow
              key={entry.id}
              leading={<ContentTile id={entry.id} icon={entry.icon} />}
              title={entry.title}
              subtitle={entry.opening}
              trailing={
                <Chip color={entry.isPremium ? palette.tertiary : palette.secondary} filled={!entry.isPremium}>
                  {entry.isPremium ? t((s) => s.common.premium) : t((s) => s.common.free)}
                </Chip>
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
