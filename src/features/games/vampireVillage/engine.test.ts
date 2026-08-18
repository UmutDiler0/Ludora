import { createRng } from '../core/rng';
import type { PlayerSeat, Result } from '../core/types';
import { DEFAULT_VV_CONFIG, autoVampireCount } from './config';
import engine, { buildRoleDeck } from './engine';
import { ROLES, type RoleId } from './roles';
import type { VVState } from './state';

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

const start = (n = 4, seed = 12345, now = 1_000_000): VVState =>
  unwrap(engine.createInitialState(seats(n), DEFAULT_VV_CONFIG, createRng(seed), now));

const whoIs = (s: VVState, role: RoleId) => {
  const p = Object.values(s.players).find((x) => x.role === role && x.alive);
  if (!p) throw new Error(`no living ${role}`);
  return p;
};

const livingOther = (s: VVState, ...exclude: string[]) => {
  const p = Object.values(s.players).find((x) => x.alive && !exclude.includes(x.uid));
  if (!p) throw new Error('no other living player');
  return p;
};

/** Acknowledge the role reveal for everyone, moving the game to night 1. */
const ackAll = (s: VVState, now = 1_000_001): VVState => {
  let cur = s;
  for (const uid of cur.order) {
    cur = unwrap(engine.reduce(cur, { type: 'ACK_ROLE' }, { uid, now, rng: createRng(1) }));
  }
  return cur;
};

const act = (s: VVState, uid: string, target: string, now = 1_000_002) =>
  unwrap(engine.reduce(s, { type: 'NIGHT_ACTION', target }, { uid, now, rng: createRng(1) }));

const vote = (s: VVState, uid: string, target: string, now = 1_000_003) =>
  unwrap(engine.reduce(s, { type: 'VOTE', target }, { uid, now, rng: createRng(1) }));

/* ---------------- setup ---------------- */

describe('role deck', () => {
  it('gives a 4-player classic game one of each special role', () => {
    const deck = buildRoleDeck(4, DEFAULT_VV_CONFIG);
    expect(deck.filter((r) => r === 'vampire')).toHaveLength(1);
    expect(deck.filter((r) => r === 'investigator')).toHaveLength(1);
    expect(deck.filter((r) => r === 'protector')).toHaveLength(1);
    expect(deck.filter((r) => r === 'villager')).toHaveLength(1);
  });

  it('never starts with vampires already at parity', () => {
    for (let n = 4; n <= 12; n++) {
      const vampires = autoVampireCount(n);
      expect(vampires).toBeGreaterThanOrEqual(1);
      expect(vampires).toBeLessThan(n - vampires);
    }
  });

  it('always deals exactly one role per player', () => {
    for (let n = 4; n <= 12; n++) {
      expect(buildRoleDeck(n, DEFAULT_VV_CONFIG)).toHaveLength(n);
    }
  });
});

describe('createInitialState', () => {
  it('rejects too few and too many players', () => {
    const rng = createRng(1);
    expectErr(engine.createInitialState(seats(3), DEFAULT_VV_CONFIG, rng, 0), 'NOT_ENOUGH_PLAYERS');
    expectErr(engine.createInitialState(seats(13), DEFAULT_VV_CONFIG, rng, 0), 'TOO_MANY_PLAYERS');
  });

  it('is deterministic for a given seed', () => {
    const a = start(8, 999);
    const b = start(8, 999);
    expect(a.order).toEqual(b.order);
    expect(a.order.map((u) => a.players[u].role)).toEqual(b.order.map((u) => b.players[u].role));
  });

  it('produces different deals for different seeds', () => {
    const a = start(8, 1);
    const b = start(8, 2);
    const roleString = (s: VVState) => s.order.map((u) => s.players[u].role).join(',');
    expect(roleString(a)).not.toEqual(roleString(b));
  });

  it('opens in role reveal with everyone alive', () => {
    const s = start(6);
    expect(s.phase).toBe('role_reveal');
    expect(s.round).toBe(1);
    expect(Object.values(s.players).every((p) => p.alive)).toBe(true);
  });
});

/* ---------------- night ---------------- */

