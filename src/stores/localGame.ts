import { create } from 'zustand';

import { createRng, randomInt } from '@/features/games/core/rng';
import type { PlayerSeat, Rng, Uid } from '@/features/games/core/types';
import { DEFAULT_VV_CONFIG, type VVConfig } from '@/features/games/vampireVillage/config';
import engine from '@/features/games/vampireVillage/engine';
import { ROLES } from '@/features/games/vampireVillage/roles';
import type { VVPlayer, VVPlayerView, VVState } from '@/features/games/vampireVillage/state';
import type { PeerPresenceEvent } from '@/services/network/types';
import { useProgression } from './progression';

/**
 * Local, offline game driver.
 *
 * Firebase is deliberately not wired yet. Because the engine is pure
 * (docs/ARCHITECTURE.md §3), a full game runs entirely in memory with bots
 * filling the other seats — which makes every session screen buildable and
 * playable before any backend exists.
 *
 * When the RealtimeTransport lands (§18), this store is replaced by one that
 * subscribes to RTDB. The screens do not change: they already read a
 * `VVPlayerView`, which is exactly what the server will send.
 */

export const HUMAN_UID = 'you';

/** Exported so the lobby screen can preview the exact names `newGame` will assign. */
export const BOT_NAMES = [
  'ShadowNinja',
  'BlazeQueen',
  'TrashPanda',
  'NeonKnight',
  'WordMage',
  'ArtZilla',
  'Brainiac',
  'NovaStar',
  'ByteMe',
  'ShadowBlade',
  'GameMaster99',
];

const pick = <T>(rng: Rng, items: T[]): T | null =>
  items.length === 0 ? null : items[randomInt(rng, items.length)];

const livingOthers = (s: VVState, self: Uid): VVPlayer[] =>
  s.order.map((u) => s.players[u]).filter((p) => p.alive && p.uid !== self);

function chooseNightTarget(s: VVState, bot: VVPlayer, rng: Rng): Uid | null {
  const others = livingOthers(s, bot.uid);
  switch (ROLES[bot.role].night) {
    case 'kill':
      return pick(rng, others.filter((p) => ROLES[p.role].alignment !== 'vampires'))?.uid ?? null;
    case 'investigate':
      return pick(rng, others)?.uid ?? null;
    case 'protect':
      // May guard themselves.
      return pick(rng, [...others, bot])?.uid ?? null;
    default:
      return null;
  }
}

function chooseVoteTarget(s: VVState, bot: VVPlayer, rng: Rng): Uid | null {
  const others = livingOthers(s, bot.uid);
  // Vampires never vote for their own coven; villagers vote at random.
  const pool =
    ROLES[bot.role].alignment === 'vampires'
      ? others.filter((p) => ROLES[p.role].alignment !== 'vampires')
      : others;
  return pick(rng, pool.length ? pool : others)?.uid ?? null;
}

/**
 * Let every bot take whatever action the current phase is waiting on.
 * Stops as soon as the game is waiting on the human, so the human is never
 * skipped past their own turn.
 */
function driveBots(start: VVState, now: number, rng: Rng): VVState {
  let s = start;

  for (let pass = 0; pass < 64; pass++) {
    let acted = false;
    const ctx = (uid: Uid) => ({ uid, now, rng });

    if (s.phase === 'role_reveal') {
      for (const uid of s.order) {
        if (uid === HUMAN_UID || s.acked.includes(uid)) continue;
        const r = engine.reduce(s, { type: 'ACK_ROLE' }, ctx(uid));
        if (r.ok) {
          s = r.value;
          acted = true;
        }
      }
    } else if (s.phase === 'night') {
      for (const uid of s.order) {
        if (uid === HUMAN_UID) continue;
        const bot = s.players[uid];
        if (!bot.alive || ROLES[bot.role].night === null) continue;
        if (s.nightActions[bot.role]) continue;
        const target = chooseNightTarget(s, bot, rng);
        if (!target) continue;
        const r = engine.reduce(s, { type: 'NIGHT_ACTION', target }, ctx(uid));
        if (r.ok) {
          s = r.value;
          acted = true;
        }
      }
    } else if (s.phase === 'day_vote') {
      for (const uid of s.order) {
        if (uid === HUMAN_UID) continue;
        const bot = s.players[uid];
        if (!bot.alive || s.votes[uid]) continue;
        const target = chooseVoteTarget(s, bot, rng);
        if (!target) continue;
        const r = engine.reduce(s, { type: 'VOTE', target }, ctx(uid));
        if (r.ok) {
          s = r.value;
          acted = true;
        }
      }
    }

    if (!acted) break;
  }

  return s;
}

/**
 * Pays out a finished game, exactly once.
 *
 * Every action funnels through `commit`, so the game-over edge is detected in
 * one place rather than in each of the four reducers — and settling on the
 * *edge* rather than on the phase is what stops a re-render or a second action
 * paying for the same game twice.
 */
