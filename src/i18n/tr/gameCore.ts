import type { gameCore as en } from '../en/gameCore';

export const gameCore: typeof en = {
  players: 'Oyuncular',
  presets: 'Hazır Ayarlar',
  rules: 'Kurallar',
  continueToLobby: 'Lobiye Devam Et',
  fixSetting: 'Başlamadan önce yukarıdaki ayarı düzelt.',
  on: 'Açık',
  off: 'Kapalı',
  roomLobbyTitle: 'Oda Lobisi',
  room: 'Oda',
  localRoom: 'Yerel oda',
  localRoomBody:
    'Aşağıdakilerin hepsi zaten bu cihazda oturuyor. Oyunlar ağ üzerinden oynanabilir hale geldiğinde, oda sahibi başlatana kadar burada odanın dolmasını beklersin.',
  playersCount: (n) => `Oyuncular · ${n}`,
  owner: 'Sahibi',
  ready: 'Hazır',
  ownerThisDevice: 'Sahibi · bu cihaz',
  settings: 'Ayarlar',
  onlyOwnerCanStart: 'Oyunu sadece oda sahibi başlatabilir.',
  startGame: 'Oyunu Başlat',
  presetName: {
    classic: 'Klasik',
    quick: 'Hızlı',
    marathon: 'Maraton',
    extended: 'Uzun',
  },
};
