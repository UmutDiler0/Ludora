import { create } from 'zustand';

import { roomGateway } from '@/services/rooms/mockRooms';
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
    void roomGateway.listPublicRooms().then((publicRooms) => set({ publicRooms }));
  };
  roomGateway.subscribe(refresh);
  refresh();
  return { publicRooms: [] };
});
