import type { VocabularyCard } from "./card";
import type { Deck } from "./deck";
import type { DeckGroup } from "./deck-group";
import { ExamPoolTooSmallError } from "./errors";
import type { KidId } from "./kid";
import { shuffled } from "./random";
import type { RandomSource } from "./random";
import { weakScore } from "./word-stats";
import type { WordStats } from "./word-stats";

/**
 * Los exámenes — the checkpoint between one shelf of el camino and the next
 * (ADR 021). A shelf's exam opens when every deck on it is complete, and the
 * shelf *after* it stays locked until the exam is passed.
 *
 * This is the module ADR 016 said could not exist: a score threshold is the
 * one thing the album cannot express, so it is the one new fact the app
 * stores. ADR 022 keeps that storage as small as it can be — two monotonic
 * counters per shelf, with *passing derived from them* rather than written
 * down beside them.
 */

/** Questions in one exam. Above MAX_QUIZ_ROUNDS (8) on purpose: an exam is a
 *  milestone behind a whole shelf, not a kid-sized practice session, and the
 *  parent asked for ten. */
export const EXAM_QUESTIONS = 10;

/** Correct answers needed to pass — seven of ten. */
export const EXAM_PASS_MARK = 7;

/**
 * Picture choices per question, **for both kid profiles**.
 *
 * Deliberately not `QUIZ_CHOICE_COUNT`, which gives the pre-reader two. Two
 * choices means pure guessing clears 7-of-10 about 17% of the time, and with
 * unlimited retries a gate at those odds is not a gate. Four *pictures* need
 * no more reading than two do, so the harder format costs the listener
 * nothing it can't pay (ADR 021).
 */
export const EXAM_CHOICE_COUNT = 4;

/** How many of the questions look further back than the shelf just finished —
 *  the "do they still remember?" half of the ask. The full cumulative sweep is
 *  los súper exámenes, still on the roadmap. */
export const EXAM_REVIEW_QUESTIONS = 3;

/** What the kids are told the prize is. */
export const EXAM_BONUS_LABEL = "¡El premio más grande!";

/**
 * A kid's history with one shelf's exam. Both fields are monotonic, which is
 * what lets ADR 004 merge them by `max` with no new semantics (ADR 022).
 */
export interface ExamRecord {
  /** The best score ever achieved. Passing is derived from this. */
  readonly bestScore: number;
  /** How many times it has been sat. Read by nothing — it exists for the
   *  deferred exam history on /informe. */
  readonly attempts: number;
}

/** Shelf id → that shelf's exam record. */
export type ExamRecords = Readonly<Record<string, ExamRecord>>;

/** Did this sitting pass? */
export function isExamPass(score: number): boolean {
  return score >= EXAM_PASS_MARK;
}

/**
 * Has this exam ever been passed?
 *
 * **Derived, never stored.** A `passed` boolean beside `bestScore` would be a
 * second record of one fact, and the two can disagree after a merge — the
 * drift ADR 016 catalogued and ADR 008 fixed for the wallet.
 */
export function examPassed(record: ExamRecord | undefined): boolean {
  return isExamPass(record?.bestScore ?? 0);
}

export function shelfExamPassed(
  records: ExamRecords,
  groupId: string,
): boolean {
  return examPassed(records[groupId]);
}

/**
 * Write one sitting into the record. The best score only ever rises, so a bad
 * re-sit can never take a pass away and a re-merge can never inflate one.
 */
export function recordExamScore(
  records: ExamRecords,
  groupId: string,
  score: number,
): ExamRecords {
  const existing = records[groupId];
  return {
    ...records,
    [groupId]: {
      bestScore: Math.max(existing?.bestScore ?? 0, score),
      attempts: (existing?.attempts ?? 0) + 1,
    },
  };
}

/**
 * The retry gate after a failed exam: play `deckId` again before sitting it
 * once more. `mark` is that deck's total completion count at the moment of the
 * failure, so "played again" is simply a higher count.
 *
 * Device-local and never synced (ADR 022) — it is transient state, and ADR 014
 * already settled that those cannot ride an additive merge.
 */
