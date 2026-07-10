import { describe, expect, it } from "vitest";
import { createQuiz, MAX_QUIZ_ROUNDS, QUIZ_CHOICE_COUNT } from "../src/domain/quiz";
import { QuizDeckTooSmallError } from "../src/domain/errors";
import type { Deck } from "../src/domain/deck";
import type { VocabularyCard } from "../src/domain/card";

function card(n: number): VocabularyCard {
  return {
    id: `word-${n}`,
    spanish: `palabra ${n}`,
    english: `word ${n}`,
    emoji: String.fromCodePoint(0x1f400 + n),
  };
}

function deckOf(cardCount: number): Deck {
  return {
    id: "test-deck",
    nameSpanish: "Prueba",
    nameEnglish: "Test",
    emoji: "🧪",
    cards: Array.from({ length: cardCount }, (_, i) => card(i)),
  };
}

/** Deterministic RNG (mulberry32) so shuffle assertions are reproducible. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("createQuiz", () => {
  it("gives listen-mode rounds 2 choices and read-mode rounds 4", () => {
    const listen = createQuiz(deckOf(10), "listen", seededRandom(1));
    const read = createQuiz(deckOf(10), "read", seededRandom(1));
    for (const round of listen.rounds) {
      expect(round.choices).toHaveLength(QUIZ_CHOICE_COUNT.listen);
    }
    for (const round of read.rounds) {
      expect(round.choices).toHaveLength(QUIZ_CHOICE_COUNT.read);
    }
  });

  it("puts the answer among the choices exactly once", () => {
    const quiz = createQuiz(deckOf(12), "read", seededRandom(2));
    for (const round of quiz.rounds) {
      const hits = round.choices.filter((c) => c.id === round.answer.id);
      expect(hits).toHaveLength(1);
    }
  });

  it("draws distinct distractors from the same deck", () => {
    const deck = deckOf(12);
    const deckIds = new Set(deck.cards.map((c) => c.id));
    const quiz = createQuiz(deck, "read", seededRandom(3));
    for (const round of quiz.rounds) {
      const ids = round.choices.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(deckIds.has(id)).toBe(true);
      }
    }
  });

  it("caps a quiz at 8 rounds with no repeated answer", () => {
    const quiz = createQuiz(deckOf(15), "listen", seededRandom(4));
    expect(quiz.rounds).toHaveLength(MAX_QUIZ_ROUNDS);
    const answerIds = quiz.rounds.map((r) => r.answer.id);
    expect(new Set(answerIds).size).toBe(answerIds.length);
  });

  it("does not always place the answer in the same choice slot", () => {
    const quiz = createQuiz(deckOf(15), "listen", seededRandom(5));
    const slots = quiz.rounds.map((r) =>
      r.choices.findIndex((c) => c.id === r.answer.id),
    );
    expect(new Set(slots).size).toBeGreaterThan(1);
  });

  it("shuffles differently for different random sources", () => {
    const a = createQuiz(deckOf(15), "read", seededRandom(6));
    const b = createQuiz(deckOf(15), "read", seededRandom(7));
    expect(a.rounds.map((r) => r.answer.id)).not.toEqual(
      b.rounds.map((r) => r.answer.id),
    );
  });

  it("echoes the deck id and mode", () => {
    const quiz = createQuiz(deckOf(10), "read", seededRandom(8));
    expect(quiz.deckId).toBe("test-deck");
    expect(quiz.mode).toBe("read");
  });

  it("throws a typed error when the deck cannot fill the choices", () => {
    expect(() => createQuiz(deckOf(3), "read", seededRandom(9))).toThrow(
      QuizDeckTooSmallError,
    );
  });
});
