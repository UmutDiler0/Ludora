import type { rooms as en } from '../en/rooms';

export const rooms: typeof en = {
  title: 'Oda Bul',
  subtitle: 'Bir kod gir ya da açık, herkese açık bir odaya katıl.',
  codeLabel: 'Oda kodu',
  codePlaceholder: 'ABC123',
  join: 'Katıl',
  codeNotFound: 'Bu kodla açık bir oda bulunamadı.',
  publicRoomsLabel: 'Herkese açık odalar',
  emptyTitle: 'Henüz herkese açık oda yok',
  emptyBody: "Oyna'dan bir oyun başlat ve Herkese Açık'ı seç — burada görünecek.",
  hostedBy: (name) => `${name} açtı`,
  waiting: 'Bekleniyor',
};
