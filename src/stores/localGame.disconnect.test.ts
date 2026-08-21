import type { PeerPresenceEvent } from '@/services/network/types';
import { useLocalGame } from './localGame';

/**
 * The disconnect and peer-presence surface of the game store. The engine rules
 * are covered by engine.test.ts; this is only about what an outage does to a
 * session, which is the part the connection store depends on.
 */

const peer = (uid: string, kind: PeerPresenceEvent['kind'] = 'lost'): PeerPresenceEvent => ({
  uid,
  displayName: uid,
  kind,
  at: 1,
});

beforeEach(() => {
  useLocalGame.setState({ state: null, error: null, endedReason: null, peerEvents: [] });
});

describe('endForDisconnect', () => {
  it('reports nothing lost when no game is running', () => {
    // An outage on the home screen must not claim to have cost a game.
    expect(useLocalGame.getState().endForDisconnect()).toBe(false);
    expect(useLocalGame.getState().endedReason).toBeNull();
  });

  it('ends a running game and says so', () => {
    useLocalGame.getState().newGame(6);
    expect(useLocalGame.getState().state).not.toBeNull();

    expect(useLocalGame.getState().endForDisconnect()).toBe(true);
    expect(useLocalGame.getState().state).toBeNull();
    expect(useLocalGame.getState().endedReason).toBe('disconnected');
  });

  it('is safe to call twice', () => {
    // Both the grace-window expiry and "Stop waiting" can reach this.
    useLocalGame.getState().newGame(6);
    expect(useLocalGame.getState().endForDisconnect()).toBe(true);
    expect(useLocalGame.getState().endForDisconnect()).toBe(false);
    expect(useLocalGame.getState().endedReason).toBe('disconnected');
  });

  it('clears the disconnect reason when a new game starts', () => {
    useLocalGame.getState().newGame(6);
    useLocalGame.getState().endForDisconnect();
    useLocalGame.getState().newGame(6);
    expect(useLocalGame.getState().endedReason).toBeNull();
  });
});

describe('peer presence queue', () => {
  it('keeps every event rather than overwriting', () => {
    // Two players dropping at once is when the message matters most.
    useLocalGame.getState().notePeerEvent(peer('ann'));
    useLocalGame.getState().notePeerEvent(peer('bob'));
    expect(useLocalGame.getState().peerEvents.map((e) => e.uid)).toEqual(['ann', 'bob']);
  });

  it('shows them oldest first', () => {
    useLocalGame.getState().notePeerEvent(peer('ann'));
    useLocalGame.getState().notePeerEvent(peer('bob'));

    useLocalGame.getState().dismissPeerEvent();
    expect(useLocalGame.getState().peerEvents.map((e) => e.uid)).toEqual(['bob']);

    useLocalGame.getState().dismissPeerEvent();
    expect(useLocalGame.getState().peerEvents).toEqual([]);
  });

  it('tolerates dismissing an empty queue', () => {
    expect(() => useLocalGame.getState().dismissPeerEvent()).not.toThrow();
    expect(useLocalGame.getState().peerEvents).toEqual([]);
  });

  it('drops stale events when a new game starts', () => {
    // A drop notice from the last session popping over a fresh game would name
    // somebody who is not in the room.
    useLocalGame.getState().notePeerEvent(peer('ann'));
    useLocalGame.getState().newGame(6);
    expect(useLocalGame.getState().peerEvents).toEqual([]);
  });

  it('drops pending events when our own connection ends the game', () => {
    useLocalGame.getState().newGame(6);
    useLocalGame.getState().notePeerEvent(peer('ann'));
    useLocalGame.getState().endForDisconnect();
    expect(useLocalGame.getState().peerEvents).toEqual([]);
  });
});
