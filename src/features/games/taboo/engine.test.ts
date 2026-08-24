import { createRng } from '../core/rng';
import type { PlayerSeat, Result } from '../core/types';
import { DEFAULT_TABOO_CONFIG } from './config';
import engine from './engine';
import type { TabooState } from './state';

/* ---------------- helpers ---------------- */

const seats = (n: number): PlayerSeat[] =>
  Array.from({ length: n }, (_, i) => ({ uid: `u${i}`, displayName: `Player${i}` }));

const unwrap = <T>(r: Result<T>): T => {
  if (!r.ok) throw new Error(`expected ok, got ${r.error.code}: ${r.error.message}`);
  return r.value;
};

const expectErr = <T>(r: Result<T>, code: string) => {
  if (r.ok) throw new Error(`expected error ${code}, got ok`);
  expect(r.error.code).toBe(code);
};

const start = (n = 4, seed = 12345, now = 1_000_000, config = DEFAULT_TABOO_CONFIG): TabooState =>
  unwrap(engine.createInitialState(seats(n), config, createRng(seed), now));

const startTurn = (s: TabooState, now = 1_000_001) =>
  unwrap(engine.reduce(s, { type: 'START_TURN' }, { uid: s.describerUid, now, rng: createRng(1) }));

const mark = (s: TabooState, result: 'correct' | 'tabu' | 'skip', now = 1_000_002) =>
  unwrap(engine.reduce(s, { type: 'MARK', result }, { uid: s.describerUid, now, rng: createRng(2) }));

const continueTurn = (s: TabooState, uid = s.describerUid, now = 1_000_003) =>
  unwrap(engine.reduce(s, { type: 'CONTINUE' }, { uid, now, rng: createRng(3) }));

/* ---------------- setup ---------------- */

describe('createInitialState', () => {
  it('rejects too few players', () => {
    expectErr(engine.createInitialState(seats(3), DEFAULT_TABOO_CONFIG, createRng(1), 0), 'NOT_ENOUGH_PLAYERS');
  });

  it('rejects too many players', () => {
    expectErr(engine.createInitialState(seats(9), DEFAULT_TABOO_CONFIG, createRng(1), 0), 'TOO_MANY_PLAYERS');
  });

  it('splits every player onto exactly one of two teams', () => {
    const s = start(7);
    expect(s.teams.A.memberUids.length + s.teams.B.memberUids.length).toBe(7);
    const all = [...s.teams.A.memberUids, ...s.teams.B.memberUids];
    expect(new Set(all).size).toBe(7);
  });

  it('starts on team A, waiting to begin', () => {
    const s = start(4);
    expect(s.phase).toBe('turn_intro');
    expect(s.activeTeam).toBe('A');
    expect(s.describerUid).toBe(s.teams.A.memberUids[0]);
  });
});

