import type { imposter as en } from '../en/imposter';

export const imposter: typeof en = {
  setup: {
    title: 'Sahtekar Oyununu Kur',
    subtitle: 'Bir oyuncu hariç herkes değeri öğrenir — ayarla, sonra odayı başlat.',
    passPhoneBody: 'Açılış için telefonu elden ele geçirin, sonra bırakıp konuşun.',
    field: {
      discussionSeconds: 'Sahtekarı bulma süresi',
    },
    resultSummary: (players) => `${players} oyuncu, bir sahtekar.`,
  },
  lobby: {
    subtitle: 'Sahtekar · herkes yerinde, hazır olunca başla.',
    minutes: (n) => `${n} dk`,
  },
  session: {
    phase: {
      role_reveal: 'Açılış',
      discussion: 'Tartışma',
      voting: 'Oylama',
      game_over: 'Sonuçlar',
    },
    leaveGame: 'Oyundan çık',
    noGameInProgress: 'Devam eden bir oyun yok',
    startFromPlay: "Oyna sekmesinden bir tane başlat.",
    backToPlay: "Oyna'ya dön",
  },
  roleReveal: {
    subtitle: 'Sahtekar hariç herkes gizli değeri öğrenir. Seninkini oku, sonra geçir.',
    passButton: (name) => `Ben ${name} — rolümü göster`,
    category: 'Kategori',
    youAreImposter: 'Sen Sahtekarsın',
    imposterBody: 'Değeri bilmiyorsun. Dikkatli dinle, aranıza karış ve biri seni yakalamadan tahmin etmeye çalış.',
    crewBody: 'Açıkça söyleme — bu masadaki bir oyuncu bunu bilmiyor.',
    gotIt: (name) => `Anladım, ${name} — telefonu geçir`,
  },
  discussion: {
    talkItOut: 'Konuşun',
    talkItOutBody: 'Sahtekar hariç herkes değeri zaten biliyor. Sorular sor, ipucu ver ve kimin bilmediğini bul.',
    atTheTable: 'Masadakiler',
    callVote: 'Oylama Başlat',
    guessUsed: 'Tahmin zaten kullanıldı',
    guessButton: 'Sahtekar: Değeri Tahmin Et',
    guessHint: 'Bunu sadece sahtekar kullanmalı — diğerleri oylamaya odaklansın.',
    guessDialogTitle: (category) => `${category} nedir?`,
    guessDialogSubtitle: 'Sadece bir tahmin hakkın var — dikkatli seç.',
  },
  voting: {
    passButton: (name) => `Ben ${name} — oyumu göster`,
    subtitle: 'Sence sahtekar kim?',
    castAccusation: (name) => `${name}, suçlamanı yap`,
    whoIsImposter: 'Sahtekar kim?',
  },
  gameOver: {
    draw: 'Berabere',
    gameOver: 'Oyun Bitti',
    fallbackName: 'Sahtekar',
    caught: (name) => `${name} yakalandı`,
    fooledEveryone: (name) => `${name} herkesi kandırdı`,
    nobodyFoundOut: 'Kimse bulamadı',
    category: 'Kategori',
    theValue: 'Değer',
    theImposterWas: 'Sahtekar buydu',
    playAgain: 'Tekrar oyna',
  },
};
