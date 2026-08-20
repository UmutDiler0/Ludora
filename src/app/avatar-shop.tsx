import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Chip, GoldPill, ListRow, Screen, ScreenHeader } from '@/components/ui';
import { ItemThumb } from '@/features/avatar/AvatarRenderer';
import { itemsForSlot, type AvatarItem } from '@/features/avatar/catalogue';
import { SlotTabRow } from '@/features/avatar/SlotTabRow';
import type { AvatarSlot } from '@/features/avatar/types';
import { useLevel, useProfile } from '@/stores/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/**
 * Avatar shop — spend gold earned from games on cosmetic pieces per slot.
 * Buying equips immediately (decision, not spec): owning a piece and not
 * wearing it is a dead end for a screen whose whole point is "look different
 * now." Starter items (price 0, already owned via profile.ts) never appear
 * here — there is nothing to sell back.
 */
export default function AvatarShop() {
  const router = useRouter();
  const { palette } = useTheme();
  const [slot, setSlot] = useState<AvatarSlot>('hair');

  const { gold, ownedItemIds, avatar } = useProfile();
  const level = useLevel();
  const spendGold = useProfile((s) => s.spendGold);
  const grantItem = useProfile((s) => s.grantItem);
  const setAvatar = useProfile((s) => s.setAvatar);

  const items = itemsForSlot(slot).filter((item) => item.price > 0);

  const equip = (item: AvatarItem) => setAvatar({ ...avatar, [item.slot]: item.id });

  const buy = (item: AvatarItem) => {
    if (item.requiredLevel && level.level < item.requiredLevel) return;
    if (!spendGold(item.price)) return;
    grantItem(item.id);
    equip(item);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Avatar Shop"
        subtitle="Spend gold you've earned from games on new pieces."
        onBack={() => router.back()}
        trailing={<GoldPill amount={gold} />}
      />

      <SlotTabRow value={slot} onChange={setSlot} />

      <View style={{ gap: spacing.sm }}>
        {items.map((item) => {
          const owned = ownedItemIds.includes(item.id);
          const equipped = avatar[item.slot] === item.id;
          const locked = !!item.requiredLevel && level.level < item.requiredLevel;
          const affordable = gold >= item.price;

          return (
            <View key={item.id} style={{ opacity: !owned && !locked && !affordable ? 0.55 : 1 }}>
              <ListRow
                highlighted={equipped}
                onPress={equipped || locked ? undefined : owned ? () => equip(item) : () => buy(item)}
                leading={<ItemThumb item={item} />}
                title={item.name}
                subtitle={locked ? `Unlocks at Lv ${item.requiredLevel}` : undefined}
                trailing={
                  <Chip color={equipped ? palette.primary : owned ? palette.secondary : palette.tertiary} filled={equipped}>
                    {equipped ? 'Equipped' : owned ? 'Equip' : `${item.price}g`}
                  </Chip>
                }
              />
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
