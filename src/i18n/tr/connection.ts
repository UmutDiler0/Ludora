import type { connection as en } from '../en/connection';

export const connection: typeof en = {
  couldNotConnectTitle: 'Bağlanılamadı',
  tryingToConnectTitle: 'Bağlanmaya çalışılıyor',
  couldNotConnectHeading: 'Sunucuya bağlanılamadı',
  tryingToConnectHeading: 'Bağlanmaya çalışılıyor…',
  droppedFromGame: 'Oyundan bağlantın koptu. Diğer oyunculara haber verildi.',
  stoppedTrying: 'Denemeyi bıraktık. Bağlantını kontrol edip tekrar dene.',
  wentOffline: 'Bağlantın gitti. Seni geri getirene kadar bekle.',
  attempt: (n) => `${n}. deneme`,
  givingUpIn: (s) => `· ${s}sn içinde vazgeçiliyor`,
  notNow: 'Şimdi değil',
  tryAgain: 'Tekrar dene',
  stopWaiting: 'Beklemeyi durdur',
  playerConnectionUpdate: 'Oyuncu bağlantı güncellemesi',
  gotIt: 'Anladım',
  peerEvent: {
    lost: (name) => `${name} bağlantıyı kaybetti. Geri dönmesi için bir anı var.`,
    returned: (name) => `${name} geri döndü.`,
    left: (name) => `${name} oyundan ayrıldı.`,
  },
};
