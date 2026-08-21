import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import {
  Chip,
  Dialog,
  DialogActions,
  GoldPill,
  Label,
  Row,
  Screen,
  ScreenHeader,
  Text,
} from '@/components/ui';
import { AvatarRenderer, ItemThumb } from '@/features/avatar/AvatarRenderer';
import { isEarnedOnly, itemsForSlot, type AvatarItem } from '@/features/avatar/catalogue';
import { SlotTabRow } from '@/features/avatar/SlotTabRow';
import type { AvatarSlot } from '@/features/avatar/types';
import { useLevel, useProfile } from '@/stores/profile';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/palettes';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Avatar shop — spend gold earned from games on cosmetic pieces per slot.
 *
 * Nothing is bought from the grid. Tapping a tile opens a try-on: the item is
 * composited onto the player's *own* avatar, not shown in isolation, because
 * what a piece looks like next to the rest of your outfit is the only question
 * a shop actually has to answer. Buying is then a second, explicit confirmation
 * that names the price and the balance it leaves behind — gold is earned over
 * many games, and a mis-tap that spends it is not recoverable client-side.
 *
 * Buying equips immediately (decision, not spec): owning a piece and not
 * wearing it is a dead end for a screen whose whole point is "look different
 * now." Starter items (price 0, already owned via profile.ts) never appear
 * here — there is nothing to sell back.
 */

const COLUMNS = 3;

/** What the dialog is currently asking. */
type Sheet = { item: AvatarItem; step: 'preview' | 'confirm' };

export default function AvatarShop() {
  const router = useRouter();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();

  const [slot, setSlot] = useState<AvatarSlot>('hair');
  const [sheet, setSheet] = useState<Sheet | null>(null);

  const { gold, ownedItemIds, avatar } = useProfile();
  const level = useLevel();
  const spendGold = useProfile((s) => s.spendGold);
  const grantItem = useProfile((s) => s.grantItem);
  const setAvatar = useProfile((s) => s.setAvatar);

  // Earned items are excluded explicitly rather than relying on their price
  // being zero, so pricing one by mistake could never put a trophy on sale.
  const items = itemsForSlot(slot).filter((item) => !isEarnedOnly(item) && item.price > 0);

  // Measured rather than expressed as a percentage: three columns plus two
  // gaps inside the screen's own padding never lands on a round percentage,
  // and being a fraction of a pixel out shows up as a ragged right edge.
  const tileSize = (width - spacing.xl * 2 - spacing.sm * (COLUMNS - 1)) / COLUMNS;

  const statusOf = (item: AvatarItem) => ({
    owned: ownedItemIds.includes(item.id),
    equipped: avatar[item.slot] === item.id,
    locked: !!item.requiredLevel && level.level < item.requiredLevel,
    affordable: gold >= item.price,
  });

  const equip = (item: AvatarItem) => setAvatar({ ...avatar, [item.slot]: item.id });

  const confirmPurchase = (item: AvatarItem) => {
    // Re-checked here rather than trusted from the button's disabled state:
    // the dialog can outlive the balance that opened it.
    const { locked, affordable, owned } = statusOf(item);
    if (owned || locked || !affordable) return setSheet(null);
    if (!spendGold(item.price)) return setSheet(null);
    grantItem(item.id);
    equip(item);
    setSheet(null);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Avatar Shop"
        subtitle="Try anything on before you spend."
        onBack={() => router.back()}
        trailing={<GoldPill amount={gold} />}
      />

      <SlotTabRow value={slot} onChange={setSlot} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {items.map((item) => (
          <ShopTile
            key={item.id}
            item={item}
            size={tileSize}
            {...statusOf(item)}
            onPress={() => setSheet({ item, step: 'preview' })}
          />
        ))}
      </View>

      {items.length === 0 && (
        <Text variant="caption" color={palette.onSurfaceVariant} center>
          Nothing for sale in this slot yet.
        </Text>
      )}

      <Dialog
        visible={!!sheet}
        // Keyed by step, so advancing preview → confirm re-pops the card.
        contentKey={sheet ? `${sheet.item.id}-${sheet.step}` : undefined}
        onDismiss={() => setSheet(null)}
        label={sheet?.step === 'confirm' ? 'Confirm purchase' : 'Item preview'}>
        {sheet?.step === 'preview' && (
          <PreviewBody
            item={sheet.item}
            {...statusOf(sheet.item)}
            onClose={() => setSheet(null)}
            onEquip={() => {
              equip(sheet.item);
              setSheet(null);
            }}
            onBuy={() => setSheet({ item: sheet.item, step: 'confirm' })}
          />
        )}

        {sheet?.step === 'confirm' && (
          <ConfirmBody
            item={sheet.item}
            goldAfter={gold - sheet.item.price}
            onCancel={() => setSheet({ item: sheet.item, step: 'preview' })}
            onConfirm={() => confirmPurchase(sheet.item)}
          />
        )}
      </Dialog>
    </Screen>
  );
}

/* ----------------------------------------------------------------- grid */

interface ItemStatus {
  owned: boolean;
  equipped: boolean;
  locked: boolean;
  affordable: boolean;
}

