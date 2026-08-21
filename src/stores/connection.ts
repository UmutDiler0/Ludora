import { create } from 'zustand';

import {
  delayForAttempt,
  nextStatus,
  RECONNECT,
  secondsLeft,
  shouldGiveUp,
  type ConnectionStatus,
} from '@/features/network/policy';
import { httpProbe } from '@/services/network/httpProbe';
import { presenceGateway } from '@/services/network/mockPresence';
import type { ConnectivityProbe } from '@/services/network/types';
import { useLocalGame } from './localGame';

/**
 * App-wide connection state (docs/ARCHITECTURE.md §14).
 *
 * All the *decisions* live in `features/network/policy.ts` and are unit-tested
 * against a fake clock. This store owns only the things that cannot be pure:
 * the timers, the probe, and the two side effects an outage triggers — telling
 * the room we are gone, and ending a game we can no longer play.
 */

interface ConnectionState {
  status: ConnectionStatus;
  /** When the current outage began, or null while connected. */
  outageStartedAt: number | null;
  /** Failed probes in the current outage. Shown so the dialog is not a black box. */
  attempt: number;
  /** Seconds before we stop trying. Drives the countdown. */
  countdown: number;
  /** True once we have given up *and* it cost the user a game. */
  droppedFromGame: boolean;
  /**
   * The user waved the dialog away. Kept separate from `status` because the
   * connection is still broken — we have only stopped saying so.
   */
  dismissed: boolean;

  start: () => void;
  stop: () => void;
  /** Manual "Try again" from the dialog. */
  retry: () => void;
  /** Stop waiting now, rather than riding out the rest of the grace window. */
  giveUpNow: () => void;
  dismiss: () => void;
  /** Test seam: force an outage without unplugging anything. */
  simulateOutage: () => void;
}

/** Swappable for tests; the app uses the HTTP probe. */
let probe: ConnectivityProbe = httpProbe;
export const __setProbe = (next: ConnectivityProbe) => {
  probe = next;
};

let probeTimer: ReturnType<typeof setTimeout> | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;
/** Guards against two probe loops running after a fast retry. */
let generation = 0;

function clearTimers() {
  if (probeTimer) clearTimeout(probeTimer);
  if (tickTimer) clearInterval(tickTimer);
  probeTimer = null;
  tickTimer = null;
}

export const useConnection = create<ConnectionState>((set, get) => {
  /**
   * The end of an outage we lost. Shared by the grace-window expiry and the
   * user pressing "Stop waiting", because the consequences are identical —
   * only the trigger differs.
   */
  const settleAsDisconnected = (startedAt: number) => {
    clearTimers();
    generation += 1;
    set({
      status: nextStatus(get().status, { type: 'GAVE_UP' }),
      outageStartedAt: startedAt,
      countdown: 0,
      dismissed: false,
    });

    // Two things the user notices, in this order: the room is told we are
    // gone, and the game we can no longer play stops pretending otherwise.
    presenceGateway.publish(false);
    set({ droppedFromGame: useLocalGame.getState().endForDisconnect() });
  };

  /** One probe, then either settle or schedule the next. */
  const runProbe = async (myGeneration: number) => {
    const reachable = await probe.reach(RECONNECT.probeTimeoutMs);
    // A retry or stop happened while we were waiting; this result is stale.
    if (myGeneration !== generation) return;

    if (reachable) {
      clearTimers();
      const wasDown = get().status !== 'connected';
      set({
        status: nextStatus(get().status, { type: 'PROBE_OK' }),
        outageStartedAt: null,
        attempt: 0,
        countdown: 0,
        droppedFromGame: false,
        // Recovery clears the dismissal: the next outage is a new event and
        // deserves to be announced again.
        dismissed: false,
      });
      if (wasDown) presenceGateway.publish(true);
      return;
    }

    const now = Date.now();
    const startedAt = get().outageStartedAt ?? now;
    const outageMs = now - startedAt;

    if (shouldGiveUp(outageMs)) {
      settleAsDisconnected(startedAt);
      return;
    }

    const attempt = get().attempt + 1;
    set({
      status: nextStatus(get().status, { type: 'PROBE_FAILED' }),
      outageStartedAt: startedAt,
      attempt,
      countdown: secondsLeft(outageMs),
    });

    probeTimer = setTimeout(() => void runProbe(myGeneration), delayForAttempt(attempt));
  };

  /** Keeps the countdown moving between probes, which are seconds apart. */
  const startTicking = () => {
    if (tickTimer) return;
    tickTimer = setInterval(() => {
      const { outageStartedAt, status } = get();
      if (outageStartedAt === null || status === 'connected') return;
      set({ countdown: secondsLeft(Date.now() - outageStartedAt) });
    }, 500);
  };

  const begin = (fromOutage: boolean) => {
    clearTimers();
    generation += 1;
    const myGeneration = generation;
    const now = Date.now();

    set((s) => ({
      status: fromOutage
        ? nextStatus(s.status, { type: 'RETRY' })
        : nextStatus(s.status, { type: 'START' }),
      outageStartedAt: fromOutage ? now : s.outageStartedAt,
      attempt: 0,
      countdown: fromOutage ? secondsLeft(0) : 0,
      droppedFromGame: fromOutage ? false : s.droppedFromGame,
      dismissed: false,
    }));

    if (fromOutage) startTicking();
    void runProbe(myGeneration);
  };

  return {
    status: 'connecting',
    outageStartedAt: null,
    attempt: 0,
    countdown: 0,
    droppedFromGame: false,
    dismissed: false,

    start: () => {
      startTicking();
      begin(false);
    },

    stop: () => {
      clearTimers();
      generation += 1;
    },

    retry: () => begin(true),

    giveUpNow: () => settleAsDisconnected(get().outageStartedAt ?? Date.now()),

    dismiss: () => set({ dismissed: true, droppedFromGame: false }),

    simulateOutage: () => {
      clearTimers();
      generation += 1;
      const myGeneration = generation;
      set({
        status: 'reconnecting',
        outageStartedAt: Date.now(),
        attempt: 1,
        countdown: secondsLeft(0),
      });
      startTicking();
      probeTimer = setTimeout(() => void runProbe(myGeneration), delayForAttempt(1));
    },
  };
});
