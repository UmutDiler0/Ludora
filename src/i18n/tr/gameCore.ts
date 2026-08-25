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
  roomCodeBody: "Bir arkadaşının bu odayı bulması için bu kodu paylaş, ya da sonra Oyna → Oda Bul üzerinden ara.",
  visibility: {
    title: 'Kimler katılabilir',
    public: 'Herkese Açık',
    publicBody: 'Oda Bul listesinde herkes tarafından görülüp katılınabilir.',
    private: 'Özel',
    privateBody: 'Oda listesinde görünmez — sadece kodla katılınabilir.',
  },
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