describe('turn flow', () => {
  it('only the describer may start the clock', () => {
    const s = start(4);
    const someoneElse = s.teams.A.memberUids[1] ?? s.teams.B.memberUids[0];
    expectErr(
      engine.reduce(s, { type: 'START_TURN' }, { uid: someoneElse, now: 1, rng: createRng(1) }),
      'NOT_YOUR_TURN',
    );
  });

  it('deals a card once the turn starts', () => {
    const s = startTurn(start(4));
    expect(s.phase).toBe('describing');
    expect(s.currentCardId).not.toBeNull();
  });

  it('scores a point for a correct guess and deals the next card', () => {
    let s = startTurn(start(4));
    const firstCard = s.currentCardId;
    s = mark(s, 'correct');
    expect(s.teams.A.score).toBe(1);
    expect(s.currentCardId).not.toBe(firstCard);
    expect(s.turnEvents).toHaveLength(1);
    expect(s.turnEvents[0].result).toBe('correct');
  });

  it('costs a point for a taboo call, never going below zero', () => {
    let s = startTurn(start(4));
    s = mark(s, 'tabu');
    expect(s.teams.A.score).toBe(0);
  });

  it('does not touch the score on a skip', () => {
    let s = startTurn(start(4));
    s = mark(s, 'skip');
    expect(s.teams.A.score).toBe(0);
    expect(s.skipsUsed).toBe(1);
  });

  it('refuses a skip once the limit is spent', () => {
    let s = startTurn(start(4, 1, 1_000_000, { ...DEFAULT_TABOO_CONFIG, skipLimit: 1 }));
    s = mark(s, 'skip');
    expectErr(
      engine.reduce(s, { type: 'MARK', result: 'skip' }, { uid: s.describerUid, now: 1, rng: createRng(1) }),
      'ALREADY_ACTED',
    );
  });

  it('only the describer may mark a card', () => {
    const s = startTurn(start(4));
    const other = s.teams.B.memberUids[0];
    expectErr(
      engine.reduce(s, { type: 'MARK', result: 'correct' }, { uid: other, now: 1, rng: createRng(1) }),
      'NOT_YOUR_TURN',
    );
  });

  it('ends the turn on the deadline and banks the recap', () => {
    let s = startTurn(start(4));
    s = mark(s, 'correct');
    s = mark(s, 'tabu');
    s = engine.tick(s, s.deadlineAt);
    expect(s.phase).toBe('turn_recap');
    expect(s.lastTurnTeam).toBe('A');
    // One correct (+1) and one taboo (-1) nets to zero for the turn.
    expect(s.lastTurnGained).toBe(0);
    expect(s.lastTurnEvents).toHaveLength(2);
    // The live scratch list is cleared once it has been banked into the recap.
    expect(s.turnEvents).toHaveLength(0);
  });

  it('hands the next turn to the other team, rotating describers', () => {
    let s = start(4);
    const firstDescriber = s.describerUid;
    s = startTurn(s);
    s = mark(s, 'correct');
    s = engine.tick(s, s.deadlineAt);
    s = continueTurn(s);

    expect(s.turn).toBe(2);
    expect(s.activeTeam).toBe('B');
    expect(s.describerUid).toBe(s.teams.B.memberUids[0]);

    // Play team B's turn out too, then confirm team A's second describer is
    // not the same person who went first — the whole point of rotating.
    s = startTurn(s);
    s = engine.tick(s, s.deadlineAt);
    s = continueTurn(s);
    expect(s.activeTeam).toBe('A');
    if (s.teams.A.memberUids.length > 1) {
      expect(s.describerUid).not.toBe(firstDescriber);
    }
  });

  it('ends the game once a team reaches the target score', () => {
    let s = start(4, 1, 1_000_000, { ...DEFAULT_TABOO_CONFIG, targetScore: 1 });
    s = startTurn(s);
    s = mark(s, 'correct');
    s = engine.tick(s, s.deadlineAt);
    expect(s.winner).toBe('A');
    // The recap is still shown before game_over actually lands.
    expect(s.phase).toBe('turn_recap');
    s = continueTurn(s);
    expect(s.phase).toBe('game_over');
  });

  it('falls back to the higher score once the turn limit runs out', () => {
    let s = start(4, 1, 1_000_000, { ...DEFAULT_TABOO_CONFIG, targetScore: 999, maxTurns: 1 });
    s = startTurn(s);
    s = mark(s, 'correct');
    s = engine.tick(s, s.deadlineAt);
    expect(s.winner).toBe('A');
  });

  it('calls a tied game a draw rather than crowning either team', () => {
    let s = start(4, 1, 1_000_000, { ...DEFAULT_TABOO_CONFIG, targetScore: 999, maxTurns: 1 });
    s = startTurn(s);
    // Neither team scores — both sit at 0, which is still a tie.
    s = engine.tick(s, s.deadlineAt);
    expect(s.winner).toBe('draw');
  });
});

describe('projectFor', () => {
  it('shows the card only to the describer, and only once the turn is live', () => {
    let s = start(4);
    expect(engine.projectFor(s, s.describerUid).card).toBeNull();

    s = startTurn(s);
    const mine = engine.projectFor(s, s.describerUid);
    expect(mine.card).not.toBeNull();
    expect(mine.card?.forbidden.length).toBeGreaterThan(0);

    const other = s.teams.B.memberUids[0];
    expect(engine.projectFor(s, other).card).toBeNull();
  });

  it('never leaks the card through the serialised view', () => {
    const s = startTurn(start(4));
    const card = s.currentCardId!;
    for (const uid of [...s.teams.A.memberUids, ...s.teams.B.memberUids]) {
      if (uid === s.describerUid) continue;
      const serialised = JSON.stringify(engine.projectFor(s, uid));
      expect(serialised).not.toContain(card);
    }
  });

  it('keeps the live scratch list to the describer only', () => {
    let s = startTurn(start(4));
    s = mark(s, 'correct');
    expect(engine.projectFor(s, s.describerUid).turnEvents).toHaveLength(1);
    const other = s.teams.B.memberUids[0];
    expect(engine.projectFor(s, other).turnEvents).toHaveLength(0);
  });

  it('shows the finished recap to everyone', () => {
    let s = startTurn(start(4));
    s = mark(s, 'correct');
    s = engine.tick(s, s.deadlineAt);
    const other = s.teams.B.memberUids[0];
    expect(engine.projectFor(s, other).lastTurn?.events).toHaveLength(1);
  });
});

describe('calculateResults', () => {
  it('marks the winning team as won for every one of its members', () => {
    let s = start(4, 1, 1_000_000, { ...DEFAULT_TABOO_CONFIG, targetScore: 1 });
    s = startTurn(s);
    s = mark(s, 'correct');
    s = engine.tick(s, s.deadlineAt);
    s = continueTurn(s);

    const results = engine.calculateResults(s);
    expect(results.winner).toBe('A');
    for (const p of results.players) {
      expect(p.won).toBe(p.role === 'A');
      expect(p.survived).toBe(true);
    }
  });
});

describe('validateConfig', () => {
  it('accepts the classic preset', () => {
    expect(engine.validateConfig(DEFAULT_TABOO_CONFIG).ok).toBe(true);
  });

  it('rejects malformed config', () => {
    expectErr(engine.validateConfig(null), 'INVALID_CONFIG');
    expectErr(engine.validateConfig({ ...DEFAULT_TABOO_CONFIG, targetScore: 0 }), 'INVALID_CONFIG');
    expectErr(engine.validateConfig({ ...DEFAULT_TABOO_CONFIG, roundSeconds: 5 }), 'INVALID_CONFIG');
  });
});
