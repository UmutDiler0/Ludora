import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@/constants/app';

/** Draws a fresh code, retrying on collision against whatever `taken` reports. */
export function generateRoomCode(taken: (code: string) => boolean): string {
  let code: string;
  do {
    code = Array.from(
      { length: ROOM_CODE_LENGTH },
      () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)],
    ).join('');
  } while (taken(code));
  return code;
}
