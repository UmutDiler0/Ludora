import type { vampireVillage as en } from '../en/vampireVillage';

export const vampireVillage: typeof en = {
  setup: {
    title: 'Oyunu Kur',
    subtitle: 'Vampir Köyü · ayarla, sonra odayı başlat.',
    botsNote: (n) => `Sen, ve masayı dolduran ${n} bot.`,
    preset: { classic: 'Klasik', quick: 'Hızlı' },
    field: {
      vampireCount: 'Vampirler',
      vampireCountHint: '0 = otomatik',
      enableSeer: 'Kahin Olsun',
      enableBodyguard: 'Koruyucu Olsun',
      'durations.night': 'Gece süresi',
      'durations.dayDiscussion': 'Tartışma süresi',
      'durations.dayVote': 'Oylama süresi',
      maxRounds: 'Tur sınırı',
    },
    autoVampires: (n) => `Otomatik (bu gece ${n})`,
    vampiresAmong: (v, total) => `${total} kişiden ${v} tanesi vampir.`,
  },
  lobby: {
    subtitle: 'Vampir Köyü · herkes yerinde, hazır olunca başla.',
    vampiresCount: (v) => `${v} vampir`,
    seer: (on) => `Kahin ${on ? 'açık' : 'kapalı'}`,
    bodyguard: (on) => `Koruyucu ${on ? 'açık' : 'kapalı'}`,
  },

  role: {
    vampire: {
      name: 'Vampir',
      blurb:
        'Her gece, sen ve kovenin bir köylüyü kurban seçip kanını emersiniz. Gündüz aranıza karış — dikkatsiz bir söz seni sürgüne yollar.',
    },
    investigator: {
      name: 'Kahin',
      blurb:
        'Her gece bir oyuncunun ruhuna bakıp gerçek tarafını görebilirsin. Köyü vizyonlarınla yönlendir, ama saklan — vampirler gerçeği arıyor.',
    },
    protector: {
      name: 'Koruyucu',
      blurb: 'Her gece bir oyuncuyu koruma altına alırsın. Vampirler onun peşine düşerse, şafağa kadar hayatta kalır.',
    },
    villager: {
      name: 'Köylü',
      blurb:
        'Özel bir gücün yok — sadece sağduyun var. Dikkatle dinle, iyi tartış, vampirler köyü ele geçirmeden onları sürgüne gönder.',
    },
  },
  alignment: {
    vampires: 'Vampirler',
    village: 'Köy',
  },
  nightAbility: {
    kill: 'Kan Emme',
    investigate: 'Araştırma',
    protect: 'Koruma',
  },

  session: {
    tabGame: 'Oyun',
    tabRoles: 'Roller',
    tabLog: 'Kayıt',
    leaveGame: 'Oyundan çık',
    title: 'Vampir Köyü',
    noGameInProgress: 'Devam eden bir oyun yok',
    disconnectedTitle: 'Bağlantın koptu',
    disconnectedBody: 'Oyun sensiz devam etti. O ana kadarki ilerlemen korundu.',
    startFromHome: 'Ana sayfadan bir tane başlat.',
    backToHome: 'Ana sayfaya dön',
    openChat: 'Sohbeti aç',
    openChatUnread: (n) => `Sohbeti aç, ${n} okunmamış`,
  },

  roleReveal: {
    yourRole: 'Rolün',
    theRole: (name) => name,
    yourCoven: 'Koveninin',
    waitingForOthers: 'Diğerleri bekleniyor…',
    gotIt: 'Anladım',
  },

  night: {
    title: (round) => `${round}. Gece`,
    eliminated: 'Elendin',
    eliminatedBody: 'Oyun dışısın, ama izlemeye devam edebilirsin.',
    sleepTight: 'İyi uykular',
    sleepTightBody: 'Köylülerin gece eylemi yok. Şafağı bekle ve olanlara dikkat et.',
    yourCoven: 'Kovenin:',
    yourself: 'Kendin',
    chosen: 'Seçildi',
    waitingForOthers: 'Diğerleri bekleniyor…',
    prompt: {
      vampire: { title: 'Avını seç', instruction: 'Bu gece kanını emeceğin bir köylü seç.' },
      investigator: { title: 'Bir ruha bak', instruction: 'Tarafını görmek için bir oyuncu seç.' },
      protector: {
        title: 'Nöbet tut',
        instruction: 'Şafağa kadar koruyacağın bir oyuncu seç. Kendini de koruyabilirsin.',
      },
    },
  },

  day: {
    townSquare: 'Meydan',
    subtitle: 'Şüphelendiğin vampirleri tartış ve sürgün etmek için oy ver. Akıllıca seç.',
    eliminatedNotice: 'Elendin. İzleyebilirsin ama oy veremezsin.',
    currentPhase: 'Şu anki aşama',
    discussion: 'Tartışma',
    voting: 'Oylama',
    alive: 'Hayatta',
    eliminated: (roleName) => `Elendi${roleName ? ` · ${roleName}` : ''}`,
    you: 'Sen',
    votesCount: (n) => `${n} oy`,
    vote: 'Oy ver',
    openChat: 'Sohbeti aç',
    openVoting: 'Oylamayı aç',
  },

  gameOver: {
    victory: 'Zafer',
    defeat: 'Yenilgi',
    villageHolds: 'Köy ayakta kaldı',
    villageFalls: 'Köy düştü',
    everyVampireExiled: 'Her vampir sürgün edildi.',
    vampiresOutnumber: 'Vampirler artık yaşayanlardan kalabalık.',
    xpEarned: 'Kazanılan XP',
    goldEarned: 'Kazanılan Altın',
    rounds: 'Tur',
    finalRoster: 'Son kadro',
    you: 'Sen',
    survived: 'Hayatta kaldı',
    eliminated: 'Elendi',
    playAgain: 'Tekrar oyna',
  },

  roleSheet: {
    title: 'Roller',
    subtitle: 'Her rolün ne yapabildiği. Kimde olduğunu çözmek sana kalmış.',
    you: 'Sen',
    nightAction: (action) => `Gece eylemi · ${action}`,
    noNightAction: 'Gece eylemi yok',
  },

  eventLog: {
    title: 'Oyun Kaydı',
    nothingYet: 'Henüz hiçbir şey olmadı.',
    round: (n) => `${n}. Tur`,
  },

  chat: {
    title: {
      afterGame: 'Oyun sonrası',
      village: 'Köy',
      coven: 'Koven',
      townSquare: 'Meydan',
    },
    notice: {
      eliminated: 'Elendin. Odayı takip edebilirsin ama konuşamazsın.',
      notStarted: 'Oda, ilk gece geçtikten sonra açılır.',
      asleep: 'Köy uyuyor. Şafakta tekrar konuşabilirsin.',
    },
    chatSuffix: (title) => `${title} sohbeti`,
    chatLabel: 'Sohbet',
    covenOnly: 'Bunu sadece kovenin duyabilir',
    everyoneCanRead: 'Oyunda kalan herkes bunu okuyabilir',
    closeChat: 'Sohbeti kapat',
    nobodySaidAnything: 'Henüz kimse bir şey söylemedi.',
    chatClosed: 'Sohbet kapalı.',
    speakToCoven: 'Kovenine seslen…',
    saySomething: 'Bir şeyler yaz…',
    message: 'Mesaj',
    sendMessage: 'Mesaj gönder',
  },
};
