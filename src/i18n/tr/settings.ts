import type { settings as en } from '../en/settings';

export const settings: typeof en = {
  title: 'Ayarlar',
  subtitle: 'Dil ve hesap',
  language: 'Dil',
  languageDetail: "Ludora'nın hangi dilde görüneceğini seç.",
  languageSystem: 'Telefon ayarını kullan',
  languageSystemDetail: (resolved) => `Cihazını takip eder — şu anda ${resolved}`,
  languageEnglish: 'English',
  languageTurkish: 'Türkçe',

  account: 'Hesap',
  changePassword: 'Şifreyi değiştir',
  changePasswordDetail: 'Giriş yaparken kullandığın şifreyi güncelle.',
  deleteAccount: 'Hesabı sil',
  deleteAccountDetail: 'Bu cihazdaki hesabını ve verilerini kalıcı olarak kaldır.',
  guestAccountNotice: 'Şifre ve hesap ayarlarını yönetmek için gerçek bir hesapla giriş yap.',

  support: 'Destek',
  privacyPolicy: 'Gizlilik politikası',
  privacyPolicyDetail: "Ludora verilerini nasıl kullanıyor.",
  help: 'Yardım ve destek',
  helpDetail: 'Sık sorulan soruların cevapları.',

  deleteAccountDialog: {
    title: 'Hesap silinsin mi?',
    body: 'Bu işlem hesabını ve bu cihazdaki her şeyi — altın, avatar eşyaları, başarımlar — kalıcı olarak siler. Bu işlem geri alınamaz.',
    passwordLabel: 'Şifreni onayla',
    confirm: 'Hesabımı sil',
    cancel: 'Vazgeç',
  },
};
