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

/** How many of a *regular* exam's questions look further back than the shelf
 *  just finished — the small "do they still remember?" half. The full
 *  cumulative sweep is the súper examen below. */
export const EXAM_REVIEW_QUESTIONS = 3;

/**
 * Every fourth shelf is a **súper examen** — the ladder's thirds, so shelves
 * 4, 8 and 12 (ADR 021's 2026-09-19 addendum).
 *
 * A milestone's súper **replaces** that shelf's regular exam rather than
 * following it: the súper already draws from that shelf's own content, and
 * thirty questions back to back is not a kid-sized sit. So the route keeps
 * exactly one checkpoint per shelf — nine regular, three súper.
 */
export const SUPER_EXAM_EVERY = 4;

/** A cumulative sweep is twice the exam, at the same 70% bar. */
export const SUPER_EXAM_QUESTIONS = 20;
export const SUPER_EXAM_PASS_MARK = 14;

/** Which kind of checkpoint a shelf carries. */
export type ExamKind = "regular" | "super";

/**
 * A shelf's exam kind, from its **position on the ladder** — not from
 * anything stored.
 *
 * That is deliberate (it keeps ADR 022's storage untouched: one record per
 * shelf whatever its kind) and it has one real cost, recorded in ADR 021's
 * addendum: moving a shelf across a milestone re-scales its existing record,
 * because a 9/10 regular pass sitting at a súper position reads as a fail.
 */
export function examKindFor(shelfIndex: number): ExamKind {
  return (shelfIndex + 1) % SUPER_EXAM_EVERY === 0 ? "super" : "regular";
}

export function questionsFor(kind: ExamKind): number {
  return kind === "super" ? SUPER_EXAM_QUESTIONS : EXAM_QUESTIONS;
}

export function passMarkFor(kind: ExamKind): number {
  return kind === "super" ? SUPER_EXAM_PASS_MARK : EXAM_PASS_MARK;
}

/** What the kids are told the prize is. */
export const EXAM_BONUS_LABEL = "¡El premio más grande!";

/**
 * One sitting of one shelf's exam — what was scored, and when.
 *
 * `at` is epoch ms and doubles as the entry's **identity**: two devices merge
 * their sittings by unioning on it, so a re-merge cannot duplicate one
 * (ADR 022's history addendum).
 */
export interface ExamSitting {
  readonly at: number;
  readonly score: number;
}

/**
 * How many sittings per shelf survive.
 *
 * The cap is a size decision, not a teaching one: twelve shelves × two kids
 * of this ride in every snapshot push, against the 64 KB server cap ADR 019
 * is already watching. Eight is enough sittings to see a shape and costs
 * roughly 3 KB a kid. `attempts` is unaffected — it stays the lifetime total,
 * so trimming the window never lies about how often she sat it.
 */
export const EXAM_HISTORY_LIMIT = 8;

/**
 * A kid's history with one shelf's exam. The two counters are monotonic, which
 * is what lets ADR 004 merge them by `max` with no new semantics (ADR 022).
 */
export interface ExamRecord {
  /** The best score ever achieved. Passing is derived from this. */
  readonly bestScore: number;
  /** How many times it has been sat, for all time. Read by no rule — it is
   *  the parent's number on /informe. */
  readonly attempts: number;
  /**
   * The most recent sittings, oldest first — the one field here that is not a
   * monotonic counter, added deliberately in ADR 022's history addendum so a
   * parent can see a trend rather than a high-water mark.
   *
   * **Optional, and omitted when empty.** An absent history reads as "no
   * sittings recorded", exactly as an absent key reads as "no exams taken" —
   * which is what lets this ship with no migration and leaves every record
   * written before it byte-identical on the wire.
   */
  readonly history?: readonly ExamSitting[];
}

/** A shelf's sittings, oldest first. Safe on a record from before the history
 *  existed, and on no record at all. */
export function examHistory(record: ExamRecord | undefined): readonly ExamSitting[] {
  return record?.history ?? [];
}

