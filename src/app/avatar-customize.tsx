import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, Screen, ScreenHeader, Text } from '@/components/ui';
import { AvatarRenderer, ItemThumb } from '@/features/avatar/AvatarRenderer';
import { AVATAR_CATALOGUE, ownsItem, type AvatarItem } from '@/features/avatar/catalogue';
import { SlotTabRow } from '@/features/avatar/SlotTabRow';
import { OPTIONAL_SLOTS, type AvatarSlot } from '@/features/avatar/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useProfile } from '@/stores/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Live avatar builder — equips from what's already owned (bought in the
 * shop), full-body preview up top updates on every tap. No spending happens
 * here; that split keeps "try things on" and "pay for things" as separate,
 * honest actions.
 *
 * `build` is an ordinary tab here rather than a setting hidden somewhere else,
 * which is what makes the sign-up choice genuinely reversible instead of
 * nominally so.
 */
export default function AvatarCustomize() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const [slot, setSlot] = useState<AvatarSlot>('build');

  const { avatar, ownedItemIds } = useProfile();
  const setAvatar = useProfile((s) => s.setAvatar);

  const owned = useMemo(
    () =>
      AVATAR_CATALOGUE.filter((item) => item.slot === slot && ownsItem(item, ownedItemIds)),
    [slot, ownedItemIds],
  );

  const equip = (id: string | null) => setAvatar({ ...avatar, [slot]: id });

  return (
    <Screen>
      <ScreenHeader title={t((s) => s.avatar.customize.title)} onBack={() => router.back()} />

      <View style={{ alignItems: 'center' }}>
        <AvatarRenderer config={avatar} mode="full" size={180} ring={palette.primaryContainer} />
      </View>

      <SlotTabRow value={slot} onChange={setSlot} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Same reason as SlotTabRow: without this the scroller claims the
        // leftover column height and stretches its tiles.
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          gap: spacing.md,
          paddingVertical: spacing.sm,
          paddingRight: spacing.xl,
          alignItems: 'flex-start',
        }}>
        {OPTIONAL_SLOTS.includes(slot) && (
          <OptionTile label={t((s) => s.avatar.customize.none)} selected={avatar[slot] === null} onPress={() => equip(null)} />
        )}
        {owned.map((item) => (
          <OptionTile
            key={item.id}
            item={item}
            selected={avatar[slot] === item.id}
            onPress={() => equip(item.id)}
          />
        ))}
      </ScrollView>

      {owned.length === 0 && (
        <Text variant="caption" color={palette.onSurfaceVariant} center>
          {t((s) => s.avatar.customize.noneOwnedYet)(t((s) => s.avatar.slotLabel)[slot].toLowerCase())}
        </Text>
      )}

      <Button label={t((s) => s.avatar.customize.shopForMore)} tone="ghost" onPress={() => router.push('/avatar-shop')} />
    </Screen>
  );
}

function OptionTile({
  item,
  label,
  selected,
  onPress,
}: {
  item?: AvatarItem;
  label?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item?.name ?? label}
      onPress={onPress}
      style={{ alignItems: 'center', gap: spacing.xs, width: 68 }}>
      {item ? (
        <View
          style={{
            borderRadius: radius.md,
            borderWidth: selected ? stroke.base : 0,
            borderColor: palette.primary,
          }}>
          <ItemThumb item={item} size={64} />
        </View>
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.surfaceLow,
            borderWidth: selected ? stroke.base : stroke.thin,
            borderColor: selected ? palette.primary : palette.ink,
          }}>
          <Text variant="caption" color={palette.onSurfaceVariant}>
            {label}
          </Text>
        </View>
      )}
      <Text variant="caption" numberOfLines={1} style={{ maxWidth: 68 }} center>
        {item?.name ?? label}
      </Text>
    </Pressable>
  );
}