describe('night resolution', () => {
  it('moves to night once every player acknowledges their role', () => {
    const s = ackAll(start(4));
    expect(s.phase).toBe('night');
  });

  it('kills an unprotected victim and reveals their role in the log', () => {
    let s = ackAll(start(4));
    const vampire = whoIs(s, 'vampire');
    const seer = whoIs(s, 'investigator');
    const guard = whoIs(s, 'protector');
    const victim = livingOther(s, vampire.uid);

    s = act(s, vampire.uid, victim.uid);
    s = act(s, seer.uid, livingOther(s, seer.uid).uid);
    s = act(s, guard.uid, guard.uid); // guard themselves, not the victim

    expect(s.players[victim.uid].alive).toBe(false);
    expect(s.players[victim.uid].eliminatedBy).toBe('vampires');
    const kill = s.log.find((l) => l.kind === 'kill');
    expect(kill?.text).toContain(ROLES[victim.role].name);
  });

  it('saves the victim when the Bodyguard guards them', () => {
    let s = ackAll(start(4));
    const vampire = whoIs(s, 'vampire');
    const seer = whoIs(s, 'investigator');
    const guard = whoIs(s, 'protector');
    const victim = livingOther(s, vampire.uid, guard.uid, seer.uid);

    s = act(s, vampire.uid, victim.uid);
    s = act(s, guard.uid, victim.uid);
    s = act(s, seer.uid, vampire.uid);

    expect(s.players[victim.uid].alive).toBe(true);
    expect(s.log.some((l) => l.kind === 'kill_blocked')).toBe(true);
  });

  it('records the Seer vision privately and never names the target publicly', () => {
    let s = ackAll(start(4));
    const vampire = whoIs(s, 'vampire');
    const seer = whoIs(s, 'investigator');
    const guard = whoIs(s, 'protector');

    s = act(s, seer.uid, vampire.uid);
    s = act(s, vampire.uid, livingOther(s, vampire.uid, seer.uid).uid);
    s = act(s, guard.uid, seer.uid);

    const visions = s.visions[seer.uid];
    expect(visions).toHaveLength(1);
    expect(visions[0].alignment).toBe('vampires');

    // §22.2 — the public log must not leak who the Seer looked at.
    const entry = s.log.find((l) => l.kind === 'seer_acted');
    expect(entry?.text).toBe('The Seer received a vision.');
    expect(s.log.every((l) => !l.text.includes(s.players[vampire.uid].displayName) || l.kind === 'kill')).toBe(true);
  });

  it('rejects a vampire targeting another vampire', () => {
    const s = ackAll(start(8, 4242));
    const vampires = Object.values(s.players).filter((p) => p.role === 'vampire');
    if (vampires.length < 2) return; // deal-dependent; only meaningful with a coven
    expectErr(
      engine.reduce(
        s,
        { type: 'NIGHT_ACTION', target: vampires[1].uid },
        { uid: vampires[0].uid, now: 1, rng: createRng(1) },
      ),
      'INVALID_TARGET',
    );
  });

  it('rejects a night action from a villager', () => {
    const s = ackAll(start(4));
    const villager = whoIs(s, 'villager');
    expectErr(
      engine.reduce(
        s,
        { type: 'NIGHT_ACTION', target: livingOther(s, villager.uid).uid },
        { uid: villager.uid, now: 1, rng: createRng(1) },
      ),
      'NOT_YOUR_TURN',
    );
  });

  it('rejects actions from someone who is not in the game', () => {
    const s = ackAll(start(4));
    expectErr(
      engine.reduce(s, { type: 'ACK_ROLE' }, { uid: 'stranger', now: 1, rng: createRng(1) }),
      'NOT_A_PLAYER',
    );
  });
});

/* ---------------- voting ---------------- */

