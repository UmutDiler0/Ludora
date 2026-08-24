import {
  err,
  ok,
  type EngineCtx,
  type GameEngine,
  type GameResults,
  type LogEntry,
  type Millis,
  type PlayerSeat,
  type Result,
  type Rng,
  type Uid,
} from '../core/types';
import { createRng, hashSeed, shuffle } from '../core/rng';
import {
  ZARTA_MAX_PLAYERS,
  ZARTA_MIN_PLAYERS,
  validateZartaConfig,
  type ZartaConfig,
} from './config';
import type {
  ZartaAction,
  ZartaOption,
  ZartaPlayerView,
  ZartaState,
  ZartaVoteRecord,
  ZartaWinner,
} from './state';
import { ZARTA_QUESTIONS } from './questions';

/**
 * Zarta engine — pure. A bluffing trivia game (the Fibbage/Balderdash shape):
 * one question, every player writes a fake answer, the real answer is mixed
 * in anonymously, and everyone votes for the one they believe is true.
 *
 * Structurally the odd one out among this app's games: Vampire Village,
 * Taboo and Sketch It all hand control to one active seat per round. Zarta
 * hands it to every seat, twice — once to write, once to vote — which is why
 * state carries `pendingWriters`/`pendingVoters` queues instead of a single
 * `describerUid`/`artistUid`. The privacy guarantee is the same one Taboo's
 * forbidden list and Sketch It's word rely on: `projectFor` never sends a
 * seat anything beyond what they're owed at that exact moment, so the local
 * store passing the phone from queue-front to queue-front reproduces exactly
 * what a real multiplayer client would receive.
 *
 * Scoring: guessing the truth is worth 1 point to the guesser. Writing a
 * bluff someone falls for is worth 2 points to whoever wrote it, once per
 * person tricked — the trick, not the guess, is what this game rewards most.
 */

const QUESTIONS_BY_ID = new Map(ZARTA_QUESTIONS.map((q) => [q.id, q]));

const clone = (s: ZartaState): ZartaState => JSON.parse(JSON.stringify(s)) as ZartaState;

function pushLog(s: ZartaState, kind: string, text: string, at: Millis): void {
  const entry: LogEntry = { id: `l${s.logSeq}`, round: s.round, at, text, kind };
  s.logSeq += 1;
  s.log.push(entry);
}

const secs = (n: number): number => n * 1000;

/**
 * Folds case and the common Turkish letters so "İstanbul", "istanbul" and
 * "Istanbul " all merge into one option — two players landing on the same
 * bluff (or one landing on the truth by luck) should read as one answer on
 * the table, not two near-identical ones splitting the vote.
 */
function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[İI]/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function drawQuestion(s: ZartaState, rng: Rng): void {
  if (s.deck.length === 0) {
    s.deck = shuffle(rng, s.discard);
    s.discard = [];
  }
  s.currentQuestionId = s.deck.pop() ?? null;
}

function beginWriting(s: ZartaState, now: Millis, rng: Rng): void {
  s.phase = 'writing';
  drawQuestion(s, rng);
  s.answers = {};
  s.options = null;
  s.votes = [];
  s.pendingWriters = [...s.order];
  s.pendingVoters = [];
  s.turnStarted = false;
  s.deadlineAt = now;
  pushLog(s, 'round_start', `Round ${s.round}: everyone writes a bluff.`, now);
}

/**
 * Builds this round's option list from whatever was submitted, merging
 * duplicates by normalised text (see `normalize`) and folding the truth in
 * as just another option. Order needs to be unpredictable — an
 * always-first or always-last truth is a tell — but this can run from
 * `tick` as well as `reduce` (a writer can time out on the very last slot),
 * and `tick` has no injected `Rng` by contract. A local RNG seeded from the
 * question and round instead keeps this deterministic for a given state
 * without needing one.
 */
