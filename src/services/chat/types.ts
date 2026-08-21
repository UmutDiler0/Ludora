/**
 * Chat boundary (docs/ARCHITECTURE.md §3 — infrastructure layer, §18).
 *
 * The store and UI talk only to this interface, exactly as they do for auth and
 * presence. Today a mock stands in; when the RealtimeTransport lands, `send`
 * becomes an RTDB push under `rooms/{roomId}/chat/{channel}` and `subscribe`
 * becomes a `child_added` listener, and no screen changes.
 *
 * `send` deliberately does *not* return the message. Real transports echo a
 * write back through the same subscription that carries everyone else's
 * traffic, and the local echo must take the same path — otherwise the sender
 * sees a different message list from everyone else, which is the bug that makes
 * chat clients drift.
 */

/**
 * Where a message was said.
 *
 * `village` is the public room; `coven` is the vampires' private night channel.
 * Channels are separate paths rather than a flag on the message, because the
 * server has to be able to deny *reading* the coven — a flag the client filters
 * on is not a secret (§12).
 */
export type ChatChannel = 'village' | 'coven';

export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  uid: string;
  displayName: string;
  body: string;
  at: number;
  /** Narration from the game itself. Rendered differently, never attributed. */
  system?: boolean;
}

/** What a caller supplies; the transport assigns identity and time. */
export type OutgoingChat = Omit<ChatMessage, 'id' | 'at'>;

export interface ChatGateway {
  /** Messages for every channel this client is allowed to hear. Unsubscribes. */
  subscribe(onMessage: (message: ChatMessage) => void): () => void;
  send(message: OutgoingChat): void;
}

/** Longest message accepted, enforced at the boundary and in the composer. */
export const MAX_CHAT_LENGTH = 240;
