export const connection = {
  couldNotConnectTitle: 'Could not connect',
  tryingToConnectTitle: 'Trying to connect',
  couldNotConnectHeading: 'Couldn’t connect to the server',
  tryingToConnectHeading: 'Trying to connect…',
  droppedFromGame: 'You were dropped from your game. The other players have been told.',
  stoppedTrying: 'We stopped trying. Check your connection and try again.',
  wentOffline: 'You’ve gone offline. Hold on while we get you back.',
  attempt: (n: number) => `Attempt ${n}`,
  givingUpIn: (s: number) => `· giving up in ${s}s`,
  notNow: 'Not now',
  tryAgain: 'Try again',
  stopWaiting: 'Stop waiting',
  playerConnectionUpdate: 'Player connection update',
  gotIt: 'Got it',
  /** Keyed by `PeerEventKind` — see `services/network/types.ts`. */
  peerEvent: {
    lost: (name: string) => `${name} lost connection. They have a moment to come back.`,
    returned: (name: string) => `${name} is back.`,
    left: (name: string) => `${name} left the game.`,
  },
};
