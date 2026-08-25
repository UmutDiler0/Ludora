import type { zarta as en } from '../en/zarta';

export const zarta: typeof en = {
  setup: {
    title: 'Zarta Oyununu Kur',
    subtitle: 'Herkes yalan yazar, herkes oy verir — ayarla, sonra odayı başlat.',
    passPhoneBody: 'Telefonu elden ele geçirin — herkes her turda bir yalan yazar ve oy verir.',
    field: {
      answerSeconds: 'Yalan yazma süresi',
      voteSeconds: 'Oylama süresi',
      totalRounds: 'Oynanacak soru sayısı',
    },
    resultSummary: (players, questions) => `${players} oyuncu, ${questions} soru.`,
  },
  lobby: {
    subtitle: 'Zarta · herkes yerinde, hazır olunca başla.',
    questions: (n) => `${n} soru`,
  },
  session: {
    leaveGame: 'Oyundan çık',
    noGameInProgress: 'Devam eden bir oyun yok',
    startFromPlay: "Oyna sekmesinden bir tane başlat.",
    backToPlay: "Oyna'ya dön",
    round: (round, total) => `${round}. Tur / ${total}`,
  },
  writing: {
    subtitle: 'İnandırıcı bir yalan yaz. Biri kanarsa puan kazanırsın.',
    passButton: (name) => `Ben ${name} — soruyu göster`,
    answerThis: (name) => `${name}, bunu cevapla`,
    yourBluff: 'Yalanın',
    placeholder: 'İnandırıcı bir şeyler yaz…',
    lockIn: 'Cevabımı onayla',
  },
  voting: {
    subtitle: 'Hangi cevabın doğru olduğunu düşünüyorsun?',
    passButton: (name) => `Ben ${name} — cevapları göster`,
    whichIsTrue: (name) => `${name}, hangisi doğru?`,
  },
  roundRecap: {
    theTable: 'Masadakiler',
    writtenBy: (names) => `Yazan: ${names}`,
    pickedBy: (names) => `Seçen: ${names}`,
    pointsThisRound: 'Bu turun puanları',
    nobodyScored: 'Kimse puan alamadı — ya herkes kandı ya da süre yetmedi.',
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
