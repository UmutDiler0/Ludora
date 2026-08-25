import type { leaderboard as en } from '../en/leaderboard';

export const leaderboard: typeof en = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  resetsInDays: (days, hours) => `${days}g ${hours}s sonra sıfırlanır`,
  resetsInHours: (hours) => `${hours}s sonra sıfırlanır`,
  you: 'Sen',
  guestsNotRanked: 'Misafirler sıralamaya girmez',
  guestsNotRankedBody: (period) => `Puan kaydetmek ve ${period.toLowerCase()} sıralamada yükselmek için kayıt ol.`,
  signUp: 'Kayıt Ol',
  yourRank: 'Sıralaman',
  thisWeek: 'Bu hafta',
  thisMonth: 'Bu ay',
};
