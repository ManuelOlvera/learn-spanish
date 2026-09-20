import { describe, expect, it } from "vitest";
import type { Deck } from "../src/domain/deck";
import type { DeckGroup } from "../src/domain/deck-group";
import {
  EXAM_PASS_MARK,
  EXAM_QUESTIONS,
  SUPER_EXAM_EVERY,
  SUPER_EXAM_PASS_MARK,
  SUPER_EXAM_QUESTIONS,
  buildExam,
  examKindFor,
  isCapstoneShelf,
  examPassed,
  isExamPass,
  passMarkFor,
  questionsFor,
} from "../src/domain/exam";
import { EXAM_BONUS, SUPER_EXAM_BONUS } from "../src/domain/stars";
import { card } from "./helpers";

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

/** Twelve shelves, one deck each — the ladder's real shape. */
const LADDER = Array.from({ length: 12 }, (_, i) => group(`g${i + 1}`, [`d${i + 1}`]));
const DECKS = Array.from({ length: 12 }, (_, i) => testDeck(`d${i + 1}`));

describe("where the súper exámenes sit", () => {
  it("falls on every fourth shelf — the ladder's thirds", () => {
    expect(SUPER_EXAM_EVERY).toBe(4);
    expect(examKindFor(3)).toBe("super"); // 4th shelf, 0-indexed
    expect(examKindFor(7)).toBe("super"); // 8th
    expect(examKindFor(11)).toBe("super"); // 12th
  });

  it("leaves every other shelf a regular exam", () => {
    for (const i of [0, 1, 2, 4, 5, 6, 8, 9, 10]) {
      expect(examKindFor(i)).toBe("regular");
    }
  });

  it("replaces that shelf's regular exam rather than following it", () => {
    // One checkpoint per shelf, whatever kind — 30 questions back to back is
    // not a kid-sized sit (ADR 021 addendum). Nine regular, three súper.
    const kinds = LADDER.map((_, i) => examKindFor(i));
    expect(kinds.filter((k) => k === "super")).toHaveLength(3);
    expect(kinds.filter((k) => k === "regular")).toHaveLength(9);
    expect(kinds).toHaveLength(LADDER.length);
  });
});

describe("the súper bar", () => {
  it("is 20 questions passed at 14 — the same 70% as the regular exam", () => {
    expect(SUPER_EXAM_QUESTIONS).toBe(20);
    expect(SUPER_EXAM_PASS_MARK).toBe(14);
    expect(SUPER_EXAM_PASS_MARK / SUPER_EXAM_QUESTIONS).toBeCloseTo(
      EXAM_PASS_MARK / EXAM_QUESTIONS,
    );
  });

  it("reads a score against the bar its own kind implies", () => {
    expect(questionsFor("super")).toBe(SUPER_EXAM_QUESTIONS);
    expect(questionsFor("regular")).toBe(EXAM_QUESTIONS);
    expect(passMarkFor("super")).toBe(SUPER_EXAM_PASS_MARK);
    expect(passMarkFor("regular")).toBe(EXAM_PASS_MARK);
  });

  it("fails one below the súper mark and passes at it", () => {
    expect(isExamPass(13, "super")).toBe(false);
    expect(isExamPass(14, "super")).toBe(true);
  });

  it("does not let a regular pass clear a súper shelf", () => {
    // 9/20 would pass a regular exam and must not pass a súper one.
    expect(examPassed({ bestScore: 9, attempts: 1 }, "super")).toBe(false);
    expect(examPassed({ bestScore: 9, attempts: 1 }, "regular")).toBe(true);
  });
});

describe("the súper reward", () => {
  it("takes the rung above the regular exam", () => {
    // Asserted against the constant below it, never a copy (ADR 020).
    expect(SUPER_EXAM_BONUS).toBeGreaterThan(EXAM_BONUS);
  });
});

describe("building a súper exam", () => {
  it("asks SUPER_EXAM_QUESTIONS rounds", () => {
    const exam = buildExam({
      groupId: "g4",
      groups: LADDER,
      decks: DECKS,
      kid: "listener",
      random: Math.random,
    });
    expect(exam.kind).toBe("super");
    expect(exam.rounds).toHaveLength(SUPER_EXAM_QUESTIONS);
  });

  it("draws from EVERY shelf completed so far, not just the one behind it", () => {
    const exam = buildExam({
      groupId: "g4",
      groups: LADDER,
      decks: DECKS,
      kid: "listener",
      random: Math.random,
    });
    const shelves = new Set(exam.rounds.map((r) => r.deckId));
    expect([...shelves].sort()).toEqual(["d1", "d2", "d3", "d4"]);
  });

  it("spreads them evenly — no shelf carries the exam alone", () => {
    const exam = buildExam({
      groupId: "g4",
      groups: LADDER,
      decks: DECKS,
      kid: "listener",
      random: Math.random,
    });
    const perDeck = new Map<string, number>();
    for (const r of exam.rounds) {
      perDeck.set(r.deckId, (perDeck.get(r.deckId) ?? 0) + 1);
    }
    // 20 questions over 4 shelves is exactly 5 each.
    expect([...perDeck.values()]).toEqual([5, 5, 5, 5]);
  });

  it("still represents the first shelf at the capstone, twelve shelves later", () => {
    // The whole point of a cumulative sweep: shelf 1 must not fall off it.
    const exam = buildExam({
      groupId: "g12",
      groups: LADDER,
      decks: DECKS,
      kid: "listener",
      random: Math.random,
    });
    expect(exam.rounds.some((r) => r.deckId === "d1")).toBe(true);
    expect(exam.rounds).toHaveLength(SUPER_EXAM_QUESTIONS);
  });

  it("spreads 20 over 12 shelves as evenly as 20 divides", () => {
    const exam = buildExam({
      groupId: "g12",
      groups: LADDER,
      decks: DECKS,
      kid: "listener",
      random: Math.random,
    });
    const perDeck = new Map<string, number>();
    for (const r of exam.rounds) {
      perDeck.set(r.deckId, (perDeck.get(r.deckId) ?? 0) + 1);
    }
    expect(perDeck.size).toBe(12);
    // Round-robin: nobody is more than one question ahead of anybody else.
    const counts = [...perDeck.values()];
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("still builds a regular exam on a non-milestone shelf", () => {
    const exam = buildExam({
      groupId: "g3",
      groups: LADDER,
      decks: DECKS,
      kid: "listener",
      random: Math.random,
    });
    expect(exam.kind).toBe("regular");
    expect(exam.rounds).toHaveLength(EXAM_QUESTIONS);
  });
});

describe("the capstone", () => {
  it("is the last shelf on the route, and only that one", () => {
    expect(isCapstoneShelf(11, 12)).toBe(true);
    expect(isCapstoneShelf(7, 12)).toBe(false);
    expect(isCapstoneShelf(3, 12)).toBe(false);
  });

  it("is a súper too — the ladder's last third ends on one", () => {
    // If these ever disagree the ceremony would give the route's final moment
    // a regular exam's trophy.
    expect(examKindFor(11)).toBe("super");
    expect(isCapstoneShelf(11, 12)).toBe(true);
  });

  it("says no when there is no route at all", () => {
    expect(isCapstoneShelf(0, 0)).toBe(false);
  });
});
