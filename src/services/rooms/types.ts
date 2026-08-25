import type { GameId } from '@/features/games/core/types';

/**
 * Room directory boundary (docs/ARCHITECTURE.md §6.4/§7, docs/firebase.md §2).
 *
 * `WAITING`/`Listed publicly` mirror ARCHITECTURE §7's room-state table:
 * private rooms are joinable by code but never listed; a closed room is
 * neither. There is no `IN_PROGRESS` state modelled here — a room closes the
 * moment its owner starts the game, which is the only transition this app can
 * actually drive without a second device.
 */

export type RoomVisibility = 'public' | 'private';
export type RoomStatus = 'waiting' | 'closed';

export interface Room {
  code: string;
  gameId: GameId;
  hostName: string;
  visibility: RoomVisibility;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
  createdAt: number;
  /** Route + params to replay to land a joiner in the same lobby. */
  route: string;
  params: Record<string, string>;
}

/** Params always gets `code` merged in by `createRoom` once the code exists. */
export type NewRoom = Omit<Room, 'code' | 'status' | 'createdAt'>;

export interface RoomGateway {
  createRoom(input: NewRoom): Room;
  listPublicRooms(): Room[];
  /** A `waiting` room by code, public or private — codes always work while a room is open. */
  getRoomByCode(code: string): Room | null;
  closeRoom(code: string): void;
  subscribe(onChange: () => void): () => void;
}
