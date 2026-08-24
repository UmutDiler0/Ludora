import { create } from 'zustand';

import { createRng } from '@/features/games/core/rng';
import type { PlayerSeat } from '@/features/games/core/types';
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from '@/features/games/sketchIt/config';
import engine from '@/features/games/sketchIt/engine';
import type { SketchState } from '@/features/games/sketchIt/state';
import { useProgression } from './progression';

/**
 * Local, offline Sketch It driver — the pass-and-play sibling of
 * `localTaboo.ts`, and built on exactly the same shape for exactly the same
 * reason: there are no bots, because holding the pen is not something an
 * engine can do on a human's behalf. Every seat is a real person physically
 * taking a turn with the device, so `useSketchView` always projects
 * `state.artistUid` — during `round_intro` and `drawing` that is the one
 * person allowed to see the word (and the only one who should be able to
 * draw), and at every other phase it is simply whoever is holding the phone.
 *
 * `HUMAN_UID` means what it does in `localTaboo.ts`: the one seat tied to
 * this device's profile, used only to decide whose XP and gold this session
 * pays into — never to pick whose screen is showing.
 */

export const HUMAN_UID = 'you';

/** Exported so the lobby screen can preview the exact seats `newGame` will assign. */
export const seatNames = (count: number): PlayerSeat[] =>
  Array.from({ length: count }, (_, i) =>
    i === 0 ? { uid: HUMAN_UID, displayName: 'You' } : { uid: `p${i}`, displayName: `Player ${i + 1}` },
  );

function settleIfFinished(before: SketchState | null, after: SketchState) {
  if (after.phase !== 'game_over' || before?.phase === 'game_over') return;

  const results = engine.calculateResults(after);
  const you = results.players.find((p) => p.uid === HUMAN_UID);

  useProgression.getState().recordGameFinished({
    gameId: 'drawingGuess',
    won: !!you?.won,
    roundsSurvived: after.round,
  });
}

function commit(before: SketchState | null, after: SketchState, set: (partial: Partial<LocalSketchStore>) => void) {
  set({ state: after, error: null });
  settleIfFinished(before, after);
}

interface LocalSketchStore {
  state: SketchState | null;
  error: string | null;
  sessionId: number;

  newGame: (playerCount?: number, config?: SketchConfig) => void;
  startRound: () => void;
  /** The artist taps a name as soon as it's shouted out correctly. */
  markGuess: (uid: string) => void;
  continueRound: () => void;
  /** Called by the drawing screen's own clock once the deadline passes —
   *  the deadline lives in state, but nothing polls it without a timer. */
  endRoundNow: () => void;
  clearError: () => void;
}

export const useLocalSketch = create<LocalSketchStore>((set, get) => ({
  state: null,
  error: null,
  sessionId: 0,

  newGame: (playerCount = 4, config = DEFAULT_SKETCH_CONFIG) => {
    const now = Date.now();
    const rng = createRng(now >>> 0);
    const created = engine.createInitialState(seatNames(playerCount), config, rng, now);
    if (!created.ok) {
      set({ error: created.error.message });
      return;
    }
    set((prev) => ({ state: created.value, error: null, sessionId: prev.sessionId + 1 }));
  },

  startRound: () => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const r = engine.reduce(state, { type: 'START_ROUND' }, { uid: state.artistUid, now, rng: createRng(now) });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, r.value, set);
  },

  markGuess: (uid) => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const r = engine.reduce(
      state,
      { type: 'MARK_GUESS', uid },
      { uid: state.artistUid, now, rng: createRng(now) },
    );
    if (!r.ok) return set({ error: r.error.message });
    // A MARK_GUESS can end the round itself (see engine.ts), and the
    // deadline may also have already passed — tick catches both before
    // committing, same belt-and-braces the Taboo store applies after MARK.
    commit(state, engine.tick(r.value, now), set);
  },

  continueRound: () => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    // Any seated player may advance past the recap — the engine does not
    // care who, so this attributes it to whoever is actually holding the
    // phone right now.
    const r = engine.reduce(
      state,
      { type: 'CONTINUE' },
      { uid: state.artistUid, now, rng: createRng(now) },
    );
    if (!r.ok) return set({ error: r.error.message });
    commit(state, r.value, set);
  },

  endRoundNow: () => {
    const { state } = get();
    if (!state || state.phase !== 'drawing') return;
    commit(state, engine.tick(state, state.deadlineAt), set);
  },

  clearError: () => set({ error: null }),
}));

/**
 * Whoever should currently be looking at the screen — see the file header.
 * Exactly what the server would send that seat (§9.1); this is not a
 * shortcut, it is the same `projectFor` a real remote client would call.
 */
export function useSketchView() {
  const state = useLocalSketch((s) => s.state);
  if (!state) return null;
  return engine.projectFor(state, state.artistUid);
}
