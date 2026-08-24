import { createRng } from '../core/rng';
import type { PlayerSeat, Result } from '../core/types';
import { DEFAULT_ZARTA_CONFIG } from './config';
import engine from './engine';
import { ZARTA_QUESTIONS } from './questions';
import type { ZartaState } from './state';

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

const start = (n = 4, seed = 12345, now = 1_000_000, config = DEFAULT_ZARTA_CONFIG): ZartaState =>
  unwrap(engine.createInitialState(seats(n), config, createRng(seed), now));

const ready = (s: ZartaState, uid: string, now = 1_000_000) =>
  unwrap(engine.reduce(s, { type: 'READY' }, { uid, now, rng: createRng(0) }));

/** Readies the current front-of-queue writer, then submits their answer. */
const submitAnswer = (s: ZartaState, text: string, now = 1_000_001) => {
  const uid = s.pendingWriters[0];
  const readied = ready(s, uid, now);
  return unwrap(engine.reduce(readied, { type: 'SUBMIT_ANSWER', text }, { uid, now, rng: createRng(1) }));
};

/** Writes a distinct, obviously-wrong bluff for every pending writer. */
function writeAllBluffs(s: ZartaState): ZartaState {
  let out = s;
  let n = 0;
  while (out.phase === 'writing' && out.pendingWriters.length > 0) {
    out = submitAnswer(out, `Bluff ${n}`);
    n += 1;
  }
  return out;
}

/** Readies the current front-of-queue voter, then casts their vote. */
const submitVote = (s: ZartaState, optionId: string, now = 1_000_002) => {
  const uid = s.pendingVoters[0];
  const readied = ready(s, uid, now);
  return unwrap(engine.reduce(readied, { type: 'SUBMIT_VOTE', optionId }, { uid, now, rng: createRng(2) }));
};

/** Every pending voter votes for the same option (skipped if they authored it). */
function everyoneVoteFor(s: ZartaState, optionId: string): ZartaState {
  let out = s;
  while (out.phase === 'voting' && out.pendingVoters.length > 0) {
    const voter = out.pendingVoters[0];
    const option = out.options!.find((o) => o.id === optionId)!;
    if (option.authorUids.includes(voter)) {
      // Can't vote for their own — vote for any other eligible option instead.
      const alt = out.options!.find((o) => !o.authorUids.includes(voter))!;
      out = submitVote(out, alt.id);
    } else {
      out = submitVote(out, optionId);
    }
  }
  return out;
}

const continueRound = (s: ZartaState, uid = s.order[0], now = 1_000_003) =>
  unwrap(engine.reduce(s, { type: 'CONTINUE' }, { uid, now, rng: createRng(3) }));

/* ---------------- setup ---------------- */

describe('createInitialState', () => {
  it('rejects too few players', () => {
    expectErr(engine.createInitialState(seats(2), DEFAULT_ZARTA_CONFIG, createRng(1), 0), 'NOT_ENOUGH_PLAYERS');
  });

  it('rejects too many players', () => {
    expectErr(engine.createInitialState(seats(11), DEFAULT_ZARTA_CONFIG, createRng(1), 0), 'TOO_MANY_PLAYERS');
  });

  it('starts in writing, with every player queued to submit a bluff', () => {
    const s = start(4);
    expect(s.phase).toBe('writing');
    expect(s.pendingWriters).toEqual(s.order);
    expect(s.currentQuestionId).not.toBeNull();
  });
});

