import type { quests as en } from '../en/quests';

export const quests: typeof en = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  today: 'Bugün',
  thisWeek: 'Bu hafta',
  resetsIn: (in_) => `${in_} sonra sıfırlanır`,
  claim: (gold) => `${gold} altın al`,
  collected: 'Alındı',
  items: {
    d_play_1: { name: 'Isınma', description: 'Bir oyun bitir.' },
    d_play_3: { name: 'Üçlü Tehdit', description: 'Üç oyun bitir.' },
    d_win_1: { name: 'Bir Tane Al', description: 'Bir oyun kazan.' },
    d_distinct_2: { name: 'Çeşit Kat', description: 'İki farklı oyun oyna.' },
    d_survive_3: { name: 'Hala Ayaktayım', description: 'Bir oyunda üç tur hayatta kal.' },
    w_play_15: { name: 'Maraton', description: 'On beş oyun bitir.' },
    w_win_7: { name: 'Seri Devam Ediyor', description: 'Yedi oyun kazan.' },
    w_distinct_4: { name: 'Çok Yönlü', description: 'Dört farklı oyun oyna.' },
    w_survive_20: { name: 'Öldürmesi Zor', description: 'Toplamda yirmi tur hayatta kal.' },
  },
};
