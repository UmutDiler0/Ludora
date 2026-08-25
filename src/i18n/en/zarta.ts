export const zarta = {
  setup: {
    title: 'Set Up Zarta',
    subtitle: 'Everyone bluffs, everyone votes — set the table, then start the room.',
    passPhoneBody: 'Pass the phone around — everyone writes a bluff and votes every round.',
    field: {
      answerSeconds: 'Time to write a bluff',
      voteSeconds: 'Time to vote',
      totalRounds: 'Questions to play',
    },
    resultSummary: (players: number, questions: number) => `${players} players, ${questions} questions.`,
  },
  lobby: {
    subtitle: "Zarta · everyone's seated, start when ready.",
    questions: (n: number) => `${n} questions`,
  },
  session: {
    leaveGame: 'Leave game',
    noGameInProgress: 'No game in progress',
    startFromPlay: 'Start one from the Play tab.',
    backToPlay: 'Back to Play',
    round: (round: number, total: number) => `Round ${round} / ${total}`,
  },
  writing: {
    subtitle: 'Write a believable lie. If someone falls for it, you score.',
    passButton: (name: string) => `I'm ${name} — show me the question`,
    answerThis: (name: string) => `${name}, answer this`,
    yourBluff: 'Your bluff',
    placeholder: 'Write something believable…',
    lockIn: 'Lock in my answer',
  },
  voting: {
    subtitle: 'Which answer do you believe is true?',
    passButton: (name: string) => `I'm ${name} — show me the answers`,
    whichIsTrue: (name: string) => `${name}, which is the truth?`,
  },
  roundRecap: {
    theTable: 'The table',
    writtenBy: (names: string) => `Written by ${names}`,
    pickedBy: (names: string) => `Picked by ${names}`,
    pointsThisRound: 'Points this round',
    nobodyScored: 'Nobody scored — everyone was fooled or ran out of time.',
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
