import type { settings as en } from '../en/settings';

export const settings: typeof en = {
  title: 'Ayarlar',
  subtitle: 'Görünüm ve dil',
  appearance: 'Görünüm',
  themeLight: 'Açık',
  themeLightDetail: 'Her zaman açık, kağıt temalı görünüm',
  themeDark: 'Koyu',
  themeDarkDetail: 'Her zaman gece teması',
  themeSystem: 'Telefon ayarını kullan',
  themeSystemDetail: 'Cihazını takip eder, otomatik değişir',
  currentlyShowing: 'Şu an gösterilen',
  currentlyShowingSystem: (scheme) => `Sistem — telefonun ${scheme} olarak ayarlı, o yüzden Ludora da ${scheme}.`,
  currentlyShowingFixed: (scheme) => `${scheme}, telefonundaki ayardan bağımsız olarak.`,
  language: 'Dil',
  languageDetail: "Ludora'nın hangi dilde görüneceğini seç.",
  languageSystem: 'Telefon ayarını kullan',
  languageSystemDetail: (resolved) => `Cihazını takip eder — şu anda ${resolved}`,
  languageEnglish: 'English',
  languageTurkish: 'Türkçe',
};
