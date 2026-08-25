import type { auth as en } from '../en/auth';

export const auth: typeof en = {
  login: {
    tagline: 'Arenaya gir. Arkadaşlarınla bağlan.',
    email: 'E-posta',
    emailPlaceholder: 'oyuncu@ludora.games',
    password: 'Şifre',
    forgotPassword: 'Şifreni mi unuttun?',
    signIn: 'Giriş yap',
    playAsGuest: 'Misafir olarak oyna',
    noAccount: 'Hesabın yok mu?',
    signUp: 'Kayıt ol',
  },
  register: {
    tagline: 'Yüksek enerjili sosyal arenaya katıl.',
    createAccount: 'Hesap oluştur',
    subtitle: 'Başlamak için bilgilerini gir.',
    username: 'Kullanıcı adı',
    usernamePlaceholder: 'OyunUstasi99',
    email: 'E-posta',
    emailPlaceholder: 'oyuncu@example.com',
    password: 'Şifre',
    confirmPassword: 'Şifreni onayla',
    passwordsDontMatch: 'Şifreler eşleşmiyor.',
    haveAccount: 'Zaten hesabın var mı?',
    login: 'Giriş yap',
  },
  forgotPassword: {
    back: 'Geri dön',
    checkInbox: 'Gelen kutunu kontrol et',
    checkInboxBody: (email) =>
      `${email} için bir hesap varsa, sıfırlama bağlantısı yola çıktı. Bağlantı bir saat içinde geçersiz olur.`,
    backToSignIn: 'Girişe dön',
    resetPassword: 'Şifreni sıfırla',
    subtitle: 'Şifre sıfırlama bağlantısı almak için e-postanı gir.',
    emailAddress: 'E-posta adresi',
    emailPlaceholder: 'komutan@ludora.games',
    sendResetLink: 'Sıfırlama bağlantısı gönder',
  },
  social: {
    orContinueWith: 'Veya şununla devam et',
    google: 'Google',
    apple: 'Apple',
    notAvailable: 'Sosyal medya ile giriş, sunucu altyapısı hazır olunca aktif olacak.',
    notAvailableLabel: (name) => `${name} ile devam et — henüz kullanılamıyor`,
  },
};
