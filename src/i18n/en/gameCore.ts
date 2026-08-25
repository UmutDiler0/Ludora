/**
 * Copy shared by every game's own setup/lobby screens — the generic chrome
 * `LobbyScreen` and each `*-setup.tsx` render around a game-specific field
 * list. Game-specific labels (field names, presets, summaries) live in that
 * game's own namespace file instead.
 */
export const gameCore = {
  players: 'Players',
  presets: 'Presets',
  rules: 'Rules',
  continueToLobby: 'Continue to Lobby',
  fixSetting: 'Fix the setting above before starting.',
  on: 'On',
  off: 'Off',
  roomLobbyTitle: 'Room Lobby',
  room: 'Room',
  localRoom: 'Local room',
  localRoomBody:
    'Everyone below is already seated on this device. Once games are playable over the network, this is where you would wait for the room to fill before the owner starts it.',
  playersCount: (n: number) => `Players · ${n}`,
  owner: 'Owner',
  ready: 'Ready',
  ownerThisDevice: 'Owner · this device',
  settings: 'Settings',
  onlyOwnerCanStart: 'Only the room owner can start the game.',
  startGame: 'Start Game',
  /** Preset names reused verbatim across Taboo/Sketch It/Zarta/Imposter's
   *  setup screens (Vampire Village keeps its own, set before this shared
   *  lookup existed). */
  presetName: {
    classic: 'Classic',
    quick: 'Quick',
    marathon: 'Marathon',
    extended: 'Extended',
  },
};