/**
 * Union two devices' sittings: dedupe by `at`, oldest first, then keep the
 * most recent `EXAM_HISTORY_LIMIT`.
 *
 * Trimming **after** the union is what makes this deterministic — a stale peer
 * can resurrect a sitting that one device has already dropped, and it is
 * dropped again to the same answer. The tie-break on a shared `at` takes the
 * higher score for the same reason max-merge takes it: it has to be
 * commutative, or the result depends on which device synced first.
 */
export function mergeExamSittings(
  mine: readonly ExamSitting[],
  theirs: readonly ExamSitting[],
): readonly ExamSitting[] {
  const byInstant = new Map<number, number>();
  for (const { at, score } of [...mine, ...theirs]) {
    byInstant.set(at, Math.max(byInstant.get(at) ?? 0, score));
  }
  return [...byInstant.entries()]
    .map(([at, score]) => ({ at, score }))
    .sort((a, b) => a.at - b.at)
    .slice(-EXAM_HISTORY_LIMIT);
}

/** Shelf id → that shelf's exam record. */
export type ExamRecords = Readonly<Record<string, ExamRecord>>;

/** Did this sitting pass? The bar is the one this shelf's kind implies. */
export function isExamPass(score: number, kind: ExamKind = "regular"): boolean {
  return score >= passMarkFor(kind);
}

/**
 * Has this exam ever been passed?
 *
 * **Derived, never stored.** A `passed` boolean beside `bestScore` would be a
 * second record of one fact, and the two can disagree after a merge — the
 * drift ADR 016 catalogued and ADR 008 fixed for the wallet.
 */
export function examPassed(
  record: ExamRecord | undefined,
  kind: ExamKind = "regular",
): boolean {
  return isExamPass(record?.bestScore ?? 0, kind);
}

export function shelfExamPassed(
  records: ExamRecords,
  groupId: string,
  kind: ExamKind = "regular",
): boolean {
  return examPassed(records[groupId], kind);
}

/**
 * Write one sitting into the record. The best score only ever rises, so a bad
 * re-sit can never take a pass away and a re-merge can never inflate one.
 *
 * `at` is passed in rather than read from the clock here: this is domain, and
 * the sitting's timestamp is also its merge identity, so a test must be able
 * to pin it.
 */
export function recordExamScore(
  records: ExamRecords,
  groupId: string,
  score: number,
  at: number,
): ExamRecords {
  const existing = records[groupId];
  return {
    ...records,
    [groupId]: {
      bestScore: Math.max(existing?.bestScore ?? 0, score),
      attempts: (existing?.attempts ?? 0) + 1,
      history: mergeExamSittings(examHistory(existing), [{ at, score }]),
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
 *  the whole document — one bad shelf must not cost a kid every other pass,
 *  and by the same rule a rubbish history never costs a shelf its counters. */
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
      // Trimmed here too: a document that has somehow grown past the cap gets
      // read back inside it, rather than being pushed on to the wire whole.
      const history = sanitizeSittings(r.history);
      kept[groupId] = {
        bestScore: r.bestScore,
        attempts: r.attempts,
        ...(history.length > 0 ? { history } : {}),
      };
    }
  }
  return kept;
}

