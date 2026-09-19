import { describe, expect, it } from "vitest";
import type { Deck } from "../src/domain/deck";
import type { DeckGroup } from "../src/domain/deck-group";
import {
  EXAM_CHOICE_COUNT,
  EXAM_PASS_MARK,
  EXAM_QUESTIONS,
  EXAM_REVIEW_QUESTIONS,
  EXAM_BONUS_LABEL,
  buildExam,
  clearedPractice,
  examPassed,
  isExamPass,
  isExamPractice,
  sanitizeExamRecords,
  nominatePracticeDeck,
  recordExamScore,
  type ExamRecords,
} from "../src/domain/exam";
import { CATEGORY_BONUS } from "../src/domain/category";
import { EXAM_BONUS } from "../src/domain/stars";
import { ExamPoolTooSmallError } from "../src/domain/errors";
import { card } from "./helpers";

/** A pinned clock — a sitting's timestamp is its merge identity (ADR 022). */
const AT = Date.UTC(2026, 8, 19, 9, 0, 0);

function testDeck(id: string, size = 12): Deck {
  return {
    id,
    nameSpanish: id,
    nameEnglish: id,
    emoji: "🧪",
    cards: Array.from({ length: size }, (_, i) => card(i + 1, `${id}-${i + 1}`)),
  };
}

function group(id: string, deckIds: readonly string[]): DeckGroup {
  return { id, nameSpanish: id, nameEnglish: id, emoji: "📦", deckIds };
}

const g1 = group("g1", ["uno", "dos"]);
const g2 = group("g2", ["tres"]);
const decks = [testDeck("uno"), testDeck("dos"), testDeck("tres")];

/** Deterministic: always picks the first of anything. */
const firstAlways = () => 0;

describe("exam thresholds", () => {
  it("is a 10-question exam passed at 7", () => {
    expect(EXAM_QUESTIONS).toBe(10);
    expect(EXAM_PASS_MARK).toBe(7);
  });

  it("passes at the mark and fails one below it", () => {
    expect(isExamPass(EXAM_PASS_MARK)).toBe(true);
    expect(isExamPass(EXAM_PASS_MARK - 1)).toBe(false);
    expect(isExamPass(EXAM_QUESTIONS)).toBe(true);
  });

  it("offers four picture choices to BOTH profiles", () => {
    // A 2-choice gate is passed by guessing ~17% of the time, which with
    // unlimited retries is not a gate (ADR 021). Pictures need no reading, so
    // four costs the pre-reader nothing.
    expect(EXAM_CHOICE_COUNT).toBe(4);
  });
});

describe("exam records", () => {
  it("derives passing from the best score, with no stored flag", () => {
    expect(examPassed(undefined)).toBe(false);
    expect(examPassed({ bestScore: EXAM_PASS_MARK - 1, attempts: 3 })).toBe(false);
    expect(examPassed({ bestScore: EXAM_PASS_MARK, attempts: 1 })).toBe(true);
  });

  it("keeps the best score and counts every attempt", () => {
    let records: ExamRecords = {};
    records = recordExamScore(records, "g1", 4, AT);
    records = recordExamScore(records, "g1", 9, AT + 1);
    records = recordExamScore(records, "g1", 2, AT + 2);
    expect(records.g1).toMatchObject({ bestScore: 9, attempts: 3 });
  });

  it("never lets a bad re-sit take a pass away", () => {
    let records: ExamRecords = recordExamScore({}, "g1", 10, AT);
    records = recordExamScore(records, "g1", 0, AT + 1);
    expect(examPassed(records.g1)).toBe(true);
  });

  it("keeps shelves independent", () => {
    let records: ExamRecords = recordExamScore({}, "g1", 8, AT);
    records = recordExamScore(records, "g2", 3, AT + 1);
    expect(examPassed(records.g1)).toBe(true);
    expect(examPassed(records.g2)).toBe(false);
  });
});

describe("the reward", () => {
  it("out-pays every other chest in the app", () => {
    // Asserted against the constant, never a copy of its value (ADR 020).
    expect(EXAM_BONUS).toBeGreaterThan(CATEGORY_BONUS.gold);
  });

  it("is named for the kids in Spanish", () => {
    expect(EXAM_BONUS_LABEL).toBeTruthy();
  });
});

