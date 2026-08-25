import type { profile as en } from '../en/profile';

export const profile: typeof en = {
  settings: 'Ayarlar',
  guestBanner: 'Misafir olarak geziyorsun',
  guestBannerBody: 'İlerlemeni kaydetmek, Altın ve XP kazanmak, liderlik tablolarında yükselmek için kayıt ol.',
  signUp: 'Kayıt Ol',
  customizeAvatar: 'Avatarı özelleştir',
  level: (n) => `Seviye ${n}`,
  xpFraction: (into, forLevel) => `${into} / ${forLevel} XP`,
  played: 'Oynanan',
  won: 'Kazanılan',
  winRate: 'Kazanma oranı',
  achievements: 'Başarımlar',
  achievementsCompletion: (done, total) => `${total} başarımdan ${done} tanesi kazanıldı`,
  signOut: 'Çıkış yap',
};
