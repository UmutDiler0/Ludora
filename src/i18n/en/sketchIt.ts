export const sketchIt = {
  setup: {
    title: 'Set Up Sketch It',
    subtitle: 'Everyone draws once — set the table, then start the room.',
    passPhoneBody: 'Pass the phone around — everyone gets one turn to draw.',
    field: {
      roundSeconds: 'Drawing time',
    },
    resultSummary: (players: number, seconds: number) => `${players} players, ${seconds}s to draw each turn.`,
  },
  lobby: {
    subtitle: "Sketch It · everyone's seated, start when ready.",
    secondsToDraw: (n: number) => `${n}s to draw each turn`,
  },
  session: {
    leaveGame: 'Leave game',
    noGameInProgress: 'No game in progress',
    startFromPlay: 'Start one from the Play tab.',
    backToPlay: 'Back to Play',
    round: (round: number, total: number) => `Round ${round} / ${total}`,
  },
  roundIntro: {
    passTo: (name: string) => `Pass to ${name}`,
    lookAway: (name: string) => `Everyone else, look away — ${name} is about to see the word.`,
    yourWord: 'Your word',
    readyStart: 'Everyone ready — start drawing',
  },
  drawing: {
    undoLastStroke: 'Undo last stroke',
    clearCanvas: 'Clear canvas',
    color: (c: string) => `Colour ${c}`,
    brushSize: (n: number) => `Brush size ${n}`,
    whosGotIt: "Who's got it?",
  },
  roundRecap: {
    wasDrawing: (name: string) => `${name} was drawing`,
    plusForArtist: (n: number) => `+${n} for the artist`,
    leaderboard: 'Leaderboard',
    whoGuessedIt: 'Who guessed it',
    nobodyGuessed: 'Nobody guessed it in time.',
    seeResults: 'See results',
    passThePhone: 'Pass the phone',
  },
  gameOver: {
    draw: 'Draw',
    gameOver: 'Game Over',
    tie: "It's a tie",
    wins: (name: string) => `${name} wins`,
    finalStandings: 'Final standings',
    playAgain: 'Play again',
  },
};
