import type { ChatChannel, ChatMessage } from '@/services/chat/types';
import type { VVPlayerView } from './state';

/**
 * Who may say what, and when.
 *
 * Pure, like the engine: it takes a `VVPlayerView` and returns a verdict. The
 * server will run exactly this to authorise a write, so it must not reach for a
 * store, a clock or a transport.
 *
 * The rules are the game's, not the UI's:
 *
 *   · The dead do not speak. A player who has been eliminated knows things the
 *     living do not — often including who the vampires are — and letting them
 *     talk hands the village a free oracle. They keep reading, because watching
 *     is the whole consolation prize.
 *   · At night the village sleeps and only the coven talks, in its own channel.
 *   · Once the game is over everything opens up, including the coven's history:
 *     the roles are already public by then, so there is nothing left to protect
 *     and the post-mortem is half the fun.
 */

export interface ChatAccess {
  /** The channel this player writes into right now. */
  channel: ChatChannel;
  /** Every channel they may read. */
  readable: ChatChannel[];
  canSend: boolean;
  /** Why they cannot speak, in words they can act on. Null when they can. */
  notice: string | null;
  /** Label for the room they are looking at. */
  title: string;
}

const VILLAGE: ChatChannel[] = ['village'];
const BOTH: ChatChannel[] = ['village', 'coven'];

export function chatAccess(view: VVPlayerView): ChatAccess {
  const isVampire = view.coven !== null;

  if (view.phase === 'game_over') {
    return {
      channel: 'village',
      // Nothing to hide once the roles are out — the coven's night talk is the
      // most interesting part of the post-mortem.
      readable: BOTH,
      canSend: true,
      notice: null,
      title: 'After the game',
    };
  }

  if (!view.you.alive) {
    return {
      channel: 'village',
      readable: isVampire ? BOTH : VILLAGE,
      canSend: false,
      notice: 'You were eliminated. You can follow the room, but not speak.',
      title: 'Village',
    };
  }

  if (view.phase === 'role_reveal') {
    return {
      channel: 'village',
      readable: isVampire ? BOTH : VILLAGE,
      canSend: false,
      notice: 'The room opens once the first night has passed.',
      title: 'Village',
    };
  }

  if (view.phase === 'night') {
    if (isVampire) {
      return {
        channel: 'coven',
        readable: BOTH,
        canSend: true,
        notice: null,
        title: 'The Coven',
      };
    }
    return {
      channel: 'village',
      readable: VILLAGE,
      canSend: false,
      notice: 'The village is asleep. You can talk again at dawn.',
      title: 'Village',
    };
  }

  // day_discussion and day_vote — the public room, which is the point of it.
  return {
    channel: 'village',
    readable: isVampire ? BOTH : VILLAGE,
    canSend: true,
    notice: null,
    title: 'Town Square',
  };
}

/**
 * The messages this player is allowed to see, oldest first.
 *
 * Filtering here is a display concern only. The real protection is that the
 * server never sends a non-vampire the coven channel in the first place — a
 * client-side filter over data the client already holds protects nobody.
 */
export const visibleMessages = (
  messages: readonly ChatMessage[],
  access: ChatAccess,
): ChatMessage[] => messages.filter((message) => access.readable.includes(message.channel));
