import { create } from 'zustand';

import { createRng } from '@/features/games/core/rng';
import type { PlayerSeat } from '@/features/games/core/types';
import { DEFAULT_TABOO_CONFIG, type TabooConfig } from '@/features/games/taboo/config';
import engine from '@/features/games/taboo/engine';
import type { TabooCardResult, TabooState } from '@/features/games/taboo/state';
import { useProgression } from './progression';

/**
 * Local, offline Taboo driver — the pass-and-play sibling of `localGame.ts`,
 * and a genuinely different shape of "local" from it.
 *
 * There are no bots here, and there cannot be: Vampire Village's bots can vote
 * and act because those are decisions an engine can make for them, but Taboo is
 * played out loud — describing a word is not something an AI seat can do on a
 * human's behalf. Every seat is a real person physically taking a turn with
 * the device, which has a consequence VV never had to deal with: *the screen
 * has to render a different player's view depending on whose turn it is.*
 * `useTabooView` below always projects `state.describerUid` for exactly that
 * reason — during `describing` that is the one person allowed to see the
 * card, and at every other phase it is simply whoever is holding the phone.
 *
 * `HUMAN_UID` still exists, but means something narrower than it does in
 * `localGame.ts`: it is the one seat tied to this device's profile, used only
 * to decide whose XP and gold this session pays into — never to pick whose
 * screen is showing.
 */

export const HUMAN_UID = 'you';

const seatNames = (count: number): PlayerSeat[] =>
  Array.from({ length: count }, (_, i) =>
    i === 0 ? { uid: HUMAN_UID, displayName: 'You' } : { uid: `p${i}`, displayName: `Player ${i + 1}` },
  );

function settleIfFinished(before: TabooState | null, after: TabooState) {
  if (after.phase !== 'game_over' || before?.phase === 'game_over') return;

  const results = engine.calculateResults(after);
  const you = results.players.find((p) => p.uid === HUMAN_UID);

  useProgression.getState().recordGameFinished({
    gameId: 'taboo',
    won: !!you?.won,
    roundsSurvived: after.turn,
  });
}

function commit(before: TabooState | null, after: TabooState, set: (partial: Partial<LocalTabooStore>) => void) {
  set({ state: after, error: null });
  settleIfFinished(before, after);
}

interface LocalTabooStore {
  state: TabooState | null;
  error: string | null;
  sessionId: number;

  newGame: (playerCount?: number, config?: TabooConfig) => void;
  /** Starts from a roster the room owner built by hand — named seats, each
   *  already assigned to a team. See `PlayerSeat.team` and engine.ts's
   *  `createInitialState`, which honours it when every seat carries one. */
  newGameWithRoster: (seats: PlayerSeat[], config?: TabooConfig) => void;
  startTurn: () => void;
  mark: (result: TabooCardResult) => void;
  continueTurn: () => void;
  /** Called by the describing screen's own clock once the deadline passes —
   *  the deadline lives in state, but nothing polls it without a timer. */
  endTurnNow: () => void;
  clearError: () => void;
}

export const useLocalTaboo = create<LocalTabooStore>((set, get) => ({
  state: null,
  error: null,
  sessionId: 0,

  newGame: (playerCount = 4, config = DEFAULT_TABOO_CONFIG) => {
    get().newGameWithRoster(seatNames(playerCount), config);
  },

  newGameWithRoster: (seats, config = DEFAULT_TABOO_CONFIG) => {
    const now = Date.now();
    const rng = createRng(now >>> 0);
    const created = engine.createInitialState(seats, config, rng, now);
    if (!created.ok) {
      set({ error: created.error.message });
      return;
    }
    set((prev) => ({ state: created.value, error: null, sessionId: prev.sessionId + 1 }));
  },

  startTurn: () => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const r = engine.reduce(state, { type: 'START_TURN' }, { uid: state.describerUid, now, rng: createRng(now) });
    if (!r.ok) return set({ error: r.error.message });
    commit(state, r.value, set);
  },

  mark: (result) => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    const r = engine.reduce(
      state,
      { type: 'MARK', result },
      { uid: state.describerUid, now, rng: createRng(now) },
    );
    if (!r.ok) return set({ error: r.error.message });
    // A MARK can run the deck out and end the turn itself (see engine.ts), and
    // the deadline may also have already passed — tick catches both before
    // committing, same belt-and-braces the VV store applies after every action.
    commit(state, engine.tick(r.value, now), set);
  },

  continueTurn: () => {
    const { state } = get();
    if (!state) return;
    const now = Date.now();
    // Any seated player may advance past the recap — the engine does not care
    // who, so this attributes it to whoever just finished describing, i.e.
    // whoever is actually holding the phone right now.
    const r = engine.reduce(
      state,
      { type: 'CONTINUE' },
      { uid: state.describerUid, now, rng: createRng(now) },
    );
    if (!r.ok) return set({ error: r.error.message });
    commit(state, r.value, set);
  },

  endTurnNow: () => {
    const { state } = get();
    if (!state || state.phase !== 'describing') return;
    commit(state, engine.tick(state, state.deadlineAt), set);
  },

  clearError: () => set({ error: null }),
}));

/**
 * Whoever should currently be looking at the screen — see the file header.
 * Exactly what the server would send that seat (§9.1); this is not a
 * shortcut, it is the same `projectFor` a real remote client would call.
 */
export function useTabooView() {
  const state = useLocalTaboo((s) => s.state);
  if (!state) return null;
  return engine.projectFor(state, state.describerUid);
}
