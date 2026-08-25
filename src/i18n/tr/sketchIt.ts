import type { sketchIt as en } from '../en/sketchIt';

export const sketchIt: typeof en = {
  setup: {
    title: 'Çiz Bil Oyununu Kur',
    subtitle: 'Herkes bir kere çizer — ayarla, sonra odayı başlat.',
    passPhoneBody: 'Telefonu elden ele geçirin — herkes bir kere çizecek.',
    field: {
      roundSeconds: 'Çizim süresi',
    },
    resultSummary: (players, seconds) => `${players} oyuncu, her turda çizmek için ${seconds}sn.`,
  },
  lobby: {
    subtitle: 'Çiz Bil · herkes yerinde, hazır olunca başla.',
    secondsToDraw: (n) => `Her turda çizmek için ${n}sn`,
  },
  session: {
    leaveGame: 'Oyundan çık',
    noGameInProgress: 'Devam eden bir oyun yok',
    startFromPlay: "Oyna sekmesinden bir tane başlat.",
    backToPlay: "Oyna'ya dön",
    round: (round, total) => `${round}. Tur / ${total}`,
  },
  roundIntro: {
    passTo: (name) => `${name}'e geç`,
    lookAway: (name) => `Diğerleri başka yöne baksın — ${name} kelimeyi görmek üzere.`,
    yourWord: 'Kelimen',
    readyStart: 'Herkes hazır — çizime başla',
  },
  drawing: {
    undoLastStroke: 'Son çizgiyi geri al',
    clearCanvas: 'Tuvali temizle',
    color: (c) => `Renk ${c}`,
    brushSize: (n) => `Fırça boyutu ${n}`,
    whosGotIt: 'Kim biliyor?',
  },
  roundRecap: {
    wasDrawing: (name) => `${name} çiziyordu`,
    plusForArtist: (n) => `Ressama +${n}`,
    leaderboard: 'Skor tablosu',
    whoGuessedIt: 'Kim bildi',
    nobodyGuessed: 'Süre bitene kadar kimse bilemedi.',
    seeResults: 'Sonuçları gör',
    passThePhone: 'Telefonu geçir',
  },
  gameOver: {
    draw: 'Berabere',
    gameOver: 'Oyun Bitti',
    tie: 'Berabere kaldınız',
    wins: (name) => `${name} kazandı`,
    finalStandings: 'Son sıralama',
    playAgain: 'Tekrar oyna',
  },
};
