import { createRng } from '../core/rng';
import type { PlayerSeat, Result } from '../core/types';
import { DEFAULT_IMPOSTER_CONFIG } from './config';
import engine from './engine';
import type { ImposterState } from './state';

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

const start = (n = 5, seed = 12345, now = 1_000_000, config = DEFAULT_IMPOSTER_CONFIG): ImposterState =>
  unwrap(engine.createInitialState(seats(n), config, createRng(seed), now));

const ack = (s: ImposterState, uid: string, now = 1_000_000) =>
  unwrap(engine.reduce(s, { type: 'ACK_ROLE' }, { uid, now, rng: createRng(0) }));

/** Acks every seat, driving the game from role_reveal into discussion. */
function ackEveryone(s: ImposterState): ImposterState {
  let out = s;
  for (const uid of s.order) out = ack(out, uid);
  return out;
}

const callVote = (s: ImposterState, uid = s.order[0], now = 1_000_001) =>
  unwrap(engine.reduce(s, { type: 'CALL_VOTE' }, { uid, now, rng: createRng(1) }));

const submitVote = (s: ImposterState, target: string, now = 1_000_002) => {
  const uid = s.pendingVoters[0];
  return unwrap(engine.reduce(s, { type: 'SUBMIT_VOTE', target }, { uid, now, rng: createRng(2) }));
};

/** Every pending voter accuses the same target. */
function everyoneVoteFor(s: ImposterState, target: string): ImposterState {
  let out = s;
  while (out.phase === 'voting' && out.pendingVoters.length > 0) {
    const voter = out.pendingVoters[0];
    const accuse = voter === target ? out.order.find((u) => u !== target)! : target;
    out = submitVote(out, accuse);
  }
  return out;
}

const guess = (s: ImposterState, valueId: string, now = 1_000_003) =>
  unwrap(engine.reduce(s, { type: 'GUESS_VALUE', valueId }, { uid: s.imposterUid, now, rng: createRng(3) }));

/* ---------------- setup ---------------- */

describe('createInitialState', () => {
  it('rejects too few players', () => {
    expectErr(engine.createInitialState(seats(3), DEFAULT_IMPOSTER_CONFIG, createRng(1), 0), 'NOT_ENOUGH_PLAYERS');
  });

  it('rejects too many players', () => {
    expectErr(engine.createInitialState(seats(11), DEFAULT_IMPOSTER_CONFIG, createRng(1), 0), 'TOO_MANY_PLAYERS');
  });

  it('starts in role_reveal with exactly one imposter seated', () => {
    const s = start(5);
    expect(s.phase).toBe('role_reveal');
    expect(s.order).toContain(s.imposterUid);
  });

  it('picks a category and a value from that category', () => {
    const s = start(5);
    expect(s.categoryName).toBeTruthy();
    expect(s.valueText).toBeTruthy();
    expect(s.poolChoices.some((v) => v.id === s.valueId)).toBe(true);
  });
});

describe('role_reveal', () => {
  it('moves to discussion once everyone has acked', () => {
    let s = start(5);
    for (const uid of s.order.slice(0, -1)) {
      s = ack(s, uid);
      expect(s.phase).toBe('role_reveal');
    }
    s = ack(s, s.order[s.order.length - 1]);
    expect(s.phase).toBe('discussion');
  });

  it('force-advances to discussion if the reveal deadline passes unacked', () => {
    let s = start(5);
    s = engine.tick(s, s.deadlineAt + 1);
    expect(s.phase).toBe('discussion');
  });
});

describe('projectFor during role_reveal / discussion', () => {
  it('hides the value from the imposter but shows it to everyone else', () => {
    const s = ackEveryone(start(5));
    for (const uid of s.order) {
      const view = engine.projectFor(s, uid);
      if (uid === s.imposterUid) {
        expect(view.value).toBeNull();
        expect(view.poolChoices.length).toBeGreaterThan(0);
      } else {
        expect(view.value).toBe(s.valueText);
        expect(view.poolChoices).toHaveLength(0);
      }
    }
  });
});

