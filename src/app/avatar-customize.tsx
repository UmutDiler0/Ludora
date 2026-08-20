import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, Screen, ScreenHeader, Text } from '@/components/ui';
import { AvatarRenderer, ItemThumb } from '@/features/avatar/AvatarRenderer';
import { AVATAR_CATALOGUE, type AvatarItem } from '@/features/avatar/catalogue';
import { SlotTabRow } from '@/features/avatar/SlotTabRow';
import { SLOT_LABELS, type AvatarSlot } from '@/features/avatar/types';
import { useProfile } from '@/stores/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, stroke } from '@/theme/tokens';

/** Slots with no starter item — equipping nothing is a valid, meaningful choice. */
const OPTIONAL_SLOTS: AvatarSlot[] = ['hat', 'accessory'];

/**
 * Live avatar builder — equips from what's already owned (bought in the
 * shop), big preview up top updates on every tap. No spending happens here;
 * that split keeps "try things on" and "pay for things" as separate, honest
 * actions.
 */
export default function AvatarCustomize() {
  const router = useRouter();
  const { palette } = useTheme();
  const [slot, setSlot] = useState<AvatarSlot>('hair');

  const { avatar, ownedItemIds } = useProfile();
  const setAvatar = useProfile((s) => s.setAvatar);

  const owned = useMemo(
    () => AVATAR_CATALOGUE.filter((item) => item.slot === slot && ownedItemIds.includes(item.id)),
    [slot, ownedItemIds],
  );

  const equip = (id: string | null) => setAvatar({ ...avatar, [slot]: id });

  return (
    <Screen>
      <ScreenHeader title="Customize Avatar" onBack={() => router.back()} />

      <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
        <AvatarRenderer config={avatar} size={168} ring={palette.primaryContainer} />
      </View>

      <SlotTabRow value={slot} onChange={setSlot} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}>
        {OPTIONAL_SLOTS.includes(slot) && (
          <OptionTile label="None" selected={avatar[slot] === null} onPress={() => equip(null)} />
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
          No {SLOT_LABELS[slot].toLowerCase()} owned yet — visit the shop.
        </Text>
      )}

      <Button label="Shop for more" tone="ghost" onPress={() => router.push('/avatar-shop')} />
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
    <Pressable accessibilityRole="button" onPress={onPress} style={{ alignItems: 'center', gap: spacing.xs, width: 68 }}>
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
            None
          </Text>
        </View>
      )}
      <Text variant="caption" numberOfLines={1} style={{ maxWidth: 68 }} center>
        {item?.name ?? label}
      </Text>
    </Pressable>
  );
}
