export const taboo = {
  /** Team display names — engine state bakes English ones in (`makeTeam('A',
   *  'Red', ...)`), same as Vampire Village's role names; the UI looks these
   *  up by the stable team id instead of trusting that field. */
  team: { A: 'Red', B: 'Blue' },
  teamLabel: (name: string) => `Team ${name}`,

  setup: {
    title: 'Set Up Taboo',
    subtitle: 'Build the roster, split the teams, then start the room.',
    playerNamePlaceholder: 'Player name',
    addPlayer: 'Add player',
    removePlayer: (name: string) => `Remove ${name}`,
    teamCount: (team: string, n: number) => `Team ${team} · ${n}`,
    teamOptionLabel: (team: string, you: boolean) => `Team ${team}${you ? ', you' : ''}`,
    field: {
      roundSeconds: 'Round length',
      skipLimit: 'Skips per turn',
      targetScore: 'Points to win',
      maxTurns: 'Turn limit',
    },
    everyTeamNeedsPlayer: 'Every team needs at least one player.',
    resultSummary: (players: number, targetScore: number) => `${players} players, first to ${targetScore} wins.`,
  },

  lobby: {
    subtitle: "Taboo · everyone's seated, start when ready.",
    firstTo: (n: number) => `First to ${n}`,
    roundSeconds: (n: number) => `${n}s rounds`,
  },

  session: {
    leaveGame: 'Leave game',
    noGameInProgress: 'No game in progress',
    startFromPlay: 'Start one from the Play tab.',
    backToPlay: 'Back to Play',
  },

  turnIntro: {
    passTo: (name: string) => `Pass to ${name}`,
    everyoneElseReady: (name: string) =>
      `Everyone else, get ready to guess out loud. ${name} will describe a word without ever saying it — or any of the words below it.`,
    readyStart: "I'm ready — start the clock",
  },

  describing: {
    describeThisWord: 'Describe this word',
    forbiddenWords: 'Forbidden words',
    skipsLeft: (n: number) => `${n} skip${n === 1 ? '' : 's'} left this turn`,
    skip: 'Skip',
    tabu: 'Taboo',
    correct: 'Correct',
  },

  turnRecap: {
    teamsTurn: (name: string) => `Team ${name}'s turn`,
    thisTurn: 'This turn',
    noCardsResolved: 'No cards were resolved before time ran out.',
    seeResults: 'See results',
    passThePhone: 'Pass the phone',
  },

  gameOver: {
    draw: 'Draw',
    gameOver: 'Game Over',
    tie: "It's a tie",
    teamWins: (name: string) => `Team ${name} wins`,
    turnsPlayed: 'Turns played',
    rosters: 'Rosters',
    playAgain: 'Play again',
  },
};
