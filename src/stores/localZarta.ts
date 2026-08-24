import { create } from 'zustand';

import { createRng } from '@/features/games/core/rng';
import type { PlayerSeat } from '@/features/games/core/types';
import { DEFAULT_ZARTA_CONFIG, type ZartaConfig } from '@/features/games/zarta/config';
import engine from '@/features/games/zarta/engine';
import type { ZartaState } from '@/features/games/zarta/state';
import { useProgression } from './progression';

/**
 * Local, offline Zarta driver — the pass-and-play sibling of `localTaboo.ts`
 * and `localSketch.ts`, with one more layer of hand-off than either: every
 * seat writes a bluff and every seat votes, every round, so the phone
 * changes hands twice as often. `useZartaView` always projects whoever is at
 * the front of the active queue (`pendingWriters` during `writing`,
 * `pendingVoters` during `voting`) — during `round_recap`/`game_over` there
 * is no active seat left to project for (both queues are empty, the round's
 * result is public to everyone), so it falls back to `HUMAN_UID`, same as
 * every other local store uses for XP/gold attribution.
 *
 * No bots, for the same reason Taboo and Sketch It have none: writing a
 * plausible lie and reading five short answers are not decisions an engine
 * can make on a human's behalf.
 */

export const HUMAN_UID = 'you';

const seatNames = (count: number): PlayerSeat[] =>
  Array.from({ length: count }, (_, i) =>
    i === 0 ? { uid: HUMAN_UID, displayName: 'You' } : { uid: `p${i}`, displayName: `Player ${i + 1}` },
  );

function settleIfFinished(before: ZartaState | null, after: ZartaState) {
  if (after.phase !== 'game_over' || before?.phase === 'game_over') return;

  const results = engine.calculateResults(after);
  const you = results.players.find((p) => p.uid === HUMAN_UID);

  useProgression.getState().recordGameFinished({
    gameId: 'zarta',
    won: !!you?.won,
    roundsSurvived: after.round,
  });
}

function commit(before: ZartaState | null, after: ZartaState, set: (partial: Partial<LocalZartaStore>) => void) {
  set({ state: after, error: null });
  settleIfFinished(before, after);
}

interface LocalZartaStore {
  state: ZartaState | null;
  error: string | null;
  sessionId: number;

  newGame: (playerCount?: number, config?: ZartaConfig) => void;
  /** The player at the front of the active queue confirms they're looking
   *  at the screen and starts their own clock — dismisses the "pass the
   *  phone" curtain. */
  ready: () => void;
  /** The player at the front of `pendingWriters` submits their bluff. */
  submitAnswer: (text: string) => void;
  /** The player at the front of `pendingVoters` casts their vote. */
  submitVote: (optionId: string) => void;
  continueRound: () => void;
  /** Called by the writing/voting screen's own clock once the deadline
   *  passes — the deadline lives in state, but nothing polls it without a
   *  timer. Forfeits whoever is currently up, same as Taboo's `endTurnNow`. */
  forfeitTurnNow: () => void;
  clearError: () => void;
}

export const useLocalZarta = create<LocalZartaStore>((set, get) => ({
  state: null,
  error: null,
  sessionId: 0,

  newGame: (playerCount = 4, config = DEFAULT_ZARTA_CONFIG) => {
    const now = Date.now();
    const rng = createRng(now >>> 0);
    const created = engine.createInitialState(seatNames(playerCount), config, rng, now);
    if (!created.ok) {
      set({ error: created.error.message });
      return;
    }
    set((prev) => ({ state: created.value, error: null, sessionId: prev.sessionId + 1 }));
  },

  ready: () => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const uid = state.pendingWriters[0] ?? state.pendingVoters[0];
    if (!uid) return;
    const r = engine.reduce(state, { type: 'READY' }, { uid, now, rng: createRng(now) });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, r.value, set);
  },

  submitAnswer: (text) => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const writer = state.pendingWriters[0];
    if (!writer) return;
    const r = engine.reduce(state, { type: 'SUBMIT_ANSWER', text }, { uid: writer, now, rng: createRng(now) });
    if (!r.ok) return set({ error: r.error.message });
    // A submission can end writing itself (moves to voting — see engine.ts),
    // and the deadline may also have already passed — tick catches both
    // before committing, same belt-and-braces every local store here applies.
    commit(state, engine.tick(r.value, now), set);
  },

  submitVote: (optionId) => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const voter = state.pendingVoters[0];
    if (!voter) return;
    const r = engine.reduce(state, { type: 'SUBMIT_VOTE', optionId }, { uid: voter, now, rng: createRng(now) });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, engine.tick(r.value, now), set);
  },

  continueRound: () => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    // Any seated player may advance past the recap — the engine does not
    // care who, so this attributes it to whoever is actually holding the
    // phone right now.
    const r = engine.reduce(state, { type: 'CONTINUE' }, { uid: state.order[0], now, rng: createRng(now) });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, r.value, set);
  },

  forfeitTurnNow: () => {
    const { state } = get();
    if (!state || (state.phase !== 'writing' && state.phase !== 'voting')) return;
    commit(state, engine.tick(state, state.deadlineAt), set);
  },

  clearError: () => set({ error: null }),
}));

/**
 * Whoever should currently be looking at the screen — see the file header.
 * Exactly what the server would send that seat (§9.1); this is not a
 * shortcut, it is the same `projectFor` a real remote client would call.
 */
export function useZartaView() {
  const state = useLocalZarta((s) => s.state);
  if (!state) return null;
  const activeUid = state.pendingWriters[0] ?? state.pendingVoters[0] ?? HUMAN_UID;
  return engine.projectFor(state, activeUid);
}