describe('voting', () => {
  /** Drive a game to the day_vote phase. */
  const toVote = (n = 6, seed = 777): VVState => {
    let s = ackAll(start(n, seed));
    const vampire = whoIs(s, 'vampire');
    const seer = whoIs(s, 'investigator');
    const guard = whoIs(s, 'protector');
    const victim = livingOther(s, vampire.uid, seer.uid, guard.uid);
    s = act(s, vampire.uid, victim.uid);
    s = act(s, seer.uid, vampire.uid);
    s = act(s, guard.uid, guard.uid);
    expect(s.phase).toBe('day_discussion');
    return engine.tick(s, s.deadlineAt);
  };

  it('exiles the player with the most votes and reveals their role', () => {
    let s = toVote();
    expect(s.phase).toBe('day_vote');
    const vampire = whoIs(s, 'vampire');
    for (const p of Object.values(s.players).filter((x) => x.alive)) {
      s = vote(s, p.uid, vampire.uid);
    }
    expect(s.players[vampire.uid].alive).toBe(false);
    expect(s.players[vampire.uid].eliminatedBy).toBe('vote');
    expect(s.log.some((l) => l.kind === 'exile' && l.text.includes('Vampire'))).toBe(true);
  });

  it('exiles nobody on a tie', () => {
    let s = toVote();
    const living = Object.values(s.players).filter((x) => x.alive);
    // Two players each take one vote.
    s = vote(s, living[0].uid, living[1].uid);
    s = vote(s, living[1].uid, living[0].uid);
    s = engine.tick(s, s.deadlineAt);
    expect(s.log.some((l) => l.kind === 'no_exile')).toBe(true);
    expect(living.every((p) => s.players[p.uid].alive)).toBe(true);
  });

  it('refuses votes cast outside the voting phase', () => {
    const s = ackAll(start(4));
    const a = s.order[0];
    expectErr(
      engine.reduce(s, { type: 'VOTE', target: s.order[1] }, { uid: a, now: 1, rng: createRng(1) }),
      'WRONG_PHASE',
    );
  });

  it('refuses votes from eliminated players', () => {
    let s = toVote();
    const dead = Object.values(s.players).find((p) => !p.alive);
    expect(dead).toBeDefined();
    expectErr(
      engine.reduce(
        s,
        { type: 'VOTE', target: s.order[0] },
        { uid: dead!.uid, now: 1, rng: createRng(1) },
      ),
      'PLAYER_ELIMINATED',
    );
  });
});

/* ---------------- win conditions ---------------- */

describe('win conditions', () => {
  it('village wins when the last vampire is exiled', () => {
    let s = ackAll(start(4));
    const vampire = whoIs(s, 'vampire');
    const seer = whoIs(s, 'investigator');
    const guard = whoIs(s, 'protector');

    s = act(s, vampire.uid, livingOther(s, vampire.uid, seer.uid, guard.uid).uid);
    s = act(s, seer.uid, vampire.uid);
    s = act(s, guard.uid, guard.uid);
    s = engine.tick(s, s.deadlineAt); // discussion → vote

    for (const p of Object.values(s.players).filter((x) => x.alive)) {
      s = vote(s, p.uid, vampire.uid);
    }

    expect(engine.isFinished(s)).toBe(true);
    expect(s.winner).toBe('village');
    const results = engine.calculateResults(s);
    expect(results.players.find((p) => p.uid === vampire.uid)?.won).toBe(false);
    expect(results.players.find((p) => p.uid === seer.uid)?.won).toBe(true);
  });

  it('vampires win once they reach parity', () => {
    let s = ackAll(start(4));
    const vampire = whoIs(s, 'vampire');
    const seer = whoIs(s, 'investigator');
    const guard = whoIs(s, 'protector');
    const villager = whoIs(s, 'villager');

    // Night 1: drain the villager → 1 vampire vs 2 villagers, game continues.
    s = act(s, vampire.uid, villager.uid);
    s = act(s, seer.uid, guard.uid);
    s = act(s, guard.uid, guard.uid);
    expect(engine.isFinished(s)).toBe(false);

    // Day: nobody exiled. Night 2: drain the guard → 1 vs 1, parity.
    s = engine.tick(s, s.deadlineAt);
    s = engine.tick(s, s.deadlineAt);
    expect(s.phase).toBe('night');
    s = act(s, vampire.uid, guard.uid);
    s = act(s, seer.uid, vampire.uid);
    // The Bodyguard is still alive, so the night waits on them too. Guarding
    // someone else lets the kill land — guarding themselves would block it.
    s = act(s, guard.uid, seer.uid);

    expect(engine.isFinished(s)).toBe(true);
    expect(s.winner).toBe('vampires');
  });
});

/* ---------------- projection / anti-cheat ---------------- */