export interface ExamPractice {
  readonly groupId: string;
  readonly deckId: string;
  readonly mark: number;
}

/** Shape guard for the locally-stored practice gate — the same trust boundary
 *  every other localStorage document crosses. */
export function isExamPractice(value: unknown): value is ExamPractice {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const p = value as Record<string, unknown>;
  return (
    typeof p.groupId === "string" &&
    typeof p.deckId === "string" &&
    typeof p.mark === "number" &&
    Number.isFinite(p.mark)
  );
}

/** Shape guard for a stored exam ledger; drops any entry that is not a pair
 *  of finite, non-negative counters. Salvages per entry rather than discarding
 *  the whole document — one bad shelf must not cost a kid every other pass. */
export function sanitizeExamRecords(value: unknown): ExamRecords {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const kept: Record<string, ExamRecord> = {};
  for (const [groupId, record] of Object.entries(value)) {
    if (typeof record !== "object" || record === null) {
      continue;
    }
    const r = record as Record<string, unknown>;
    const ok = (n: unknown): n is number =>
      typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
    if (ok(r.bestScore) && ok(r.attempts)) {
      kept[groupId] = { bestScore: r.bestScore, attempts: r.attempts };
    }
  }
  return kept;
}

/** Is the kid free to re-sit? True whenever nothing is pending. */
export function clearedPractice(
  practice: ExamPractice | null,
  currentMark: number,
): boolean {
  return practice === null || currentMark > practice.mark;
}

/** The decks of one shelf that can actually deal questions. */
function playableDecks(
  groupId: string,
  groups: readonly DeckGroup[],
  decks: readonly Deck[],
): readonly Deck[] {
  const group = groups.find((g) => g.id === groupId);
  return (group?.deckIds ?? []).flatMap((deckId) => {
    const deck = decks.find((d) => d.id === deckId);
    // Learn-only decks (los verbos) build no questions at all, and a secret
    // deck is a bonus rather than a rung on the ladder — neither belongs in
    // an exam that gates the route.
    return deck === undefined || deck.learnOnly === true || deck.secret === true
      ? []
      : [deck];
  });
}

/**
 * Which deck to go and practise after a failure — the weakest one on the
 * shelf, by the same `weakScore` el repaso ranks with (ADR 018).
 *
 * **It always names something.** ADR 021's replacement for the never-locks
 * rule is that the route may never say "no" without saying "do this instead",
 * so with no stats at all this falls back to the shelf's first deck rather
 * than to null. Null is returned only when the shelf holds nothing playable,
 * which the content tests already rule out.
 */
export function nominatePracticeDeck(opts: {
  readonly groupId: string;
  readonly groups: readonly DeckGroup[];
  readonly decks: readonly Deck[];
  readonly stats: WordStats;
}): string | null {
  const playable = playableDecks(opts.groupId, opts.groups, opts.decks);
  if (playable.length === 0) {
    return null;
  }
  const weakness = (deck: Deck): number =>
    deck.cards.reduce((worst, c) => {
      const stat = opts.stats[c.id];
      return stat === undefined ? worst : Math.max(worst, weakScore(stat));
    }, 0);
  return playable.reduce((weakest, deck) =>
    weakness(deck) > weakness(weakest) ? deck : weakest,
  ).id;
}

/** One exam question. Carries its deck so the review questions are visible in
 *  tests and can be labelled in the UI. */
export interface ExamRound {
  readonly answer: VocabularyCard;
  /** Includes the answer, in presentation order. */
  readonly choices: readonly VocabularyCard[];
  readonly deckId: string;
}

export interface Exam {
  readonly groupId: string;
  readonly rounds: readonly ExamRound[];
}

/** A card with the deck it came from, so a round can name its origin. */
interface Sourced {
  readonly card: VocabularyCard;
  readonly deckId: string;
}

function sourcedCards(decks: readonly Deck[]): readonly Sourced[] {
  return decks.flatMap((deck) =>
    deck.cards.map((card) => ({ card, deckId: deck.id })),
  );
}

