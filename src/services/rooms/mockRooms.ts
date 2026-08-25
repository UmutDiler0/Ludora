import { generateRoomCode } from './roomCode';
import type { Room, RoomGateway } from './types';

/**
 * Stand-in for the room directory until `/rooms`, `/room_codes` and
 * `/public_rooms` land (docs/ARCHITECTURE.md §6.4, §7). Module-level state —
 * like `mockPresence` — so a room created from one screen is still findable
 * from another after the creator navigates away; a real directory would be
 * server-side and just as detached from any one screen's lifetime.
 *
 * Honest about what a single device can actually demonstrate: there is no
 * second player to fill an open seat, so "browsing rooms" only ever shows
 * rooms *this* device created. Joining one — by code or from the list —
 * simply replays the room's own route/params, landing back in the same
 * lobby rather than adding a participant. The seam (`RoomGateway`) is the
 * real deliverable; a `RealtimeTransport`-backed implementation swaps in
 * later without any screen changing, the same promise every other mock in
 * `services/` makes.
 *
 * A room stays listed until its owner starts the game (`closeRoom`) — there
 * is no idle sweep like ARCHITECTURE §7.2's 5-minute cleanup, so a room
 * abandoned mid-setup lingers for the rest of the session. Acceptable for a
 * local mock; a real backend already has to sweep for the server-crash case
 * anyway.
 */
export function createMockRooms(): RoomGateway {
  const rooms = new Map<string, Room>();
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };

  return {
    createRoom(input) {
      const code = generateRoomCode((candidate) => rooms.has(candidate));
      const room: Room = {
        ...input,
        code,
        status: 'waiting',
        createdAt: Date.now(),
        params: { ...input.params, code },
      };
      rooms.set(code, room);
      notify();
      return room;
    },

    listPublicRooms() {
      return [...rooms.values()]
        .filter((r) => r.status === 'waiting' && r.visibility === 'public')
        .sort((a, b) => b.createdAt - a.createdAt);
    },

    getRoomByCode(code) {
      const room = rooms.get(code);
      return room && room.status === 'waiting' ? room : null;
    },

    closeRoom(code) {
      const room = rooms.get(code);
      if (!room) return;
      rooms.set(code, { ...room, status: 'closed' });
      notify();
    },

    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
  };
}

/** The app-wide instance. Swapped for the RTDB-backed gateway in one place, later. */
export const roomGateway = createMockRooms();