describe("buildExam", () => {
  it("asks exactly EXAM_QUESTIONS rounds with EXAM_CHOICE_COUNT choices", () => {
    const exam = buildExam({
      groupId: "g1",
      groups: [g1, g2],
      decks,
      kid: "listener",
      random: Math.random,
    });
    expect(exam.rounds).toHaveLength(EXAM_QUESTIONS);
    for (const round of exam.rounds) {
      expect(round.choices).toHaveLength(EXAM_CHOICE_COUNT);
      expect(round.choices).toContain(round.answer);
    }
  });

  it("never repeats a question within one exam", () => {
    const exam = buildExam({
      groupId: "g1",
      groups: [g1, g2],
      decks,
      kid: "reader",
      random: Math.random,
    });
    const ids = exam.rounds.map((r) => r.answer.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never offers the answer twice among its own choices", () => {
    const exam = buildExam({
      groupId: "g1",
      groups: [g1, g2],
      decks,
      kid: "listener",
      random: Math.random,
    });
    for (const round of exam.rounds) {
      const ids = round.choices.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("draws review questions from earlier shelves once there are any", () => {
    // g2 is the second shelf, so its exam must look back at g1 — that is the
    // "still remember" half of the ask.
    const exam = buildExam({
      groupId: "g2",
      groups: [g1, g2],
      decks,
      kid: "listener",
      random: Math.random,
    });
    const fromEarlier = exam.rounds.filter((r) => r.deckId !== "tres");
    expect(fromEarlier).toHaveLength(EXAM_REVIEW_QUESTIONS);
  });

  it("tops up from earlier shelves rather than asking a shorter exam", () => {
    // The pass mark is a fraction of EXAM_QUESTIONS, so a short shelf must not
    // quietly become an easier exam — it borrows more review questions instead.
    const small = group("small", ["poco"]);
    const exam = buildExam({
      groupId: "small",
      groups: [g1, small],
      decks: [...decks, testDeck("poco", 4)],
      kid: "listener",
      random: Math.random,
    });
    expect(exam.rounds).toHaveLength(EXAM_QUESTIONS);
    const fromEarlier = exam.rounds.filter((r) => r.deckId !== "poco");
    expect(fromEarlier.length).toBeGreaterThan(EXAM_REVIEW_QUESTIONS);
  });

  it("fills the whole exam from its own shelf when nothing precedes it", () => {
    const exam = buildExam({
      groupId: "g1",
      groups: [g1, g2],
      decks,
      kid: "listener",
      random: Math.random,
    });
    expect(exam.rounds.every((r) => r.deckId === "uno" || r.deckId === "dos")).toBe(
      true,
    );
  });

  it("refuses to build an exam it cannot fill", () => {
    const tiny = group("tiny", ["small"]);
    expect(() =>
      buildExam({
        groupId: "tiny",
        groups: [tiny],
        decks: [testDeck("small", 3)],
        kid: "listener",
        random: firstAlways,
      }),
    ).toThrow(ExamPoolTooSmallError);
  });

  it("skips learn-only decks, which deal no questions", () => {
    const verbs: Deck = { ...testDeck("verbos", 12), learnOnly: true };
    const shelf = group("mix", ["verbos", "uno"]);
    const exam = buildExam({
      groupId: "mix",
      groups: [shelf],
      decks: [verbs, testDeck("uno", 12)],
      kid: "listener",
      random: Math.random,
    });
    expect(exam.rounds.every((r) => r.deckId !== "verbos")).toBe(true);
  });

  it("weights shaky words up, so an exam re-asks what a kid finds hard", () => {
    const shaky = { "uno-1": { right: 0, wrong: 8 } };
    const drawn = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      const exam = buildExam({
        groupId: "g1",
        groups: [g1, g2],
        decks,
        kid: "listener",
        random: Math.random,
        stats: shaky,
      });
      exam.rounds.forEach((r) => drawn.add(r.answer.id));
    }
    expect(drawn.has("uno-1")).toBe(true);
  });
});

describe("the retry gate", () => {
  it("nominates the weakest deck in the shelf after a fail", () => {
    // `dos` is the one with wrong answers against it, so that is what to play.
    const deck = nominatePracticeDeck({
      groupId: "g1",
      groups: [g1],
      decks,
      stats: {
        "dos-1": { right: 0, wrong: 5 },
        "uno-1": { right: 4, wrong: 0 },
      },
    });
    expect(deck).toBe("dos");
  });

  it("always nominates something, even with no stats at all", () => {
    // ADR 021: the route may never say "no" without saying "do this instead".
    const deck = nominatePracticeDeck({
      groupId: "g1",
      groups: [g1],
      decks,
      stats: {},
    });
    expect(deck).not.toBeNull();
  });

  it("stays shut until the nominated deck is played again", () => {
    const practice = { groupId: "g1", deckId: "dos", mark: 4 };
    expect(clearedPractice(practice, 4)).toBe(false);
    expect(clearedPractice(practice, 5)).toBe(true);
  });

  it("is cleared when there is no practice pending", () => {
    expect(clearedPractice(null, 0)).toBe(true);
  });
});

describe("the stored ledger crossing the storage boundary", () => {
  it("salvages per shelf, so one bad entry costs only itself", () => {
    expect(
      sanitizeExamRecords({
        g1: { bestScore: 9, attempts: 1 },
        g2: { bestScore: "lots", attempts: 1 },
        g3: { bestScore: 7, attempts: -2 },
        g4: { bestScore: 1.5, attempts: 1 },
      }),
    ).toEqual({ g1: { bestScore: 9, attempts: 1 } });
  });

  it("reads a non-object as an empty ledger", () => {
    expect(sanitizeExamRecords(null)).toEqual({});
    expect(sanitizeExamRecords("nope")).toEqual({});
    expect(sanitizeExamRecords(undefined)).toEqual({});
  });

  it("rejects a practice gate missing any of its three fields", () => {
    expect(isExamPractice({ groupId: "g1", deckId: "uno", mark: 3 })).toBe(true);
    expect(isExamPractice({ groupId: "g1", deckId: "uno" })).toBe(false);
    expect(isExamPractice({ groupId: "g1", mark: 3 })).toBe(false);
    expect(isExamPractice({ deckId: "uno", mark: 3 })).toBe(false);
    expect(isExamPractice(null)).toBe(false);
  });

  it("rejects an infinite mark, which would gate a kid out forever", () => {
    expect(isExamPractice({ groupId: "g1", deckId: "uno", mark: Infinity })).toBe(
      false,
    );
  });
});

describe("a shelf with nothing playable on it", () => {
  const empty = group("empty", ["only-verbs"]);
  const verbs: Deck = { ...testDeck("only-verbs", 12), learnOnly: true };

  it("nominates no practice deck rather than inventing one", () => {
    expect(
      nominatePracticeDeck({
        groupId: "empty",
        groups: [empty],
        decks: [verbs],
        stats: {},
      }),
    ).toBeNull();
  });

  it("refuses to build an exam for it", () => {
    expect(() =>
      buildExam({
        groupId: "empty",
        groups: [empty],
        decks: [verbs],
        kid: "listener",
        random: Math.random,
      }),
    ).toThrow(ExamPoolTooSmallError);
  });
});
