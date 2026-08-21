import type { ChatMessage } from '@/services/chat/types';
import { chatAccess, visibleMessages } from './chat';
import type { VVPhase, VVPlayerView } from './state';

const view = (over: Partial<VVPlayerView> = {}): VVPlayerView => ({
  phase: 'day_discussion' as VVPhase,
  round: 1,
  deadlineAt: 0,
  you: {
    uid: 'you',
    role: 'villager',
    roleName: 'Villager',
    blurb: '',
    alignment: 'village',
    alive: true,
  },
  players: [],
  coven: null,
  canActNow: false,
  yourNightTarget: null,
  yourVote: null,
  voteCounts: null,
  visions: [],
  log: [],
  winner: null,
  ...over,
});

/** A vampire's view — the coven list is what marks one, exactly as `projectFor` does. */
const vampire = (over: Partial<VVPlayerView> = {}) =>
  view({
    you: { ...view().you, role: 'vampire', roleName: 'Vampire', alignment: 'vampires' },
    coven: ['you', 'bot1'],
    ...over,
  });

describe('chat access', () => {
  it('lets the living talk in the town square by day', () => {
    for (const phase of ['day_discussion', 'day_vote'] as VVPhase[]) {
      const access = chatAccess(view({ phase }));
      expect(access.canSend).toBe(true);
      expect(access.channel).toBe('village');
    }
  });

  it('silences the village at night', () => {
    const access = chatAccess(view({ phase: 'night' }));
    expect(access.canSend).toBe(false);
    expect(access.notice).toMatch(/asleep/i);
  });

  it('opens the coven to vampires at night, and only at night', () => {
    expect(chatAccess(vampire({ phase: 'night' })).channel).toBe('coven');
    expect(chatAccess(vampire({ phase: 'night' })).canSend).toBe(true);
    // By day a vampire is just another villager in the square.
    expect(chatAccess(vampire({ phase: 'day_discussion' })).channel).toBe('village');
  });

  it('never lets a non-vampire read the coven while the game runs', () => {
    // The one rule here with a real cost if it breaks: coven talk names the
    // night's target, so a villager who can read it has won on the spot.
    for (const phase of ['role_reveal', 'night', 'day_discussion', 'day_vote'] as VVPhase[]) {
      expect(chatAccess(view({ phase })).readable).toEqual(['village']);
      expect(chatAccess(view({ phase, you: { ...view().you, alive: false } })).readable).toEqual([
        'village',
      ]);
    }
  });

  it('stops the dead from speaking but not from watching', () => {
    const dead = view({ you: { ...view().you, alive: false } });
    const access = chatAccess(dead);
    expect(access.canSend).toBe(false);
    expect(access.readable).toContain('village');
    expect(access.notice).toMatch(/eliminated/i);
  });

  it('keeps a dead vampire out of the room they used to speak in', () => {
    const access = chatAccess(vampire({ phase: 'night', you: { ...vampire().you, alive: false } }));
    expect(access.canSend).toBe(false);
    // Still reads the coven — they already know everything in it.
    expect(access.readable).toEqual(['village', 'coven']);
  });

  it('holds chat shut until the game has actually started', () => {
    expect(chatAccess(view({ phase: 'role_reveal' })).canSend).toBe(false);
  });

  it('opens everything once the game is over', () => {
    // Roles are public by then, so there is nothing left to protect — and the
    // coven's night talk is the best part of the post-mortem.
    const over = chatAccess(view({ phase: 'game_over', you: { ...view().you, alive: false } }));
    expect(over.canSend).toBe(true);
    expect(over.readable).toEqual(['village', 'coven']);
  });
});

describe('visibleMessages', () => {
  const message = (channel: ChatMessage['channel'], id: string): ChatMessage => ({
    id,
    channel,
    uid: 'bot1',
    displayName: 'ShadowNinja',
    body: 'hello',
    at: 1,
  });

  const all = [message('village', 'a'), message('coven', 'b'), message('village', 'c')];

  it('hides channels the viewer cannot read', () => {
    const shown = visibleMessages(all, chatAccess(view({ phase: 'night' })));
    expect(shown.map((m) => m.id)).toEqual(['a', 'c']);
  });

  it('shows both channels to a vampire', () => {
    const shown = visibleMessages(all, chatAccess(vampire({ phase: 'night' })));
    expect(shown.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps the order it was given', () => {
    // The room is a transcript; reordering it would change what was said.
    const shown = visibleMessages(all, chatAccess(vampire({ phase: 'game_over' })));
    expect(shown).toEqual(all);
  });
});