describe('writing', () => {
  it('only the front of the queue may submit', () => {
    const s = start(4);
    const notFirst = s.pendingWriters[1];
    expectErr(
      engine.reduce(s, { type: 'SUBMIT_ANSWER', text: 'x' }, { uid: notFirst, now: 1, rng: createRng(1) }),
      'NOT_YOUR_TURN',
    );
  });

  it('rejects a blank submission', () => {
    const s = start(4);
    const writer = s.pendingWriters[0];
    const readied = ready(s, writer);
    expectErr(
      engine.reduce(readied, { type: 'SUBMIT_ANSWER', text: '   ' }, { uid: writer, now: 1, rng: createRng(1) }),
      'INVALID_TARGET',
    );
  });

  it('advances the queue one writer at a time', () => {
    let s = start(4);
    const first = s.pendingWriters[0];
    s = submitAnswer(s, 'Istanbul');
    expect(s.answers[first]).toBe('Istanbul');
    expect(s.pendingWriters).not.toContain(first);
    expect(s.phase).toBe('writing');
  });

  it('moves to voting once everyone has written, with the truth mixed in', () => {
    const s = writeAllBluffs(start(4));
    expect(s.phase).toBe('voting');
    expect(s.options).not.toBeNull();
    // 4 bluffs + the truth, none merged since they're all distinct.
    expect(s.options).toHaveLength(5);
    expect(s.options!.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it('never times out a writer who has not tapped ready — same as Taboo waiting on "start"', () => {
    let s = start(4);
    const waiting = s.pendingWriters[0];
    s = engine.tick(s, s.deadlineAt + 999_999);
    expect(s.pendingWriters[0]).toBe(waiting);
    expect(s.phase).toBe('writing');
  });

  it('forfeits (no bluff) whoever is up once their clock, started by READY, runs out', () => {
    let s = start(4);
    const forfeited = s.pendingWriters[0];
    s = ready(s, forfeited);
    s = engine.tick(s, s.deadlineAt + 1);
    expect(s.answers[forfeited]).toBeUndefined();
    expect(s.pendingWriters).not.toContain(forfeited);
  });

  it('merges identical bluffs into one option shared by both authors', () => {
    let s = start(3);
    const [w0, w1] = s.order;
    s = submitAnswer(s, 'Izmir'); // w0
    s = submitAnswer(s, 'izmir '); // w1 — same answer, different case/space
    s = submitAnswer(s, 'Konya'); // w2
    expect(s.phase).toBe('voting');
    const merged = s.options!.find((o) => !o.isCorrect && o.text.toLowerCase().includes('izmir'));
    expect(merged!.authorUids.sort()).toEqual([w0, w1].sort());
  });

  it('folds a guess that happens to land on the truth into the correct option', () => {
    let s = start(3);
    const [w0] = s.order;
    const trueAnswer = ZARTA_QUESTIONS.find((q) => q.id === s.currentQuestionId)!.answer;
    s = submitAnswer(s, trueAnswer); // w0 guesses right, whether by luck or knowledge
    s = submitAnswer(s, 'A made-up bluff');
    s = submitAnswer(s, 'Another made-up bluff');
    const correct = s.options!.find((o) => o.isCorrect)!;
    expect(s.options!.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(correct.authorUids).toContain(w0);
  });
});

describe('voting', () => {
  it('only the front of the voter queue may vote', () => {
    let s = writeAllBluffs(start(4));
    const notFirst = s.pendingVoters[1];
    expectErr(
      engine.reduce(s, { type: 'SUBMIT_VOTE', optionId: s.options![0].id }, { uid: notFirst, now: 1, rng: createRng(1) }),
      'NOT_YOUR_TURN',
    );
  });

  it('refuses to let a player vote for an answer they wrote', () => {
    let s = writeAllBluffs(start(4));
    const voter = s.pendingVoters[0];
    s = ready(s, voter);
    const own = s.options!.find((o) => o.authorUids.includes(voter))!;
    expectErr(
      engine.reduce(s, { type: 'SUBMIT_VOTE', optionId: own.id }, { uid: voter, now: 1, rng: createRng(1) }),
      'INVALID_TARGET',
    );
  });

  it('awards the voter 1 point for picking the truth', () => {
    let s = writeAllBluffs(start(4));
    const truth = s.options!.find((o) => o.isCorrect)!;
    s = everyoneVoteFor(s, truth.id);
    expect(s.phase).toBe('round_recap');
    for (const uid of s.order) {
      const votedTruth = s.lastRound!.votes.find((v) => v.voterUid === uid)?.optionId === truth.id;
      if (votedTruth) expect(s.lastRound!.pointsThisRound[uid]).toBeGreaterThanOrEqual(1);
    }
  });

  it('awards the bluff author 2 points per person tricked', () => {
    let s = writeAllBluffs(start(4));
    const bluff = s.options!.find((o) => !o.isCorrect)!;
    const author = bluff.authorUids[0];
    s = everyoneVoteFor(s, bluff.id);
    const trickedCount = s.lastRound!.votes.filter((v) => v.optionId === bluff.id).length;
    expect(s.lastRound!.pointsThisRound[author]).toBe(trickedCount * 2);
  });

  it('forfeits (no vote, no points) whoever is up once their clock, started by READY, runs out', () => {
    let s = writeAllBluffs(start(4));
    const forfeited = s.pendingVoters[0];
    s = ready(s, forfeited);
    s = engine.tick(s, s.deadlineAt + 1);
    expect(s.votes.find((v) => v.voterUid === forfeited)).toBeUndefined();
  });

  it('ends the round once everyone has voted', () => {
    let s = writeAllBluffs(start(3));
    const truth = s.options!.find((o) => o.isCorrect)!;
    s = everyoneVoteFor(s, truth.id);
    expect(s.phase).toBe('round_recap');
    expect(s.lastRound).not.toBeNull();
  });
});

describe('game progression', () => {
  it('plays exactly totalRounds questions, then ends the game', () => {
    let s = start(3, 1, 0, { ...DEFAULT_ZARTA_CONFIG, totalRounds: 2 });
    for (let i = 0; i < 2; i++) {
      s = writeAllBluffs(s);
      const truth = s.options!.find((o) => o.isCorrect)!;
      s = everyoneVoteFor(s, truth.id);
      s = continueRound(s);
    }
    expect(s.phase).toBe('game_over');
    expect(s.round).toBe(2);
  });

  it('accumulates scores across rounds rather than resetting them', () => {
    let s = start(3, 1, 0, { ...DEFAULT_ZARTA_CONFIG, totalRounds: 2 });
    s = writeAllBluffs(s);
    const truth = s.options!.find((o) => o.isCorrect)!;
    s = everyoneVoteFor(s, truth.id);
    const afterRound1 = { ...s.scores };
    s = continueRound(s);
    expect(s.scores).toEqual(afterRound1);
  });

  it('only a seated player may continue past the recap', () => {
    let s = writeAllBluffs(start(4));
    const truth = s.options!.find((o) => o.isCorrect)!;
    s = everyoneVoteFor(s, truth.id);
    expectErr(engine.reduce(s, { type: 'CONTINUE' }, { uid: 'ghost', now: 1, rng: createRng(1) }), 'NOT_A_PLAYER');
  });
});

describe('projectFor', () => {
  it('never reveals authorship while voting is open', () => {
    const s = writeAllBluffs(start(4));
    const view = engine.projectFor(s, s.pendingVoters[0]);
    expect(view.voteChoices.length).toBeGreaterThan(0);
    for (const choice of view.voteChoices) {
      expect((choice as unknown as { authorUids?: unknown }).authorUids).toBeUndefined();
    }
  });

  it("excludes a voter's own authored options from their choices", () => {
    const s = writeAllBluffs(start(4));
    const voter = s.pendingVoters[0];
    const own = s.options!.find((o) => o.authorUids.includes(voter))!;
    const view = engine.projectFor(s, voter);
    expect(view.voteChoices.map((c) => c.id)).not.toContain(own.id);
  });

  it('reveals full authorship and votes once the round is recapped', () => {
    let s = writeAllBluffs(start(3));
    const truth = s.options!.find((o) => o.isCorrect)!;
    s = everyoneVoteFor(s, truth.id);
    const view = engine.projectFor(s, s.order[0]);
    expect(view.lastRound).not.toBeNull();
    expect(view.lastRound!.options.every((o) => Array.isArray(o.authorNames))).toBe(true);
  });
});
