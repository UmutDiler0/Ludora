import {
  get,
  getDatabase,
  onValue,
  push,
  ref,
  update,
  type Database,
} from '@react-native-firebase/database';

import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@/constants/app';
import type { NewRoom, Room, RoomGateway } from './types';

/**
 * RTDB-backed room directory (docs/ARCHITECTURE.md §6.4/§7/§8, docs/firebase.md §3.11).
 *
 * Diverges from §6.4 in two acknowledged ways, both because there is no
 * Cloud Functions deployment yet to own them properly:
 *
 * 1. `/public_rooms/{roomId}` holds the *full* `Room` record, not the minimal
 *    `{gameId, hostName, current, max, isPremium, status}` projection §6.4
 *    describes — this client writes it directly instead of a Cloud Function
 *    maintaining a denormalised copy of `/rooms/{roomId}/meta`. Private rooms
 *    are simply never written here, so the "never scan /rooms" property this
 *    node exists for still holds; it just carries more fields than it should
 *    long-term.
 * 2. No idle-room sweep (§7.2) — a room nobody closes stays `waiting`
 *    forever. Needs a scheduled Cloud Function regardless of this file.
 *
 * Both are recorded in docs/firebase.md §4 as open items, not silently
 * dropped. What *is* real here: the `/room_codes/{CODE} → roomId` indirection
 * (mockRooms.ts's own header names this as the thing to "add back" once a
 * real backend lands), and the race-safe-enough code generation below —
 * retried against a live existence check, not the mock's synchronous `Map`.
 */

/**
 * Enabling Realtime Database in the console does not bake its URL into
 * `google-services.json`/`GoogleService-Info.plist` the way `storage_bucket`
 * is — `app.options.databaseURL` resolves to `null` without it, confirmed in
 * `getDatabase`'s own source (`lib/index.ts`). The URL is per-instance (this
 * project's, from the Realtime Database console) and can't be derived from
 * the project id alone, so it's hardcoded here rather than guessed.
 */
const RTDB_URL = 'https://ludora-13e00-default-rtdb.firebaseio.com/';

let db: Database | null = null;
const database = (): Database => (db ??= getDatabase(undefined, RTDB_URL));

async function codeExists(candidate: string): Promise<boolean> {
  const snap = await get(ref(database(), `room_codes/${candidate}`));
  return snap.exists();
}

async function generateRoomCodeAsync(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = Array.from(
      { length: ROOM_CODE_LENGTH },
      () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)],
    ).join('');
    if (!(await codeExists(candidate))) return candidate;
  }
  // Astronomically unlikely at this alphabet/length, but a hang is worse than a clear failure.
  throw new Error('Could not find a free room code after 10 attempts.');
}

export function createFirebaseRooms(): RoomGateway {
  return {
    async createRoom(input: NewRoom): Promise<Room> {
      const code = await generateRoomCodeAsync();
      const roomId = push(ref(database(), 'rooms')).key;
      if (!roomId) throw new Error('Firebase did not return a room id.');

      const room: Room = {
        ...input,
        code,
        status: 'waiting',
        createdAt: Date.now(),
        params: { ...input.params, code },
      };

      // Multi-path update: both writes commit together, or neither does —
      // a room is never left with a code nobody can look up, or a code that
      // points at a room that doesn't exist.
      await update(ref(database()), {
        [`rooms/${roomId}`]: room,
        [`room_codes/${code}`]: roomId,
        ...(room.visibility === 'public' ? { [`public_rooms/${roomId}`]: room } : {}),
      });

      return room;
    },

    async listPublicRooms(): Promise<Room[]> {
      const snap = await get(ref(database(), 'public_rooms'));
      const value = (snap.val() ?? {}) as Record<string, Room>;
      return Object.values(value)
        .filter((r) => r.status === 'waiting')
        .sort((a, b) => b.createdAt - a.createdAt);
    },

    async getRoomByCode(code: string): Promise<Room | null> {
      const codeSnap = await get(ref(database(), `room_codes/${code}`));
      const roomId = codeSnap.val() as string | null;
      if (!roomId) return null;

      const roomSnap = await get(ref(database(), `rooms/${roomId}`));
      const room = roomSnap.val() as Room | null;
      return room && room.status === 'waiting' ? room : null;
    },

    async closeRoom(code: string): Promise<void> {
      const codeSnap = await get(ref(database(), `room_codes/${code}`));
      const roomId = codeSnap.val() as string | null;
      if (!roomId) return;

      // `null` deletes that path in a multi-path update — drops the room out
      // of the public listing without touching `/rooms/{roomId}` or the code
      // mapping, which stay around for a joiner who already has the code.
      await update(ref(database()), {
        [`rooms/${roomId}/status`]: 'closed',
        [`public_rooms/${roomId}`]: null,
      });
    },

    subscribe(onChange: () => void): () => void {
      const roomsRef = ref(database(), 'public_rooms');
      // Without a cancel callback, a denied listener (no RTDB rules yet, or
      // a locally-faked guest session with no real Firebase Auth token —
      // see docs/firebase.md) fails silently inside the SDK rather than
      // surfacing anywhere this app could react to it. Logging it at least
      // makes that failure visible instead of a mysterious empty room list.
      const unsubscribe = onValue(
        roomsRef,
        () => onChange(),
        (err) => console.warn('[rooms] public_rooms listener denied:', err),
      );
      return unsubscribe;
    },
  };
}

/** The app-wide instance. Every screen imports `roomGateway` from this file now — see docs/firebase.md §2/§3.11. */
export const roomGateway = createFirebaseRooms();
