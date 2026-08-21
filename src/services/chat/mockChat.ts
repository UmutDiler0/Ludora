import { createRng, hashSeed, randomInt } from '@/features/games/core/rng';

import type { ChatGateway, ChatMessage, OutgoingChat } from './types';
import { MAX_CHAT_LENGTH } from './types';

/**
 * Stand-in for room chat until the realtime transport lands (§18).
 *
 * It is a loopback: `send` goes straight back out through `subscribe`, which is
 * the same shape RTDB has and means the sender's own message follows the same
 * path as everyone else's.
 *
 * `emit` is the seam. The local game driver uses it to give the bots something
 * to say, so the room is not silent while there is nobody real in it — the same
 * reason the bots take night actions and votes.
 */

let counter = 0;

/** Ids only have to be unique within a session, and stable enough to key a list. */
const nextId = (): string => `m${++counter}`;

export function createMockChat(): ChatGateway & {
  emit(message: OutgoingChat): ChatMessage;
} {
  const listeners = new Set<(message: ChatMessage) => void>();

  const deliver = (outgoing: OutgoingChat): ChatMessage => {
    const message: ChatMessage = {
      ...outgoing,
      // Trimmed and capped here rather than only in the composer: this is the
      // boundary, and the boundary is what the server will be.
      body: outgoing.body.trim().slice(0, MAX_CHAT_LENGTH),
      id: nextId(),
      at: Date.now(),
    };
    // Copied before iterating — a listener that unsubscribes on its first
    // message would otherwise mutate the set mid-loop.
    for (const listener of [...listeners]) listener(message);
    return message;
  };

  return {
    subscribe(onMessage) {
      listeners.add(onMessage);
      return () => {
        listeners.delete(onMessage);
      };
    },
    send: deliver,
    emit: deliver,
  };
}

/** The app-wide instance. Swapped for the RTDB gateway in one place, later. */
export const chatGateway = createMockChat();

/* ------------------------------------------------------------- bot chatter */

/**
 * ⚠️ Fake, and quarantined here with the rest of the mock.
 *
 * Lines are deliberately content-free — reactions, hedges and accusations that
 * name nobody. A bot that says "it was BlazeQueen" would be making a claim the
 * engine never backs up, and players would (rightly) act on it. These read as
 * table noise, which is what they are.
 */
const VILLAGE_LINES: Record<string, string[]> = {
  day_discussion: [
    'Right, who are we looking at?',
    'That was a quiet night. Too quiet.',
    'I have a feeling about this one.',
    'Not me, obviously. Obviously.',
    'Someone is being very careful with their words.',
    'Let us not rush it this time.',
    'I will follow whoever makes the best case.',
  ],
  day_vote: [
    'Locked in.',
    'Going with my gut.',
    'I will change if someone talks me out of it.',
    'Fine. Let us see what happens.',
    'This had better be right.',
  ],
  game_over: ['Good game.', 'I knew it. I knew it!', 'Rematch.', 'Well played, all.'],
};

const COVEN_LINES = [
  'Who is it tonight?',
  'Not the loud one — too obvious.',
  'The quiet one has been watching us.',
  'Agreed. Make it quick.',
  'Careful in the morning. Do not overplay it.',
];

export interface ChatterSpeaker {
  uid: string;
  displayName: string;
}

/**
 * A couple of lines for the current phase, drawn deterministically.
 *
 * Deterministic in `seed` so a given phase of a given game always produces the
 * same chatter: re-rendering must not make the bots say something new, and a
 * seeded draw is the same discipline the engine and quests already use.
 */
export function botChatter(options: {
  phase: string;
  seed: string;
  speakers: ChatterSpeaker[];
  channel: 'village' | 'coven';
}): OutgoingChat[] {
  const { phase, seed, speakers, channel } = options;
  const pool = channel === 'coven' ? COVEN_LINES : VILLAGE_LINES[phase];
  if (!pool || speakers.length === 0) return [];

  const rng = createRng(hashSeed(`chat:${seed}`));
  const count = Math.min(speakers.length, 1 + randomInt(rng, 2));

  const remaining = [...speakers];
  const lines = [...pool];
  const out: OutgoingChat[] = [];

  for (let i = 0; i < count && remaining.length > 0 && lines.length > 0; i++) {
    // Spliced from both pools so one bot never says two things in a row and no
    // line is repeated inside a single burst.
    const speaker = remaining.splice(randomInt(rng, remaining.length), 1)[0];
    const body = lines.splice(randomInt(rng, lines.length), 1)[0];
    out.push({ channel, uid: speaker.uid, displayName: speaker.displayName, body });
  }

  return out;
}
