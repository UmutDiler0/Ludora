import { createRng } from '../core/rng';
import type { PlayerSeat, Result } from '../core/types';
import { DEFAULT_SKETCH_CONFIG } from './config';
import engine from './engine';
import type { SketchState } from './state';

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

const start = (n = 4, seed = 12345, now = 1_000_000, config = DEFAULT_SKETCH_CONFIG): SketchState =>
  unwrap(engine.createInitialState(seats(n), config, createRng(seed), now));

const startRound = (s: SketchState, now = 1_000_001) =>
  unwrap(engine.reduce(s, { type: 'START_ROUND' }, { uid: s.artistUid, now, rng: createRng(1) }));

const markGuess = (s: SketchState, uid: string, now = 1_000_002) =>
  unwrap(engine.reduce(s, { type: 'MARK_GUESS', uid }, { uid: s.artistUid, now, rng: createRng(2) }));

const continueRound = (s: SketchState, uid = s.artistUid, now = 1_000_003) =>
  unwrap(engine.reduce(s, { type: 'CONTINUE' }, { uid, now, rng: createRng(3) }));

const guessers = (s: SketchState) => s.order.filter((u) => u !== s.artistUid);

/* ---------------- setup ---------------- */

describe('createInitialState', () => {
  it('rejects too few players', () => {
    expectErr(engine.createInitialState(seats(2), DEFAULT_SKETCH_CONFIG, createRng(1), 0), 'NOT_ENOUGH_PLAYERS');
  });

  it('rejects too many players', () => {
    expectErr(engine.createInitialState(seats(9), DEFAULT_SKETCH_CONFIG, createRng(1), 0), 'TOO_MANY_PLAYERS');
  });

  it('seats every player exactly once in the draw order', () => {
    const s = start(6);
    expect(s.order).toHaveLength(6);
    expect(new Set(s.order).size).toBe(6);
  });

  it('starts on round 1, waiting to begin, with a prompt already dealt', () => {
    const s = start(4);
    expect(s.phase).toBe('round_intro');
    expect(s.round).toBe(1);
    expect(s.totalRounds).toBe(4);
    expect(s.artistUid).toBe(s.order[0]);
    expect(s.currentPromptId).not.toBeNull();
  });

  it('never shows the word to anyone but the artist', () => {
    const s = start(4);
    const artistView = engine.projectFor(s, s.artistUid);
    expect(artistView.word).not.toBeNull();
    for (const uid of guessers(s)) {
      expect(engine.projectFor(s, uid).word).toBeNull();
    }
  });
});

describe('round flow', () => {
  it('only the artist may start the clock', () => {
    const s = start(4);
    const someoneElse = guessers(s)[0];
    expectErr(
      engine.reduce(s, { type: 'START_ROUND' }, { uid: someoneElse, now: 1, rng: createRng(1) }),
      'NOT_YOUR_TURN',
    );
  });

  it('hides the word from everyone, including the artist, once drawing starts', () => {
    const s = startRound(start(4));
    expect(s.phase).toBe('drawing');
    expect(engine.projectFor(s, s.artistUid).word).toBeNull();
  });

  it('only the artist may mark a guess', () => {
    const s = startRound(start(4));
    const guesser = guessers(s)[0];
    expectErr(
      engine.reduce(s, { type: 'MARK_GUESS', uid: guesser }, { uid: guesser, now: 1, rng: createRng(1) }),
      'NOT_YOUR_TURN',
    );
  });

  it('scores guesses in descending order and never credits the artist', () => {
    let s = startRound(start(4));
    const [g0] = guessers(s);
    expectErr(engine.reduce(s, { type: 'MARK_GUESS', uid: s.artistUid }, { uid: s.artistUid, now: 1, rng: createRng(1) }), 'INVALID_TARGET');

    s = markGuess(s, g0);
    expect(s.guesses).toHaveLength(1);
    expect(s.guesses[0]).toMatchObject({ uid: g0, rank: 1, points: 100 });
    expect(s.scores[g0]).toBe(100);
  });

  it('refuses to double-credit the same guesser', () => {
    let s = startRound(start(4));
    const [g0] = guessers(s);
    s = markGuess(s, g0);
    expectErr(engine.reduce(s, { type: 'MARK_GUESS', uid: g0 }, { uid: s.artistUid, now: 1, rng: createRng(1) }), 'ALREADY_ACTED');
  });

  it('ends the round once everyone eligible has guessed, and scores the artist', () => {
    let s = startRound(start(4));
    for (const g of guessers(s)) s = markGuess(s, g);
    expect(s.phase).toBe('round_recap');
    // All three guessers got it, so the artist earns full credit.
    expect(s.scores[s.lastRound!.artistUid]).toBe(100);
    expect(s.lastRound!.guesses).toHaveLength(3);
  });

  it('ends the round on deadline via tick, crediting only guesses made so far', () => {
    let s = startRound(start(4));
    const [g0] = guessers(s);
    s = markGuess(s, g0);
    const afterDeadline = engine.tick(s, s.deadlineAt + 1);
    expect(afterDeadline.phase).toBe('round_recap');
    expect(afterDeadline.lastRound!.guesses).toHaveLength(1);
  });

  it('is idempotent once the round has already ended', () => {
    let s = startRound(start(4));
    s = engine.tick(s, s.deadlineAt + 1);
    const again = engine.tick(s, s.deadlineAt + 1000);
    expect(again).toEqual(s);
  });
});

describe('game progression', () => {
  it('rotates through every player exactly once, then ends the game', () => {
    let s = start(3);
    const seen = new Set<string>();
    for (let i = 0; i < 3; i++) {
      seen.add(s.artistUid);
      s = startRound(s);
      s = engine.tick(s, s.deadlineAt + 1);
      s = continueRound(s);
    }
    expect(seen.size).toBe(3);
    expect(s.phase).toBe('game_over');
  });

  it('declares a draw when the top score is shared', () => {
    let s = start(3);
    // Nobody ever guesses, so every artist scores 0 — a three-way draw.
    for (let i = 0; i < 3; i++) {
      s = startRound(s);
      s = engine.tick(s, s.deadlineAt + 1);
      s = continueRound(s);
    }
    expect(s.winner).toBe('draw');
  });

  it('only a seated player may continue past the recap', () => {
    let s = startRound(start(4));
    s = engine.tick(s, s.deadlineAt + 1);
    expectErr(engine.reduce(s, { type: 'CONTINUE' }, { uid: 'ghost', now: 1, rng: createRng(1) }), 'NOT_A_PLAYER');
  });
});

describe('projectFor', () => {
  it('lists who still needs to guess and who already has', () => {
    let s = startRound(start(4));
    const [g0, g1] = guessers(s);
    s = markGuess(s, g0);
    const view = engine.projectFor(s, s.artistUid);
    expect(view.guessers.map((g) => g.uid)).toEqual([g0]);
    expect(view.waitingOn.map((w) => w.uid)).toContain(g1);
    expect(view.waitingOn.map((w) => w.uid)).not.toContain(g0);
  });

  it('sorts the leaderboard by score descending', () => {
    let s = startRound(start(4));
    const [g0] = guessers(s);
    s = markGuess(s, g0);
    const view = engine.projectFor(s, s.artistUid);
    expect(view.leaderboard[0].uid).toBe(g0);
  });
});
