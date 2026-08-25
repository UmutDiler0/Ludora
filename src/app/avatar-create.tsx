import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, Label, Row, Screen, Text } from '@/components/ui';
import { AvatarRenderer } from '@/features/avatar/AvatarRenderer';
import { itemsForSlot, ownsItem, type AvatarItem } from '@/features/avatar/catalogue';
import { DEFAULT_AVATAR, type AvatarConfig, type AvatarSlot } from '@/features/avatar/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useProfile } from '@/stores/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, stroke } from '@/theme/tokens';

/**
 * Avatar creation, shown once immediately after registering.
 *
 * Deliberately not the full customizer. It asks the four questions that decide
 * whether the figure looks like *you* — build, skin, hair, top — from the free
 * items everyone already owns, and stops. Sign-up is the wrong moment for a
 * wardrobe: the goal is a player who recognises themselves and gets into a
 * game, not one who spends ten minutes on shoes before playing anything.
 *
 * Everything chosen here is editable afterwards in the customizer, build
 * included, which is why nothing on this screen is presented as permanent.
 */

/** The slots worth asking about at sign-up, in the order they read on the body. */
const STEP_SLOTS: AvatarSlot[] = ['build', 'body', 'hair', 'clothes'];

export default function AvatarCreate() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const slotLabel = t((s) => s.avatar.slotLabel);
  const steps = STEP_SLOTS.map((slot) => ({
    slot,
    title: slotLabel[slot],
    hint: slot === 'build' ? t((s) => s.avatar.create.buildHint) : '',
  }));

  const saved = useProfile((s) => s.avatar);
  const ownedItemIds = useProfile((s) => s.ownedItemIds);
  const setAvatar = useProfile((s) => s.setAvatar);

  const [draft, setDraft] = useState<AvatarConfig>({ ...DEFAULT_AVATAR, ...saved });

  const choose = (slot: AvatarSlot, id: string) => setDraft((d) => ({ ...d, [slot]: id }));

  const done = () => {
    setAvatar(draft);
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Text variant="title">{t((s) => s.avatar.create.title)}</Text>
        <Text variant="body" color={palette.onSurfaceVariant}>
          {t((s) => s.avatar.create.subtitle)}
        </Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <AvatarRenderer config={draft} mode="full" size={190} ring={palette.primaryContainer} />
      </View>

      {steps.map((step) => (
        <View key={step.slot} style={{ gap: spacing.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Label>{step.title}</Label>
            {!!step.hint && (
              <Text variant="caption" color={palette.onSurfaceVariant} style={{ flex: 1 }} numberOfLines={1}>
                {step.hint}
              </Text>
            )}
          </Row>

          <OptionRow
            items={itemsForSlot(step.slot)}
            // Only pieces already owned. Offering items the player cannot have
            // yet would turn the welcome into a storefront.
            available={(item) => ownsItem(item, ownedItemIds)}
            selected={draft[step.slot]}
            onSelect={(id) => choose(step.slot, id)}
            slot={step.slot}
          />
        </View>
      ))}

      <Button label={t((s) => s.avatar.create.thisIsMe)} onPress={done} />
      <Button label={t((s) => s.avatar.create.skipForNow)} tone="ghost" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}

function OptionRow({
  items,
  available,
  selected,
  onSelect,
  slot,
}: {
  items: AvatarItem[];
  available: (item: AvatarItem) => boolean;
  selected: string | null;
  onSelect: (id: string) => void;
  slot: AvatarSlot;
}) {
  const { palette } = useTheme();
  const choices = items.filter(available);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: spacing.sm, alignItems: 'center', paddingRight: spacing.xl }}>
      {choices.map((item) => {
        const active = selected === item.id;

        // Build and skin are better judged as a word and a colour than as a
        // thumbnail — a silhouette shown at 40px reads as a grey blob.
        const swatch = slot === 'body';

        return (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.name}
            onPress={() => onSelect(item.id)}
            style={{
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              borderWidth: active ? stroke.base : stroke.thin,
              borderColor: active ? palette.primary : palette.ink,
              backgroundColor: active ? palette.surfaceHigh : palette.surface,
            }}>
            {swatch && (
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: item.color,
                  borderWidth: stroke.thin,
                  borderColor: palette.ink,
                }}
              />
            )}
            <Text variant="label" color={active ? palette.primary : palette.onSurfaceVariant}>
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