describe('projectFor', () => {
  it('hides living players roles from everyone', () => {
    const s = ackAll(start(6));
    const viewer = s.order[0];
    const view = engine.projectFor(s, viewer);
    const others = view.players.filter((p) => p.uid !== viewer && p.alive);
    expect(others.every((p) => p.role === null)).toBe(true);
  });

  it('reveals a role once the player is eliminated', () => {
    let s = ackAll(start(4));
    const vampire = whoIs(s, 'vampire');
    const seer = whoIs(s, 'investigator');
    const guard = whoIs(s, 'protector');
    const victim = livingOther(s, vampire.uid, seer.uid, guard.uid);
    s = act(s, vampire.uid, victim.uid);
    s = act(s, seer.uid, vampire.uid);
    s = act(s, guard.uid, guard.uid);

    const view = engine.projectFor(s, seer.uid);
    expect(view.players.find((p) => p.uid === victim.uid)?.role).toBe(victim.role);
  });

  it('gives Seer visions only to the Seer', () => {
    let s = ackAll(start(4));
    const vampire = whoIs(s, 'vampire');
    const seer = whoIs(s, 'investigator');
    const guard = whoIs(s, 'protector');
    s = act(s, seer.uid, vampire.uid);
    s = act(s, vampire.uid, livingOther(s, vampire.uid, seer.uid).uid);
    s = act(s, guard.uid, seer.uid);

    expect(engine.projectFor(s, seer.uid).visions).toHaveLength(1);
    expect(engine.projectFor(s, guard.uid).visions).toHaveLength(0);
    expect(engine.projectFor(s, vampire.uid).visions).toHaveLength(0);
  });

  it('shows the coven to vampires and nobody else', () => {
    const s = ackAll(start(8, 31337));
    const vampire = whoIs(s, 'vampire');
    const villager = whoIs(s, 'villager');
    expect(engine.projectFor(s, vampire.uid).coven).toContain(vampire.uid);
    expect(engine.projectFor(s, villager.uid).coven).toBeNull();
  });

  it('never leaks a hidden role through the serialised view', () => {
    const s = ackAll(start(8, 606));
    const villager = whoIs(s, 'villager');
    const view = engine.projectFor(s, villager.uid);
    const vampireNames = Object.values(s.players)
      .filter((p) => p.role === 'vampire' && p.alive)
      .map((p) => p.uid);
    const serialised = JSON.stringify({ ...view, you: null });
    for (const uid of vampireNames) {
      // The uid may appear as a player entry, but never tagged with its role.
      expect(serialised).not.toContain(`"uid":"${uid}","displayName":"${s.players[uid].displayName}","alive":true,"role":"vampire"`);
    }
  });
});

/* ---------------- tick ---------------- */

describe('tick', () => {
  it('does nothing before the deadline', () => {
    const s = start(4);
    expect(engine.tick(s, s.deadlineAt - 1)).toEqual(s);
  });

  it('advances role reveal to night when the clock runs out', () => {
    const s = start(4);
    expect(engine.tick(s, s.deadlineAt).phase).toBe('night');
  });

  it('treats missing night actions as passes', () => {
    const s = ackAll(start(4));
    const next = engine.tick(s, s.deadlineAt);
    expect(next.phase).toBe('day_discussion');
    expect(next.log.some((l) => l.kind === 'quiet_night')).toBe(true);
    expect(Object.values(next.players).every((p) => p.alive)).toBe(true);
  });

  it('never loops forever when called far in the future', () => {
    const s = ackAll(start(6, 2024));
    const far = engine.tick(s, s.deadlineAt + 1_000_000_000);
    expect(['game_over', 'night', 'day_discussion', 'day_vote']).toContain(far.phase);
  });
});

/* ---------------- config ---------------- */

describe('validateConfig', () => {
  it('accepts the classic preset', () => {
    expect(engine.validateConfig(DEFAULT_VV_CONFIG).ok).toBe(true);
  });

  it('rejects malformed config', () => {
    expectErr(engine.validateConfig(null), 'INVALID_CONFIG');
    expectErr(engine.validateConfig({ ...DEFAULT_VV_CONFIG, maxRounds: 1 }), 'INVALID_CONFIG');
    expectErr(
      engine.validateConfig({ ...DEFAULT_VV_CONFIG, durations: { ...DEFAULT_VV_CONFIG.durations, night: 3 } }),
      'INVALID_CONFIG',
    );
  });
});
