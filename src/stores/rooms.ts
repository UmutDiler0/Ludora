import { create } from 'zustand';

import { roomGateway } from '@/services/rooms/firebaseRooms';
import type { Room } from '@/services/rooms/types';

/**
 * Reactive mirror of `roomGateway`'s public room list, for the Find Room
 * screen. Creating/closing a room is a direct `roomGateway` call from the
 * setup/lobby screens that own that action — this store only exists so a
 * screen that merely *reads* the list re-renders when it changes elsewhere.
 */
interface RoomsState {
  publicRooms: Room[];
}

export const useRooms = create<RoomsState>((set) => {
  const refresh = () => {
    // A denied read (no RTDB rules yet, or a not-actually-signed-in guest —
    // see docs/firebase.md) must not become an unhandled rejection just
    // because this runs outside any screen's own try/catch. Failing closed
    // to an empty list is the right behavior either way: nothing to browse
    // beats a crash.
    roomGateway
      .listPublicRooms()
      .then((publicRooms) => set({ publicRooms }))
      .catch((err) => {
        console.warn('[rooms] failed to load public rooms:', err);
      });
  };
  roomGateway.subscribe(refresh);
  refresh();
  return { publicRooms: [] };
});
