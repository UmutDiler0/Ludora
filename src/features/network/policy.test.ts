import {
  delayForAttempt,
  isInterrupted,
  nextStatus,
  RECONNECT,
  secondsLeft,
  shouldGiveUp,
  type ConnectionStatus,
} from './policy';

describe('reconnect backoff', () => {
  it('retries immediately on the first attempt', () => {
    // The first retry after a blip should not make the user wait at all.
    expect(delayForAttempt(0)).toBe(0);
  });

  it('backs off on later attempts', () => {
    expect(delayForAttempt(1)).toBeGreaterThan(delayForAttempt(0));
    expect(delayForAttempt(2)).toBeGreaterThan(delayForAttempt(1));
  });

  it('settles rather than growing without bound', () => {
    const last = RECONNECT.backoffMs[RECONNECT.backoffMs.length - 1];
    expect(delayForAttempt(99)).toBe(last);
  });

  it('clamps a negative attempt instead of returning undefined', () => {
    expect(delayForAttempt(-3)).toBe(RECONNECT.backoffMs[0]);
  });

  it('never schedules a retry beyond the grace window', () => {
    // A backoff longer than the grace period would mean giving up while a
    // retry is still pending — the user would watch a spinner do nothing.
    for (let attempt = 0; attempt < 10; attempt++) {
      expect(delayForAttempt(attempt)).toBeLessThan(RECONNECT.graceMs);
    }
  });
});

describe('giving up', () => {
  it('keeps trying inside the grace window', () => {
    expect(shouldGiveUp(0)).toBe(false);
    expect(shouldGiveUp(RECONNECT.graceMs - 1)).toBe(false);
  });

  it('gives up once the window has elapsed', () => {
    expect(shouldGiveUp(RECONNECT.graceMs)).toBe(true);
    expect(shouldGiveUp(RECONNECT.graceMs + 5_000)).toBe(true);
  });

  it('honours a caller-supplied window', () => {
    expect(shouldGiveUp(3_000, 5_000)).toBe(false);
    expect(shouldGiveUp(6_000, 5_000)).toBe(true);
  });
});

describe('countdown', () => {
  it('reports the full window at the start of an outage', () => {
    expect(secondsLeft(0, 12_000)).toBe(12);
  });

  it('counts down and never goes negative', () => {
    expect(secondsLeft(11_500, 12_000)).toBe(1);
    expect(secondsLeft(12_000, 12_000)).toBe(0);
    expect(secondsLeft(99_000, 12_000)).toBe(0);
  });

  it('rounds up, so it never shows 0 while still trying', () => {
    // Showing "0s" beside a live spinner reads as a frozen UI.
    expect(secondsLeft(11_999, 12_000)).toBe(1);
  });
});

describe('status transitions', () => {
  it('starts in connecting, not reconnecting', () => {
    // A cold start has nothing to reconnect to; the copy differs.
    expect(nextStatus('disconnected', { type: 'START' })).toBe('connecting');
  });

  it('does not disturb an already-healthy connection on start', () => {
    expect(nextStatus('connected', { type: 'START' })).toBe('connected');
  });

  it('treats any failure after the first attempt as reconnecting', () => {
    expect(nextStatus('connecting', { type: 'PROBE_FAILED' })).toBe('reconnecting');
    expect(nextStatus('connected', { type: 'PROBE_FAILED' })).toBe('reconnecting');
  });

  it('recovers from every state on a successful probe', () => {
    const all: ConnectionStatus[] = ['connected', 'connecting', 'reconnecting', 'disconnected'];
    for (const status of all) {
      expect(nextStatus(status, { type: 'PROBE_OK' })).toBe('connected');
    }
  });

  it('lets a manual retry leave the given-up state', () => {
    expect(nextStatus('disconnected', { type: 'RETRY' })).toBe('reconnecting');
  });

  it('ends in disconnected when the grace window expires', () => {
    expect(nextStatus('reconnecting', { type: 'GAVE_UP' })).toBe('disconnected');
  });
});

describe('isInterrupted', () => {
  it('is false while working or first connecting', () => {
    // `connecting` must not raise the blocking dialog, or every cold start
    // would flash it before the first probe answers.
    expect(isInterrupted('connected')).toBe(false);
    expect(isInterrupted('connecting')).toBe(false);
  });

  it('is true once the user has actually lost something', () => {
    expect(isInterrupted('reconnecting')).toBe(true);
    expect(isInterrupted('disconnected')).toBe(true);
  });
});
