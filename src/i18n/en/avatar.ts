import type { AvatarSlot } from '@/features/avatar/types';

export const avatar = {
  /** Moved out of `types.ts`'s `SLOT_LABELS` once locale mattered — shared by
   *  the shop, customizer and creation screens' tab rows. */
  slotLabel: {
    background: 'Background',
    build: 'Build',
    body: 'Skin',
    face: 'Face',
    eyes: 'Eyes',
    mouth: 'Mouth',
    hair: 'Hair',
    facialHair: 'Beard',
    clothes: 'Top',
    pants: 'Bottoms',
    shoes: 'Shoes',
    hat: 'Hat',
    accessory: 'Accessory',
  } satisfies Record<AvatarSlot, string>,

  shop: {
    title: 'Avatar Shop',
    subtitle: 'Try anything on before you spend.',
    nothingForSale: 'Nothing for sale in this slot yet.',
    itemAccessibility: (name: string, status: string) => `${name}, ${status}`,
    owned: 'Owned',
    on: 'On',
    level: (n: number) => `Lv ${n}`,
    confirmPurchase: 'Confirm purchase',
    itemPreview: 'Item preview',
    preview: 'Preview',
    wearingThis: 'You are wearing this.',
    ownedWearWhenever: 'Owned — wear it whenever you like.',
    unlocksAtLevel: (n: number) => `Unlocks at level ${n}.`,
    costsGoldKeepPlaying: (n: number) => `Costs ${n} gold — keep playing to earn more.`,
    costsGold: (n: number) => `Costs ${n} gold.`,
    close: 'Close',
    alreadyOn: 'Already on',
    wearIt: 'Wear it',
    buyFor: (n: number) => `Buy · ${n}g`,
    buyItem: (name: string) => `Buy ${name}?`,
    goldAmount: (n: number) => `${n} gold`,
    goldLeftAfter: (n: string) => `You will have ${n} gold left, and this piece will be put on straight away.`,
    back: 'Back',
    buyIt: 'Buy it',
  },

  customize: {
    title: 'Customize Avatar',
    none: 'None',
    noneOwnedYet: (slot: string) => `No ${slot} owned yet — visit the shop.`,
    shopForMore: 'Shop for more',
  },

  create: {
    title: 'Make it yours',
    subtitle: 'A quick first pass. You can change every part of this later, and buy more in the shop.',
    buildHint: 'Change this whenever you like — nothing is locked to it.',
    thisIsMe: 'This is me',
    skipForNow: 'Skip for now',
  },
};
