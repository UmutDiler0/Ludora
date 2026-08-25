export const vampireVillage = {
  setup: {
    title: 'Set Up the Game',
    subtitle: 'Vampire Village · configure it, then start the room.',
    botsNote: (n: number) => `You, plus ${n} bots filling the rest of the table.`,
    preset: { classic: 'Classic', quick: 'Quick' },
    field: {
      vampireCount: 'Vampires',
      vampireCountHint: '0 = automatic',
      enableSeer: 'Include Seer',
      enableBodyguard: 'Include Bodyguard',
      'durations.night': 'Night length',
      'durations.dayDiscussion': 'Discussion length',
      'durations.dayVote': 'Voting length',
      maxRounds: 'Round limit',
    },
    autoVampires: (n: number) => `Auto (${n} tonight)`,
    vampiresAmong: (v: number, total: number) => `${v} vampire${v === 1 ? '' : 's'} among ${total}.`,
  },
  lobby: {
    subtitle: "Vampire Village · everyone's seated, start when ready.",
    vampiresCount: (v: number) => `${v} vampire${v === 1 ? '' : 's'}`,
    seer: (on: boolean) => `Seer ${on ? 'on' : 'off'}`,
    bodyguard: (on: boolean) => `Bodyguard ${on ? 'on' : 'off'}`,
  },

  /** Player-facing role names and blurbs — see `roles.ts`'s own header on why
   *  the internal id (`vampire`/`investigator`/`protector`/`villager`) never
   *  changes even though the displayed name can. */
  role: {
    vampire: {
      name: 'Vampire',
      blurb:
        'Each night, you and your coven choose one villager to drain. By day, blend in — a careless word will see you exiled.',
    },
    investigator: {
      name: 'Seer',
      blurb:
        'Each night, you can look into the soul of one player to reveal their true alignment. Guide the village with your visions, but stay hidden — the vampires are hunting for the truth.',
    },
    protector: {
      name: 'Bodyguard',
      blurb: 'Each night, you stand watch over one player. If the vampires come for them, they survive until dawn.',
    },
    villager: {
      name: 'Villager',
      blurb:
        'You have no special powers — only your judgement. Listen closely, argue well, and vote to exile the vampires before they take the village.',
    },
  },
  alignment: {
    vampires: 'Vampires',
    village: 'Village',
  },
  nightAbility: {
    kill: 'Drain',
    investigate: 'Investigate',
    protect: 'Protect',
  },

  session: {
    tabGame: 'Game',
    tabRoles: 'Roles',
    tabLog: 'Log',
    leaveGame: 'Leave game',
    title: 'Vampire Village',
    noGameInProgress: 'No game in progress',
    disconnectedTitle: 'You were disconnected',
    disconnectedBody: 'The game carried on without you. Your progress up to that point was kept.',
    startFromHome: 'Start one from the home screen.',
    backToHome: 'Back to home',
    openChat: 'Open chat',
    openChatUnread: (n: number) => `Open chat, ${n} unread`,
  },

  roleReveal: {
    yourRole: 'Your Role',
    theRole: (name: string) => `The ${name}`,
    yourCoven: 'Your coven',
    waitingForOthers: 'Waiting for the others…',
    gotIt: 'Got it',
  },

  night: {
    title: (round: number) => `Night ${round}`,
    eliminated: 'Eliminated',
    eliminatedBody: 'You are out of the game, but you can still watch it play out.',
    sleepTight: 'Sleep tight',
    sleepTightBody: 'Villagers have no night action. Wait for dawn and pay attention to what happens.',
    yourCoven: 'Your coven:',
    yourself: 'Yourself',
    chosen: 'Chosen',
    waitingForOthers: 'Waiting for the others…',
    prompt: {
      vampire: { title: 'Choose your prey', instruction: 'Select a villager to drain tonight.' },
      investigator: { title: 'Look into a soul', instruction: 'Select a player to reveal their alignment.' },
      protector: {
        title: 'Stand watch',
        instruction: 'Select a player to protect until dawn. You may guard yourself.',
      },
    },
  },

  day: {
    townSquare: 'Town Square',
    subtitle: 'Discuss and vote to exile suspected vampires. Choose wisely.',
    eliminatedNotice: 'You have been eliminated. You can watch, but not vote.',
    currentPhase: 'Current phase',
    discussion: 'Discussion',
    voting: 'Voting',
    alive: 'Alive',
    eliminated: (roleName?: string) => `Eliminated${roleName ? ` · ${roleName}` : ''}`,
    you: 'You',
    votesCount: (n: number) => `${n} ${n === 1 ? 'vote' : 'votes'}`,
    vote: 'Vote',
    openChat: 'Open chat',
    openVoting: 'Open voting',
  },

  gameOver: {
    victory: 'Victory',
    defeat: 'Defeat',
    villageHolds: 'The village holds',
    villageFalls: 'The village falls',
    everyVampireExiled: 'Every vampire has been exiled.',
    vampiresOutnumber: 'The vampires now outnumber the living.',
    xpEarned: 'XP earned',
    goldEarned: 'Gold earned',
    rounds: 'Rounds',
    finalRoster: 'Final roster',
    you: 'You',
    survived: 'Survived',
    eliminated: 'Eliminated',
    playAgain: 'Play again',
  },

  roleSheet: {
    title: 'Roles',
    subtitle: 'What each role can do. Who holds them is for you to work out.',
    you: 'You',
    nightAction: (action: string) => `Night action · ${action}`,
    noNightAction: 'No night action',
  },

  eventLog: {
    title: 'Game Log',
    nothingYet: 'Nothing has happened yet.',
    round: (n: number) => `Round ${n}`,
  },

  chat: {
    title: {
      afterGame: 'After the game',
      village: 'Village',
      coven: 'The Coven',
      townSquare: 'Town Square',
    },
    notice: {
      eliminated: 'You were eliminated. You can follow the room, but not speak.',
      notStarted: 'The room opens once the first night has passed.',
      asleep: 'The village is asleep. You can talk again at dawn.',
    },
    chatSuffix: (title: string) => `${title} chat`,
    chatLabel: 'Chat',
    covenOnly: 'Only your coven can hear this',
    everyoneCanRead: 'Everyone still in the game can read this',
    closeChat: 'Close chat',
    nobodySaidAnything: 'Nobody has said anything yet.',
    chatClosed: 'Chat is closed.',
    speakToCoven: 'Speak to your coven…',
    saySomething: 'Say something…',
    message: 'Message',
    sendMessage: 'Send message',
  },
};
