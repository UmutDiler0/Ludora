/**
 * Reconnection policy (docs/ARCHITECTURE.md §14).
 *
 * Pure, like the game engines: no timers, no fetch, no store. Everything that
 * decides *when to retry* and *when to give up* lives here so it can be tested
 * against a clock we control rather than a real outage we cannot reproduce.
 * The store in `stores/connection.ts` owns the side effects and calls into this.
 */

/** The single app-wide status §14 specifies. */
export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export type ConnectionEvent =
  | { type: 'START' }
  | { type: 'PROBE_OK' }
  | { type: 'PROBE_FAILED' }
  | { type: 'GAVE_UP' }
  | { type: 'RETRY' };

export const RECONNECT = {
  /**
   * Delay before attempt N. The last entry repeats, so the interval settles
   * rather than growing without bound inside the grace window.
   */
  backoffMs: [0, 1_500, 3_000, 4_000] as const,
  /**
   * How long an outage may run before we stop trying and say so. Long enough
   * to ride out a lift or a tunnel, short enough that "trying to connect" is
   * never a lie the user has to sit through.
   */
  graceMs: 12_000,
  /** A probe that has not answered by now counts as a failure. */
  probeTimeoutMs: 4_000,
} as const;

export function delayForAttempt(attempt: number): number {
  const i = Math.min(Math.max(attempt, 0), RECONNECT.backoffMs.length - 1);
  return RECONNECT.backoffMs[i];
}

/** True once the outage has run past the grace window. */
export const shouldGiveUp = (outageMs: number, graceMs: number = RECONNECT.graceMs): boolean =>
  outageMs >= graceMs;

/** Whole seconds left before we give up — what the countdown renders. */
export const secondsLeft = (outageMs: number, graceMs: number = RECONNECT.graceMs): number =>
  Math.max(0, Math.ceil((graceMs - outageMs) / 1000));

/**
 * Status transitions.
 *
 * `connecting` is only ever the first attempt of a session; every later failure
 * is `reconnecting`, because the two say different things to the user — one is
 * "starting up", the other is "you had this and lost it".
 */
export function nextStatus(current: ConnectionStatus, event: ConnectionEvent): ConnectionStatus {
  switch (event.type) {
    case 'START':
      return current === 'connected' ? 'connected' : 'connecting';
    case 'PROBE_OK':
      return 'connected';
    case 'PROBE_FAILED':
      return 'reconnecting';
    case 'GAVE_UP':
      return 'disconnected';
    case 'RETRY':
      return 'reconnecting';
  }
}

/** Whether the app should be blocking the screen and asking the user to wait. */
export const isInterrupted = (status: ConnectionStatus): boolean =>
  status === 'reconnecting' || status === 'disconnected';