/**
 * Draw `count` cards, weighting the ones this kid gets wrong so an exam
 * re-asks what they find hard — the same intent as the quiz's own weighting,
 * over a whole shelf instead of one deck.
 */
function drawWeighted(
  pool: readonly Sourced[],
  count: number,
  random: RandomSource,
  stats: WordStats | undefined,
): readonly Sourced[] {
  if (stats === undefined) {
    return shuffled(pool, random).slice(0, count);
  }
  const remaining = [...pool];
  const picked: Sourced[] = [];
  while (picked.length < count && remaining.length > 0) {
    const weights = remaining.map(
      (s) => 1 + Math.min(Math.max(weakScore(stats[s.card.id] ?? { right: 0, wrong: 0 }), 0) * 2, 6),
    );
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = random() * total;
    let index = 0;
    while (index < remaining.length - 1 && roll > weights[index]!) {
      roll -= weights[index]!;
      index += 1;
    }
    picked.push(remaining.splice(index, 1)[0]!);
  }
  return picked;
}

/**
 * Build one shelf's exam.
 *
 * Most questions come from the shelf just completed; `EXAM_REVIEW_QUESTIONS`
 * come from everything earlier on the ladder, which is what makes this a
 * memory check rather than a second quiz. The first shelf has nothing behind
 * it, so its exam is drawn entirely from itself.
 *
 * Distractors are drawn from the whole pool rather than the answer's own deck:
 * an exam spanning a shelf should not quietly tell a kid which deck the answer
 * came from.
 */
export function buildExam(opts: {
  readonly groupId: string;
  /** Must already be in trail order — `groupsInTrailOrder` does that. */
  readonly groups: readonly DeckGroup[];
  readonly decks: readonly Deck[];
  readonly kid: KidId;
  readonly random: RandomSource;
  readonly stats?: WordStats;
}): Exam {
  const { groupId, groups, decks, random, stats } = opts;
  const at = groups.findIndex((g) => g.id === groupId);
  const own = sourcedCards(playableDecks(groupId, groups, decks));
  const earlier = groups
    .slice(0, Math.max(0, at))
    .flatMap((g) => sourcedCards(playableDecks(g.id, groups, decks)));

  // Distractors need EXAM_CHOICE_COUNT - 1 cards that are not the answer, and
  // a picture must never appear twice in one round, so the pool has a floor.
  const pool = [...own, ...earlier];
  if (own.length < 1 || pool.length < EXAM_CHOICE_COUNT) {
    throw new ExamPoolTooSmallError(groupId, pool.length, EXAM_CHOICE_COUNT);
  }

  const reviewWanted = Math.min(EXAM_REVIEW_QUESTIONS, earlier.length);
  const review = drawWeighted(earlier, reviewWanted, random, stats);
  const ownWanted = Math.min(EXAM_QUESTIONS - review.length, own.length);
  const fromOwn = drawWeighted(own, ownWanted, random, stats);

  // A short shelf tops up from whatever is left rather than asking fewer
  // questions: the pass mark is a fraction of EXAM_QUESTIONS, so a short exam
  // would quietly be an easier one.
  const chosen = [...fromOwn, ...review];
  if (chosen.length < EXAM_QUESTIONS) {
    const taken = new Set(chosen.map((s) => s.card.id));
    const spare = pool.filter((s) => !taken.has(s.card.id));
    chosen.push(...drawWeighted(spare, EXAM_QUESTIONS - chosen.length, random, stats));
  }
  if (chosen.length < EXAM_QUESTIONS) {
    throw new ExamPoolTooSmallError(groupId, pool.length, EXAM_QUESTIONS);
  }

  const rounds = shuffled(chosen, random).map((source): ExamRound => {
    const distractors = shuffled(
      pool.filter((s) => s.card.id !== source.card.id),
      random,
    ).slice(0, EXAM_CHOICE_COUNT - 1);
    return {
      answer: source.card,
      deckId: source.deckId,
      choices: shuffled([source, ...distractors], random).map((s) => s.card),
    };
  });

  return { groupId, rounds };
}