function ShopTile({
  item,
  size,
  owned,
  equipped,
  locked,
  affordable,
  onPress,
}: ItemStatus & { item: AvatarItem; size: number; onPress: () => void }) {
  const { palette } = useTheme();
  // Locked and unaffordable both stay tappable — you can still try them on,
  // and a shop that hides what you are saving towards sells nothing.
  const dimmed = !owned && (locked || !affordable);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${owned ? 'owned' : `${item.price} gold`}`}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          gap: spacing.xs,
          padding: spacing.sm,
          borderRadius: radius.md,
          borderWidth: stroke.base,
          borderColor: equipped ? palette.primary : palette.ink,
          borderBottomWidth: stroke.depth,
          borderBottomColor: equipped ? palette.primary : palette.ink,
          backgroundColor: equipped ? palette.surfaceHigh : palette.surface,
          alignItems: 'center',
        },
        pressed && {
          borderBottomWidth: stroke.depthPressed,
          transform: [{ translateY: stroke.depth - stroke.depthPressed }],
        },
      ]}>
      <View style={{ opacity: dimmed ? 0.5 : 1 }}>
        <ItemThumb item={item} size={size - spacing.sm * 2 - stroke.base * 2} />
      </View>

      <Text variant="caption" numberOfLines={1} center style={{ width: '100%' }}>
        {item.name}
      </Text>

      <TilePrice item={item} owned={owned} equipped={equipped} locked={locked} affordable={affordable} />
    </Pressable>
  );
}

/** One line under each tile: what this item costs you, or that it costs nothing. */
function TilePrice({
  item,
  owned,
  equipped,
  locked,
  affordable,
}: ItemStatus & { item: AvatarItem }) {
  const { palette } = useTheme();

  if (equipped) return <Chip color={palette.primary} filled>On</Chip>;
  if (owned) return <Chip color={palette.secondary}>Owned</Chip>;
  if (locked) {
    return (
      <Row gap={2}>
        <Ionicons name="lock-closed" size={11} color={palette.onSurfaceVariant} />
        <Text variant="label" color={palette.onSurfaceVariant}>
          Lv {item.requiredLevel}
        </Text>
      </Row>
    );
  }

  return (
    <Row gap={2}>
      <Ionicons name="diamond" size={11} color={affordable ? palette.tertiary : palette.onSurfaceVariant} />
      <Text variant="label" color={affordable ? palette.tertiary : palette.onSurfaceVariant}>
        {item.price}
      </Text>
    </Row>
  );
}

/* -------------------------------------------------------------- dialogs */

/** Try-on: the item composited onto the player's current avatar. */
function PreviewBody({
  item,
  owned,
  equipped,
  locked,
  affordable,
  onClose,
  onEquip,
  onBuy,
}: ItemStatus & {
  item: AvatarItem;
  onClose: () => void;
  onEquip: () => void;
  onBuy: () => void;
}) {
  const { palette } = useTheme();
  const avatar = useProfile((s) => s.avatar);

  return (
    <>
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <Label>Preview</Label>
        <AvatarRenderer
          config={{ ...avatar, [item.slot]: item.id }}
          mode="full"
          size={140}
          ring={palette.primaryContainer}
        />
        <Text variant="heading" center>
          {item.name}
        </Text>
        <PreviewStatus item={item} owned={owned} equipped={equipped} locked={locked} affordable={affordable} />
      </View>

      {equipped && <DialogActions cancelLabel="Close" confirmLabel="Already on" onCancel={onClose} onConfirm={onClose} confirmDisabled />}

      {!equipped && owned && (
        <DialogActions cancelLabel="Close" confirmLabel="Wear it" onCancel={onClose} onConfirm={onEquip} />
      )}

      {!owned && (
        <DialogActions
          cancelLabel="Close"
          confirmLabel={`Buy · ${item.price}g`}
          onCancel={onClose}
          onConfirm={onBuy}
          confirmDisabled={locked || !affordable}
        />
      )}
    </>
  );
}

function PreviewStatus({ item, owned, equipped, locked, affordable }: ItemStatus & { item: AvatarItem }) {
  const { palette } = useTheme();

  const line = (color: keyof Palette, text: string) => (
    <Text variant="body" color={palette[color]} center>
      {text}
    </Text>
  );

  if (equipped) return line('primary', 'You are wearing this.');
  if (owned) return line('secondary', 'Owned — wear it whenever you like.');
  if (locked) return line('onSurfaceVariant', `Unlocks at level ${item.requiredLevel}.`);
  if (!affordable) return line('onSurfaceVariant', `Costs ${item.price} gold — keep playing to earn more.`);
  return line('onSurfaceVariant', `Costs ${item.price} gold.`);
}

/** The deliberate second step. Names the price and what it leaves behind. */
function ConfirmBody({
  item,
  goldAfter,
  onCancel,
  onConfirm,
}: {
  item: AvatarItem;
  goldAfter: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { palette } = useTheme();

  return (
    <>
      <Row gap={spacing.lg}>
        <ItemThumb item={item} size={64} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="heading" numberOfLines={2}>
            Buy {item.name}?
          </Text>
          <Row gap={spacing.xs}>
            <Ionicons name="diamond" size={13} color={palette.tertiary} />
            <Text variant="bodyStrong" color={palette.tertiary}>
              {item.price} gold
            </Text>
          </Row>
        </View>
      </Row>

      <Text variant="caption" color={palette.onSurfaceVariant}>
        You will have {goldAfter.toLocaleString()} gold left, and this piece will be put on straight
        away.
      </Text>

      <DialogActions cancelLabel="Back" confirmLabel="Buy it" onCancel={onCancel} onConfirm={onConfirm} />
    </>
  );
}