function buildOptions(s: ZartaState): ZartaOption[] {
  const question = QUESTIONS_BY_ID.get(s.currentQuestionId as string);
  const groups = new Map<string, { text: string; isCorrect: boolean; authorUids: Uid[] }>();

  if (question) {
    groups.set(normalize(question.answer), { text: question.answer, isCorrect: true, authorUids: [] });
  }

  for (const uid of s.order) {
    const raw = s.answers[uid];
    if (!raw) continue; // forfeited (timed out) — no bluff from this seat
    const key = normalize(raw);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) existing.authorUids.push(uid);
    else groups.set(key, { text: raw, isCorrect: false, authorUids: [uid] });
  }

  const localRng = createRng(hashSeed(`${s.currentQuestionId ?? 'none'}-${s.round}-options`));
  return shuffle(localRng, [...groups.values()]).map((g, i) => ({ id: `o${i}`, ...g }));
}

function beginVoting(s: ZartaState, now: Millis): void {
  s.options = buildOptions(s);
  s.phase = 'voting';
  s.pendingVoters = [...s.order];
  s.votes = [];
  s.turnStarted = false;
  s.deadlineAt = now;
  pushLog(s, 'voting_start', `${s.options.length} answers on the table — time to vote.`, now);
}

/** Scores the round, banks the recap, and — only on the final round —
 *  decides the game's winner. */
function endRound(s: ZartaState, now: Millis): void {
  const question = QUESTIONS_BY_ID.get(s.currentQuestionId as string);
  const options = s.options ?? [];
  const pointsThisRound: Record<Uid, number> = {};

  const bump = (uid: Uid, n: number) => {
    pointsThisRound[uid] = (pointsThisRound[uid] ?? 0) + n;
    s.scores[uid] = (s.scores[uid] ?? 0) + n;
  };

  for (const vote of s.votes) {
    const option = options.find((o) => o.id === vote.optionId);
    if (!option) continue;
    if (option.isCorrect) bump(vote.voterUid, 1);
    else for (const authorUid of option.authorUids) bump(authorUid, 2);
  }

  s.lastRound = {
    question: question?.question ?? '',
    correctAnswer: question?.answer ?? '',
    options,
    votes: s.votes,
    pointsThisRound,
  };

  if (s.currentQuestionId) s.discard.push(s.currentQuestionId);
  s.currentQuestionId = null;

  pushLog(s, 'round_end', `Round ${s.round} scored.`, now);

  if (s.round >= s.totalRounds) s.winner = computeWinner(s);
  s.phase = 'round_recap';
}

function computeWinner(s: ZartaState): ZartaWinner {
  let best = -Infinity;
  let leaders: Uid[] = [];
  for (const uid of s.order) {
    const score = s.scores[uid] ?? 0;
    if (score > best) {
      best = score;
      leaders = [uid];
    } else if (score === best) {
      leaders.push(uid);
    }
  }
  return leaders.length === 1 ? leaders[0] : 'draw';
}

/* ------------------------------------------------------------------ */
/* engine                                                              */
/* ------------------------------------------------------------------ */

