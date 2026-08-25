import type { onboarding as en } from '../en/onboarding';

export const onboarding: typeof en = {
  skip: 'Atla',
  next: 'İleri',
  getStarted: 'Başla',
  live: 'Canlı',
  playerXp: 'Oyuncu XP',
  level1: 'Sv 1',
  dailyRewards: 'Günlük ödüller',
  plusGold: '+50 altın',
  slides: {
    discover: {
      title: 'Keşfet ve Oyna',
      body: "Vampire Village ve Taboo gibi eşsiz parti oyunlarında binlerce oyuncuya katıl.",
    },
    customize: {
      title: 'Kişiselleştir ve Kazan',
      body: 'Kendine özgü bir kimlik oluştur, her maçta XP ve Altın kazan.',
    },
    compete: {
      title: 'Yarış ve Kazan',
      body: 'Günlük ve haftalık liderlik tablolarında yüksel, özel ödüller kazan.',
    },
  },
};