function sanitizeSittings(value: unknown): readonly ExamSitting[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const kept: ExamSitting[] = [];
  for (const sitting of value) {
    if (typeof sitting !== "object" || sitting === null) {
      continue;
    }
    const s = sitting as Record<string, unknown>;
    const ok = (n: unknown): n is number =>
      typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
    if (ok(s.at) && ok(s.score)) {
      kept.push({ at: s.at, score: s.score });
    }
  }
  return mergeExamSittings(kept, []);
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
  /** A súper examen tested every shelf up to this one, so it must send the kid
   *  back across the same range. Nominating from the milestone shelf alone
   *  would point at a fraction of what was actually examined. */
  readonly kind?: ExamKind;
}): string | null {
  const at = opts.groups.findIndex((g) => g.id === opts.groupId);
  const scope =
    opts.kind === "super" && at >= 0
      ? opts.groups.slice(0, at + 1).map((g) => g.id)
      : [opts.groupId];
  const playable = scope.flatMap((id) =>
    playableDecks(id, opts.groups, opts.decks),
  );
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
  readonly kind: ExamKind;
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
 * Draw `count` cards spread **evenly** across several shelves' pools, taking
 * one from each in turn.
 *
 * Round-robin rather than proportional: with 20 questions over 12 shelves the
 * shares are not whole numbers, and what matters for a cumulative sweep is
 * that **shelf 1 is still represented at shelf 12** — not that the arithmetic
 * is exact. No shelf ever ends more than one question ahead of another.
 */
function drawEvenly(
  pools: readonly (readonly Sourced[])[],
  count: number,
  random: RandomSource,
  stats: WordStats | undefined,
): readonly Sourced[] {
  // Shuffle each shelf's own pool once, then deal off the top in rotation.
  const queues = pools.map((pool) => [...drawWeighted(pool, pool.length, random, stats)]);
  const picked: Sourced[] = [];
  let progressed = true;
  while (picked.length < count && progressed) {
    progressed = false;
    for (const queue of queues) {
      if (picked.length >= count) {
        break;
      }
      const next = queue.shift();
      if (next !== undefined) {
        picked.push(next);
        progressed = true;
      }
    }
  }
  return picked;
}

/**
 * Build one shelf's exam — a regular checkpoint, or a súper examen at the
 * ladder's thirds (ADR 021).
 *
 * A **regular** exam is mostly the shelf just completed, with
 * `EXAM_REVIEW_QUESTIONS` drawn from everything earlier. A **súper** exam
 * ignores that split entirely and sweeps evenly across every shelf completed
 * so far, itself included — that even spread is the whole point, since a
 * cumulative exam that quietly over-weighted the most recent shelf would be a
 * regular exam wearing a bigger number.
 *
 * Distractors come from the whole pool rather than the answer's own deck: an
 * exam spanning shelves should not quietly tell a kid which deck the answer
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
  const kind = examKindFor(at);
  const wanted = questionsFor(kind);

  const own = sourcedCards(playableDecks(groupId, groups, decks));
  const earlierPools = groups
    .slice(0, Math.max(0, at))
    .map((g) => sourcedCards(playableDecks(g.id, groups, decks)))
    .filter((pool) => pool.length > 0);
  const earlier = earlierPools.flat();

  const pool = [...own, ...earlier];
  if (own.length < 1 || pool.length < EXAM_CHOICE_COUNT) {
    throw new ExamPoolTooSmallError(groupId, pool.length, EXAM_CHOICE_COUNT);
  }

  let chosen: Sourced[];
  if (kind === "super") {
    // Every shelf up to and including this one, one question each in rotation.
    chosen = [...drawEvenly([...earlierPools, own], wanted, random, stats)];
  } else {
    const reviewWanted = Math.min(EXAM_REVIEW_QUESTIONS, earlier.length);
    const review = drawWeighted(earlier, reviewWanted, random, stats);
    const ownWanted = Math.min(wanted - review.length, own.length);
    chosen = [...drawWeighted(own, ownWanted, random, stats), ...review];
  }

  // A short pool tops up from whatever is left rather than asking fewer
  // questions: the pass mark is a fraction of the question count, so a short
  // exam would quietly be an easier one.
  if (chosen.length < wanted) {
    const taken = new Set(chosen.map((s) => s.card.id));
    const spare = pool.filter((s) => !taken.has(s.card.id));
    chosen.push(...drawWeighted(spare, wanted - chosen.length, random, stats));
  }
  if (chosen.length < wanted) {
    throw new ExamPoolTooSmallError(groupId, pool.length, wanted);
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

  return { groupId, kind, rounds };
}