export const zartaEngine: GameEngine<ZartaState, ZartaConfig, ZartaAction, ZartaPlayerView> = {
  id: 'zarta',

  meta: { minPlayers: ZARTA_MIN_PLAYERS, maxPlayers: ZARTA_MAX_PLAYERS, isPremium: false },

  validateConfig(raw: unknown): Result<ZartaConfig> {
    return validateZartaConfig(raw);
  },

  createInitialState(
    players: PlayerSeat[],
    config: ZartaConfig,
    rng: Rng,
    now: Millis,
  ): Result<ZartaState> {
    if (players.length < ZARTA_MIN_PLAYERS) {
      return err('NOT_ENOUGH_PLAYERS', `Zarta needs at least ${ZARTA_MIN_PLAYERS} players.`);
    }
    if (players.length > ZARTA_MAX_PLAYERS) {
      return err('TOO_MANY_PLAYERS', `Zarta allows at most ${ZARTA_MAX_PLAYERS} players.`);
    }

    const order = players.map((p) => p.uid);
    const displayNames: Record<Uid, string> = {};
    const scores: Record<Uid, number> = {};
    for (const p of players) {
      displayNames[p.uid] = p.displayName;
      scores[p.uid] = 0;
    }

    const state: ZartaState = {
      config,
      phase: 'writing',
      round: 1,
      totalRounds: config.totalRounds,
      displayNames,
      order,
      scores,
      deck: shuffle(rng, ZARTA_QUESTIONS.map((q) => q.id)),
      discard: [],
      currentQuestionId: null,
      pendingWriters: [],
      answers: {},
      options: null,
      pendingVoters: [],
      votes: [],
      turnStarted: false,
      deadlineAt: now,
      lastRound: null,
      log: [],
      logSeq: 0,
      winner: null,
    };

    pushLog(state, 'game_start', `${players.length} players, ${config.totalRounds} questions.`, now);
    beginWriting(state, now, rng);
    return ok(state);
  },

  reduce(state: ZartaState, action: ZartaAction, ctx: EngineCtx): Result<ZartaState> {
    const s = clone(state);

    switch (action.type) {
      case 'READY': {
        if (s.phase === 'writing') {
          const current = s.pendingWriters[0];
          if (!current) return err('WRONG_PHASE', 'Nobody is waiting to write.');
          if (ctx.uid !== current) return err('NOT_YOUR_TURN', 'It is not your turn to write.');
          if (s.turnStarted) return err('ALREADY_ACTED', 'Your clock is already running.');
          s.turnStarted = true;
          s.deadlineAt = ctx.now + secs(s.config.answerSeconds);
          return ok(s);
        }
        if (s.phase === 'voting') {
          const current = s.pendingVoters[0];
          if (!current) return err('WRONG_PHASE', 'Nobody is waiting to vote.');
          if (ctx.uid !== current) return err('NOT_YOUR_TURN', 'It is not your turn to vote.');
          if (s.turnStarted) return err('ALREADY_ACTED', 'Your clock is already running.');
          s.turnStarted = true;
          s.deadlineAt = ctx.now + secs(s.config.voteSeconds);
          return ok(s);
        }
        return err('WRONG_PHASE', 'Nothing to ready up for.');
      }

      case 'SUBMIT_ANSWER': {
        if (s.phase !== 'writing') return err('WRONG_PHASE', 'Writing is not open.');
        const current = s.pendingWriters[0];
        if (!current) return err('WRONG_PHASE', 'Nobody is waiting to write.');
        if (ctx.uid !== current) return err('NOT_YOUR_TURN', 'It is not your turn to write.');
        if (!s.turnStarted) return err('WRONG_PHASE', 'Tap ready before submitting.');

        const text = action.text.trim();
        if (!text) return err('INVALID_TARGET', 'Write something before submitting.');

        s.answers[ctx.uid] = text;
        s.pendingWriters.shift();
        s.turnStarted = false;
        if (s.pendingWriters.length === 0) beginVoting(s, ctx.now);
        return ok(s);
      }

      case 'SUBMIT_VOTE': {
        if (s.phase !== 'voting') return err('WRONG_PHASE', 'Voting is not open.');
        const current = s.pendingVoters[0];
        if (!current) return err('WRONG_PHASE', 'Nobody is waiting to vote.');
        if (ctx.uid !== current) return err('NOT_YOUR_TURN', 'It is not your turn to vote.');
        if (!s.turnStarted) return err('WRONG_PHASE', 'Tap ready before voting.');

        const option = s.options?.find((o) => o.id === action.optionId);
        if (!option) return err('INVALID_TARGET', 'That answer is not on the table.');
        if (option.authorUids.includes(ctx.uid)) {
          return err('INVALID_TARGET', 'You cannot vote for an answer you wrote.');
        }

        const vote: ZartaVoteRecord = { voterUid: ctx.uid, optionId: action.optionId };
        s.votes.push(vote);
        s.pendingVoters.shift();
        s.turnStarted = false;
        if (s.pendingVoters.length === 0) endRound(s, ctx.now);
        return ok(s);
      }

      case 'CONTINUE': {
        if (s.phase !== 'round_recap') return err('WRONG_PHASE', 'There is nothing to continue past.');
        if (!s.order.includes(ctx.uid)) return err('NOT_A_PLAYER', 'You are not in this game.');

        if (s.winner) {
          s.phase = 'game_over';
          pushLog(
            s,
            'game_over',
            s.winner === 'draw' ? 'Scores are tied. It ends a draw.' : `${s.displayNames[s.winner]} wins.`,
            ctx.now,
          );
          return ok(s);
        }

        s.round += 1;
        beginWriting(s, ctx.now, ctx.rng);
        return ok(s);
      }

      default:
        return err('WRONG_PHASE', 'Unknown action.');
    }
  },

  /** Deadline-driven: whoever is at the front of the active queue forfeits
   *  their turn once the clock runs out, the same "the deadline is
   *  authoritative" rule every other engine here follows. Looping rather than
   *  a single check lets one call catch up if several turns' worth of time
   *  passed while the app was backgrounded; in practice each reset deadline
   *  sits in the future relative to `now`, so this only ever advances one
   *  turn per call under normal play. */
  tick(state: ZartaState, now: Millis): ZartaState {
    const s = clone(state);

    while (s.phase === 'writing' && s.turnStarted && now >= s.deadlineAt) {
      s.pendingWriters.shift();
      s.turnStarted = false;
      if (s.pendingWriters.length === 0) beginVoting(s, now);
    }

    while (s.phase === 'voting' && s.turnStarted && now >= s.deadlineAt) {
      s.pendingVoters.shift();
      s.turnStarted = false;
      if (s.pendingVoters.length === 0) endRound(s, now);
    }

    return s;
  },

  projectFor(state: ZartaState, uid: Uid): ZartaPlayerView {
    const question = state.currentQuestionId ? QUESTIONS_BY_ID.get(state.currentQuestionId) : undefined;

    const currentWriterUid = state.phase === 'writing' ? (state.pendingWriters[0] ?? null) : null;
    const currentVoterUid = state.phase === 'voting' ? (state.pendingVoters[0] ?? null) : null;

    const voteChoices =
      state.phase === 'voting' && state.options
        ? state.options.filter((o) => !o.authorUids.includes(uid)).map((o) => ({ id: o.id, text: o.text }))
        : [];

    const leaderboard = state.order
      .map((u) => ({ uid: u, displayName: state.displayNames[u], score: state.scores[u] ?? 0 }))
      .sort((a, b) => b.score - a.score);

    return {
      phase: state.phase,
      round: state.round,
      totalRounds: state.totalRounds,
      deadlineAt: state.deadlineAt,
      turnStarted: state.turnStarted,
      answerSeconds: state.config.answerSeconds,
      voteSeconds: state.config.voteSeconds,
      question: question?.question ?? '',
      you: { uid },
      currentWriterUid,
      currentWriterName: currentWriterUid ? state.displayNames[currentWriterUid] : null,
      isYourTurnToWrite: currentWriterUid === uid,
      currentVoterUid,
      currentVoterName: currentVoterUid ? state.displayNames[currentVoterUid] : null,
      isYourTurnToVote: currentVoterUid === uid,
      voteChoices,
      leaderboard,
      lastRound: state.lastRound
        ? {
            question: state.lastRound.question,
            correctAnswer: state.lastRound.correctAnswer,
            options: state.lastRound.options.map((o) => ({
              id: o.id,
              text: o.text,
              isCorrect: o.isCorrect,
              authorNames: o.authorUids.map((a) => state.displayNames[a]),
              voterNames: state.lastRound!.votes
                .filter((v) => v.optionId === o.id)
                .map((v) => state.displayNames[v.voterUid]),
            })),
            pointsThisRound: state.order
              .map((u) => ({ uid: u, displayName: state.displayNames[u], points: state.lastRound!.pointsThisRound[u] ?? 0 }))
              .filter((p) => p.points !== 0)
              .sort((a, b) => b.points - a.points),
          }
        : null,
      winner: state.winner,
    };
  },

  isFinished(state: ZartaState): boolean {
    return state.phase === 'game_over';
  },

  calculateResults(state: ZartaState): GameResults {
    const winner = state.winner ?? 'draw';
    const players: GameResults['players'] = state.order.map((uid) => ({
      uid,
      role: 'player',
      survived: true,
      won: winner !== 'draw' && winner === uid,
    }));
    return { winner, rounds: state.totalRounds, players };
  },
};

export default zartaEngine;
