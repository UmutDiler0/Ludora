/**
 * Product-level constants.
 *
 * `APP_NAME` exists because the Stitch designs ship five different names
 * (PARTY HUB, ARCADE.IO, ARCADE_HUB, Party Game Hub, LUMINA HUB — see
 * docs/ARCHITECTURE.md §1.1b). Decision D3: one constant, one name, and no
 * screen hard-codes a brand string.
 */
export const APP_NAME = 'Ludora';

/** Tab labels follow spec §3, resolved as decision D1 over four rival designs. */
export const TABS = {
  home: 'Home',
  leaderboard: 'Mücadele',
  play: 'Oyna',
  profile: 'Profil',
} as const;

/** Room codes are 6 chars, unambiguous alphabet — no O/0, no I/1. */
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
