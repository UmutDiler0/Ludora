import { create } from 'zustand';

import { chatAccess, visibleMessages } from '@/features/games/vampireVillage/chat';
import type { VVPlayerView } from '@/features/games/vampireVillage/state';
import { botChatter, chatGateway, type ChatterSpeaker } from '@/services/chat/mockChat';
import type { ChatChannel, ChatMessage } from '@/services/chat/types';
import { HUMAN_UID } from './localGame';

/**
 * In-session chat.
 *
 * Deliberately not persisted. A room's talk belongs to that room: keeping it
 * across sessions would mean the next game opens with the last one's arguments
 * still in it, and the real transport will not hand a client history it is no
 * longer authorised to read anyway.
 *
 * The store owns side effects only — the subscription, the timers and the
 * unread mark. Who may speak is `chatAccess` (pure, in the game feature), and
 * delivery is `ChatGateway` (the boundary). Neither is decided here.
 *
 * While there is one game, the phase-driven parts below name Vampire Village
 * directly rather than pretending to a generality that has never been tested
 * against a second game.
 */

/** Kept short: a room's scrollback is not an archive, and this is all in memory. */
const MAX_MESSAGES = 200;

/** Bots answer at human speed, staggered, rather than all at once. */
const CHATTER_DELAY_MS = [1400, 3600];

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  /** Everything at or before this is read. */
  lastReadAt: number;
  /** The game session these messages belong to. */
  sessionId: number;

  open: () => void;
  close: () => void;
  /** Called by the gateway subscription. Never called directly by a screen. */
  receive: (message: ChatMessage) => void;
  say: (body: string, channel: ChatChannel, displayName: string) => void;
  /** Wipes the room when a new game starts. */
  resetFor: (sessionId: number) => void;
  /** Narrates a phase change and gives the bots a chance to react. */
  notePhase: (view: VVPlayerView) => void;
  /** Drops pending bot lines. Called when the room is torn down. */
  stopChatter: () => void;
}

/**
 * Pending bot lines. Module-level rather than in the store: they are timers,
 * not state, and nothing renders from them.
 */
let chatterTimers: ReturnType<typeof setTimeout>[] = [];

function clearChatter() {
  for (const timer of chatterTimers) clearTimeout(timer);
  chatterTimers = [];
}

/** Who is around to talk, in a given channel. */
function speakersFor(view: VVPlayerView, channel: ChatChannel): ChatterSpeaker[] {
  const living = view.players.filter((p) => p.alive && p.uid !== HUMAN_UID);
  if (channel === 'village') return living.map(({ uid, displayName }) => ({ uid, displayName }));

  // The coven is only known to a player inside it — which is also the only
  // player who can read the channel, so there is nothing to generate otherwise.
  const coven = view.coven ?? [];
  return living
    .filter((p) => coven.includes(p.uid))
    .map(({ uid, displayName }) => ({ uid, displayName }));
}

const NARRATION: Partial<Record<VVPlayerView['phase'], string>> = {
  night: 'Night falls. The village sleeps.',
  day_discussion: 'Dawn breaks over the village.',
  game_over: 'The game is over. Everything is on the table.',
};

export const useChat = create<ChatStore>((set, get) => ({
  messages: [],
  isOpen: false,
  lastReadAt: 0,
  sessionId: 0,

  open: () => set({ isOpen: true, lastReadAt: Date.now() }),

  close: () => set({ isOpen: false, lastReadAt: Date.now() }),

  receive: (message) =>
    set((s) => ({
      messages: [...s.messages, message].slice(-MAX_MESSAGES),
      // Arriving while the room is open counts as read; otherwise the badge
      // would light up for a message the player is looking at.
      lastReadAt: s.isOpen ? message.at : s.lastReadAt,
    })),

  say: (body, channel, displayName) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    // Goes out through the gateway and comes back via `receive`, so the local
    // echo takes the same path as everyone else's traffic.
    chatGateway.send({ channel, uid: HUMAN_UID, displayName, body: trimmed });
  },

  resetFor: (sessionId) => {
    if (get().sessionId === sessionId) return;
    clearChatter();
    set({ messages: [], sessionId, lastReadAt: Date.now(), isOpen: false });
  },

  stopChatter: clearChatter,

  notePhase: (view) => {
    clearChatter();

    const narration = NARRATION[view.phase];
    if (narration) {
      chatGateway.send({
        channel: 'village',
        uid: 'system',
        displayName: 'Village',
        body: narration,
        system: true,
      });
    }

    // Bots talk in whichever channel is actually live this phase.
    const channel: ChatChannel = view.phase === 'night' ? 'coven' : 'village';
    const lines = botChatter({
      phase: view.phase,
      seed: `${get().sessionId}:${view.round}:${view.phase}`,
      speakers: speakersFor(view, channel),
      channel,
    });

    lines.forEach((line, i) => {
      chatterTimers.push(
        setTimeout(() => chatGateway.send(line), CHATTER_DELAY_MS[i] ?? 5000 + i * 1200),
      );
    });
  },
}));

/**
 * Unread messages the viewer is allowed to see.
 *
 * Your own messages never count, and neither does anything in a channel you
 * cannot read — a badge for a message that is not there when you open the room
 * is worse than no badge.
 */
export function useUnreadCount(view: VVPlayerView | null): number {
  const messages = useChat((s) => s.messages);
  const lastReadAt = useChat((s) => s.lastReadAt);
  if (!view) return 0;

  return visibleMessages(messages, chatAccess(view)).filter(
    (message) => message.at > lastReadAt && message.uid !== HUMAN_UID,
  ).length;
}