function settleIfFinished(before: VVState | null, after: VVState) {
  if (after.phase !== 'game_over' || before?.phase === 'game_over') return;

  const you = after.players[HUMAN_UID];
  const won = !!you && ROLES[you.role].alignment === after.winner;

  useProgression.getState().recordGameFinished({
    gameId: 'vampireVillage',
    won,
    // Surviving to the end counts every round; being eliminated counts the
    // rounds actually played through.
    roundsSurvived: you?.alive ? after.round : Math.max(0, after.round - 1),
  });
}

/** Store the new state, then pay out if this move ended the game. */
function commit(
  before: VVState | null,
  after: VVState,
  set: (partial: Partial<LocalGameStore>) => void,
) {
  set({ state: after, error: null });
  settleIfFinished(before, after);
}

interface LocalGameStore {
  state: VVState | null;
  error: string | null;
  /** Incremented per game so screens can key off a fresh session. */
  sessionId: number;
  /** Why the last session ended, when it ended for a reason worth explaining. */
  endedReason: 'disconnected' | null;
  /**
   * Peer presence events waiting to be shown, oldest first. A queue rather
   * than a single slot: two players dropping at once is exactly when the
   * message matters most, and the second one must not overwrite the first.
   */
  peerEvents: PeerPresenceEvent[];

  /** Config defaults to the Classic preset — the same game Quick Play always ran. */
  newGame: (playerCount?: number, config?: VVConfig) => void;
  ackRole: () => void;
  nightAction: (target: Uid) => void;
  vote: (target: Uid) => void;
  /** Day discussion has no action — the human decides when to open voting. */
  openVoting: () => void;
  clearError: () => void;

  /** Queue an event about somebody else in the room. */
  notePeerEvent: (event: PeerPresenceEvent) => void;
  /** Drop the oldest queued peer event once it has been shown. */
  dismissPeerEvent: () => void;
  /**
   * Called when the connection gives up. Returns whether a game was actually
   * lost, so the dialog can say "you were dropped from your game" only when
   * that is true.
   */
  endForDisconnect: () => boolean;
}

export const useLocalGame = create<LocalGameStore>((set, get) => ({
  state: null,
  error: null,
  sessionId: 0,
  endedReason: null,
  peerEvents: [],

  newGame: (playerCount = 6, config = DEFAULT_VV_CONFIG) => {
    const now = Date.now();
    const rng = createRng(now >>> 0);
    const seats: PlayerSeat[] = [
      { uid: HUMAN_UID, displayName: 'You' },
      ...BOT_NAMES.slice(0, playerCount - 1).map((name, i) => ({
        uid: `bot${i}`,
        displayName: name,
      })),
    ];

    const created = engine.createInitialState(seats, config, rng, now);
    if (!created.ok) {
      set({ error: created.error.message });
      return;
    }
    set((prev) => ({
      state: created.value,
      error: null,
      sessionId: prev.sessionId + 1,
      endedReason: null,
      // A fresh session starts with a clean room; stale drop notices from the
      // last game would otherwise pop up over the new one.
      peerEvents: [],
    }));
  },

  ackRole: () => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const rng = createRng(now >>> 0);
    const r = engine.reduce(state, { type: 'ACK_ROLE' }, { uid: HUMAN_UID, now, rng });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, driveBots(r.value, now, rng), set);
  },

  nightAction: (target) => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const rng = createRng(now >>> 0);
    const r = engine.reduce(state, { type: 'NIGHT_ACTION', target }, { uid: HUMAN_UID, now, rng });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, driveBots(r.value, now, rng), set);
  },

  vote: (target) => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const rng = createRng(now >>> 0);
    const r = engine.reduce(state, { type: 'VOTE', target }, { uid: HUMAN_UID, now, rng });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, driveBots(r.value, now, rng), set);
  },

  openVoting: () => {
    const { state } = get();
    if (!state || state.phase !== 'day_discussion') return;
    const now = Date.now();
    const rng = createRng(now >>> 0);
    // tick past the discussion deadline to open the vote
    const advanced = engine.tick(state, state.deadlineAt);
    commit(state, driveBots(advanced, now, rng), set);
  },

  clearError: () => set({ error: null }),

  notePeerEvent: (event) => set((s) => ({ peerEvents: [...s.peerEvents, event] })),

  dismissPeerEvent: () => set((s) => ({ peerEvents: s.peerEvents.slice(1) })),

  endForDisconnect: () => {
    // Nothing in progress: an outage on the home screen must not manufacture
    // a "you were dropped from your game" that never happened.
    if (!get().state) return false;
    set({ state: null, endedReason: 'disconnected', peerEvents: [] });
    return true;
  },
}));

/** The human's projection — exactly what the server would send them (§9.1). */
export function useMyView(): VVPlayerView | null {
  const state = useLocalGame((s) => s.state);
  if (!state) return null;
  return engine.projectFor(state, HUMAN_UID);
}