describe('voting', () => {
  it('calling a vote does not reset the shared deadline', () => {
    let s = ackEveryone(start(5));
    const deadlineBefore = s.deadlineAt;
    s = callVote(s);
    expect(s.deadlineAt).toBe(deadlineBefore);
  });

  it('only the front of the voter queue may vote', () => {
    let s = callVote(ackEveryone(start(5)));
    const notFirst = s.pendingVoters[1];
    expectErr(
      engine.reduce(s, { type: 'SUBMIT_VOTE', target: s.order[0] }, { uid: notFirst, now: 1, rng: createRng(1) }),
      'NOT_YOUR_TURN',
    );
  });

  it('refuses a self-vote', () => {
    let s = callVote(ackEveryone(start(5)));
    const voter = s.pendingVoters[0];
    expectErr(
      engine.reduce(s, { type: 'SUBMIT_VOTE', target: voter }, { uid: voter, now: 1, rng: createRng(1) }),
      'INVALID_TARGET',
    );
  });

  it('a correct majority vote catches the imposter and ends the game', () => {
    let s = callVote(ackEveryone(start(5)));
    s = everyoneVoteFor(s, s.imposterUid);
    expect(s.phase).toBe('game_over');
    expect(s.winner).toBe('crew');
  });

  it('a wrong majority vote returns to discussion without ending the game', () => {
    let s = callVote(ackEveryone(start(5)));
    const wrongTarget = s.order.find((u) => u !== s.imposterUid)!;
    s = everyoneVoteFor(s, wrongTarget);
    expect(s.phase).toBe('discussion');
    expect(s.winner).toBeNull();
  });

  it('a vote can be called again after a failed one, same deadline throughout', () => {
    let s = callVote(ackEveryone(start(5)));
    const deadline = s.deadlineAt;
    const wrongTarget = s.order.find((u) => u !== s.imposterUid)!;
    s = everyoneVoteFor(s, wrongTarget);
    s = callVote(s);
    expect(s.deadlineAt).toBe(deadline);
    s = everyoneVoteFor(s, s.imposterUid);
    expect(s.winner).toBe('crew');
  });
});

describe('imposter guessing', () => {
  it('only the imposter may guess', () => {
    const s = ackEveryone(start(5));
    const notImposter = s.order.find((u) => u !== s.imposterUid)!;
    expectErr(
      engine.reduce(s, { type: 'GUESS_VALUE', valueId: s.valueId }, { uid: notImposter, now: 1, rng: createRng(1) }),
      'NOT_YOUR_TURN',
    );
  });

  it('a correct guess wins the game for the imposter', () => {
    let s = ackEveryone(start(5));
    s = guess(s, s.valueId);
    expect(s.phase).toBe('game_over');
    expect(s.winner).toBe('imposter');
  });

  it('a wrong guess is remembered and cannot be repeated', () => {
    let s = ackEveryone(start(5));
    const wrongId = s.poolChoices.find((v) => v.id !== s.valueId)!.id;
    s = guess(s, wrongId);
    expect(s.phase).toBe('discussion');
    expect(s.imposterGuessedWrong).toBe(true);
    expectErr(
      engine.reduce(s, { type: 'GUESS_VALUE', valueId: s.valueId }, { uid: s.imposterUid, now: 1, rng: createRng(1) }),
      'ALREADY_ACTED',
    );
  });
});

describe('the shared clock', () => {
  it('ends the game as a draw once time runs out, even mid-discussion', () => {
    let s = ackEveryone(start(5));
    s = engine.tick(s, s.deadlineAt + 1);
    expect(s.phase).toBe('game_over');
    expect(s.winner).toBe('draw');
  });

  it('ends the game as a draw even with a vote in progress', () => {
    let s = callVote(ackEveryone(start(5)));
    s = engine.tick(s, s.deadlineAt + 1);
    expect(s.phase).toBe('game_over');
    expect(s.winner).toBe('draw');
  });
});

describe('calculateResults', () => {
  it('only the imposter wins on an imposter victory', () => {
    let s = ackEveryone(start(5));
    s = guess(s, s.valueId);
    const results = engine.calculateResults(s);
    for (const p of results.players) {
      expect(p.won).toBe(p.uid === s.imposterUid);
    }
  });

  it('nobody wins a draw', () => {
    let s = ackEveryone(start(5));
    s = engine.tick(s, s.deadlineAt + 1);
    const results = engine.calculateResults(s);
    expect(results.players.every((p) => !p.won)).toBe(true);
  });
});
