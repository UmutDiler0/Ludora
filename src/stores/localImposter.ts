import { create } from 'zustand';

import { createRng } from '@/features/games/core/rng';
import type { PlayerSeat } from '@/features/games/core/types';
import { DEFAULT_IMPOSTER_CONFIG, type ImposterConfig } from '@/features/games/imposter/config';
import engine from '@/features/games/imposter/engine';
import type { ImposterState } from '@/features/games/imposter/state';
import { useProgression } from './progression';

/**
 * Local, offline Imposter driver — the pass-and-play sibling of
 * `localTaboo.ts`/`localSketch.ts`/`localZarta.ts`. No bots, for the same
 * reason those three have none: only a real person can hold a bluff, and
 * only a real person can be trusted not to give the imposter away.
 *
 * `useImposterView` projects for the currently-revealing seat during
 * `role_reveal` and the currently-voting seat during `voting` — same
 * privacy discipline Zarta's `useZartaView` keeps. `discussion` has no
 * single active seat (everyone shares the screen and talks), so it falls
 * back to `HUMAN_UID`; the discussion screen itself never renders
 * `view.value`, since that's exactly the private information each seat
 * already received individually during their own role reveal — showing it
 * again on the shared screen would hand it to the imposter, whoever that
 * physically turns out to be. For the same reason, `guessValue` always
 * dispatches as `state.imposterUid` rather than whichever seat the view
 * happens to be projecting — the "Guess" control is visible to the whole
 * table (there's no way to hide it from just one physical player on a
 * shared device), and the app already trusts whoever is holding the phone
 * the same way Vampire Village's local Day screen does.
 */

export const HUMAN_UID = 'you';

/** Exported so the lobby screen can preview the exact seats `newGame` will assign. */
export const seatNames = (count: number): PlayerSeat[] =>
  Array.from({ length: count }, (_, i) =>
    i === 0 ? { uid: HUMAN_UID, displayName: 'You' } : { uid: `p${i}`, displayName: `Player ${i + 1}` },
  );

function settleIfFinished(before: ImposterState | null, after: ImposterState) {
  if (after.phase !== 'game_over' || before?.phase === 'game_over') return;

  const results = engine.calculateResults(after);
  const you = results.players.find((p) => p.uid === HUMAN_UID);

  useProgression.getState().recordGameFinished({
    gameId: 'imposter',
    won: !!you?.won,
    roundsSurvived: 1,
  });
}

function commit(before: ImposterState | null, after: ImposterState, set: (partial: Partial<LocalImposterStore>) => void) {
  set({ state: after, error: null });
  settleIfFinished(before, after);
}

interface LocalImposterStore {
  state: ImposterState | null;
  error: string | null;
  sessionId: number;

  newGame: (playerCount?: number, config?: ImposterConfig) => void;
  /** The next unacked seat confirms they've read their role and passes the phone on. */
  ackRole: () => void;
  /** Anyone at the table calls a vote — the engine doesn't care who. */
  callVote: () => void;
  /** The player at the front of `pendingVoters` accuses `target`. */
  submitVote: (target: string) => void;
  /** The imposter guesses the secret value — see the file header for why
   *  this always dispatches as `state.imposterUid`. */
  guessValue: (valueId: string) => void;
  /** Called by the discussion screen's own clock once the deadline passes. */
  timeUp: () => void;
  clearError: () => void;
}

export const useLocalImposter = create<LocalImposterStore>((set, get) => ({
  state: null,
  error: null,
  sessionId: 0,

  newGame: (playerCount = 5, config = DEFAULT_IMPOSTER_CONFIG) => {
    const now = Date.now();
    const rng = createRng(now >>> 0);
    const created = engine.createInitialState(seatNames(playerCount), config, rng, now);
    if (!created.ok) {
      set({ error: created.error.message });
      return;
    }
    set((prev) => ({ state: created.value, error: null, sessionId: prev.sessionId + 1 }));
  },

  ackRole: () => {
    const { state } = get();
    if (!state || state.phase !== 'role_reveal') return;
    const uid = state.order.find((u) => !state.acked.includes(u));
    if (!uid) return;
    const now = Date.now();
    const r = engine.reduce(state, { type: 'ACK_ROLE' }, { uid, now, rng: createRng(now) });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, engine.tick(r.value, now), set);
  },

  callVote: () => {
    const { state } = get();
    if (!state || state.phase !== 'discussion') return;
    const now = Date.now();
    const r = engine.reduce(state, { type: 'CALL_VOTE' }, { uid: state.order[0], now, rng: createRng(now) });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, r.value, set);
  },

  submitVote: (target) => {
    const { state } = get();
    if (!state) return;
    const voter = state.pendingVoters[0];
    if (!voter) return;
    const now = Date.now();
    const r = engine.reduce(state, { type: 'SUBMIT_VOTE', target }, { uid: voter, now, rng: createRng(now) });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, r.value, set);
  },

  guessValue: (valueId) => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const r = engine.reduce(
      state,
      { type: 'GUESS_VALUE', valueId },
      { uid: state.imposterUid, now, rng: createRng(now) },
    );
    if (!r.ok) return set({ error: r.error.message });
    commit(state, r.value, set);
  },

  timeUp: () => {
    const { state } = get();
    if (!state || (state.phase !== 'discussion' && state.phase !== 'voting')) return;
    commit(state, engine.tick(state, state.deadlineAt), set);
  },

  clearError: () => set({ error: null }),
}));

/**
 * Whoever should currently be looking at the screen — see the file header
 * for why `discussion` falls back to `HUMAN_UID` rather than any real active
 * seat.
 */
export function useImposterView() {
  const state = useLocalImposter((s) => s.state);
  if (!state) return null;
  const activeUid =
    state.phase === 'role_reveal'
      ? (state.order.find((u) => !state.acked.includes(u)) ?? HUMAN_UID)
      : state.phase === 'voting'
        ? (state.pendingVoters[0] ?? HUMAN_UID)
        : HUMAN_UID;
  return engine.projectFor(state, activeUid);
}
