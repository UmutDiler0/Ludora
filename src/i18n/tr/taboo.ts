import type { taboo as en } from '../en/taboo';

export const taboo: typeof en = {
  team: { A: 'Kırmızı', B: 'Mavi' },
  teamLabel: (name) => `${name} Takımı`,

  setup: {
    title: 'Tabu Oyununu Kur',
    subtitle: 'Kadroyu oluştur, takımlara ayır, sonra odayı başlat.',
    playerNamePlaceholder: 'Oyuncu adı',
    addPlayer: 'Oyuncu ekle',
    removePlayer: (name) => `${name} kaldır`,
    teamCount: (team, n) => `${team} Takımı · ${n}`,
    teamOptionLabel: (team, you) => `${team} Takımı${you ? ', sen' : ''}`,
    field: {
      roundSeconds: 'Tur süresi',
      skipLimit: 'Tur başına pas',
      targetScore: 'Kazanma puanı',
      maxTurns: 'Tur sınırı',
    },
    everyTeamNeedsPlayer: 'Her takımda en az bir oyuncu olmalı.',
    resultSummary: (players, targetScore) => `${players} oyuncu, ${targetScore} puana ilk ulaşan kazanır.`,
  },

  lobby: {
    subtitle: 'Tabu · herkes yerinde, hazır olunca başla.',
    firstTo: (n) => `${n} puana ilk ulaşan`,
    roundSeconds: (n) => `${n}sn turlar`,
  },

  session: {
    leaveGame: 'Oyundan çık',
    noGameInProgress: 'Devam eden bir oyun yok',
    startFromPlay: "Oyna sekmesinden bir tane başlat.",
    backToPlay: "Oyna'ya dön",
  },

  turnIntro: {
    passTo: (name) => `${name}'e geç`,
    everyoneElseReady: (name) =>
      `Diğerleri yüksek sesle tahmin etmeye hazırlansın. ${name}, kelimeyi ya da aşağıdaki yasaklı kelimeleri hiç söylemeden anlatacak.`,
    readyStart: 'Hazırım — süreyi başlat',
  },

  describing: {
    describeThisWord: 'Bu kelimeyi anlat',
    forbiddenWords: 'Yasaklı kelimeler',
    skipsLeft: (n) => `Bu turda ${n} pas hakkın kaldı`,
    skip: 'Pas',
    tabu: 'Tabu',
    correct: 'Doğru',
  },

  turnRecap: {
    teamsTurn: (name) => `${name} Takımı'nın turu`,
    thisTurn: 'Bu tur',
    noCardsResolved: 'Süre bitene kadar hiçbir kart çözülmedi.',
    seeResults: 'Sonuçları gör',
    passThePhone: 'Telefonu geçir',
  },

  gameOver: {
    draw: 'Berabere',
    gameOver: 'Oyun Bitti',
    tie: 'Berabere kaldınız',
    teamWins: (name) => `${name} Takımı kazandı`,
    turnsPlayed: 'Oynanan tur',
    rosters: 'Kadrolar',
    playAgain: 'Tekrar oyna',
  },
};
