import { describe, expect, it } from "vitest";
import { createQuiz, quizPrompt } from "../src/domain/quiz";
import { hasAttributeValue } from "../src/domain/attribute";
import type { Deck } from "../src/domain/deck";
import type { VocabularyCard } from "../src/domain/card";
import type { CardAttribute } from "../src/domain/attribute";

function card(
  id: string,
  spanish: string,
  attributes?: readonly CardAttribute[],
): VocabularyCard {
  return { id, spanish, english: id, emoji: id, ...(attributes ? { attributes } : {}) };
}

const deck: Deck = {
  id: "d",
  nameSpanish: "d",
  nameEnglish: "d",
  emoji: "🧪",
  cards: [
    card("rana", "la rana", [{ kind: "color", value: "verde" }]),
    card("platano", "el plátano", [{ kind: "color", value: "amarillo" }]),
    card("manzana", "la manzana", [{ kind: "color", value: "rojo" }]),
    card("cereza", "la cereza", [{ kind: "color", value: "rojo" }]),
    card("elefante", "el elefante", [{ kind: "size", value: "grande" }]),
    card("raton", "el ratón", [{ kind: "size", value: "pequeño" }]),
    card("uno", "uno"),
    card("dos", "dos"),
  ],
};

const bare: Deck = {
  ...deck,
  cards: [card("a", "a"), card("b", "b"), card("c", "c"), card("d", "d")],
};

const fixed = (n: number) => () => n;

describe("quiz attribute prompts (roadmap 2)", () => {
  it("deals attribute rounds in read mode", () => {
    const quiz = createQuiz(deck, "read", fixed(0));
    expect(quiz.rounds.some((r) => r.attribute !== undefined)).toBe(true);
  });

  it("never deals one to the listener", () => {
    const quiz = createQuiz(deck, "listen", fixed(0));
    expect(quiz.rounds.every((r) => r.attribute === undefined)).toBe(true);
  });

  it("puts exactly one matching choice on the board", () => {
    // The invariant that makes the question answerable at all: two green
    // choices means a kid who taps the other green one is marked wrong for
    // being right.
    for (let i = 0; i < 20; i += 1) {
      const quiz = createQuiz(deck, "read", fixed(i / 20));
      for (const round of quiz.rounds) {
        if (round.attribute === undefined) continue;
        const matching = round.choices.filter((c) =>
          hasAttributeValue(c, round.attribute!.value),
        );
        expect(matching).toHaveLength(1);
        expect(matching[0]!.id).toBe(round.answer.id);
      }
    }
  });

  it("keeps the answer among the choices", () => {
    const quiz = createQuiz(deck, "read", fixed(0.3));
    for (const round of quiz.rounds) {
      expect(round.choices.map((c) => c.id)).toContain(round.answer.id);
    }
  });

  it("still deals the full choice count on an attribute round", () => {
    const quiz = createQuiz(deck, "read", fixed(0));
    for (const round of quiz.rounds) {
      expect(round.choices).toHaveLength(4);
    }
  });

  it("asks for the property, not the word", () => {
    const quiz = createQuiz(deck, "read", fixed(0));
    const round = quiz.rounds.find((r) => r.attribute !== undefined)!;
    expect(quizPrompt(round)).toMatch(/^Toca (el|la|los|las) que (es|son) /);
  });

  it("asks for the word on an ordinary round", () => {
    const quiz = createQuiz(bare, "read", fixed(0));
    expect(quizPrompt(quiz.rounds[0]!)).toBe(quiz.rounds[0]!.answer.spanish);
  });

  it("falls back to an identity round when the deck cannot support one", () => {
    const quiz = createQuiz(bare, "read", fixed(0));
    expect(quiz.rounds.every((r) => r.attribute === undefined)).toBe(true);
    expect(quiz.rounds.length).toBeGreaterThan(0);
  });

  it("falls back when every other card shares the answer's attribute", () => {
    // Two reds and nothing else: there are not enough non-matching cards to
    // fill the board, so the round must become an identity round rather than
    // deal an ambiguous one.
    const reds: Deck = {
      ...deck,
      cards: [
        card("manzana", "la manzana", [{ kind: "color", value: "rojo" }]),
        card("cereza", "la cereza", [{ kind: "color", value: "rojo" }]),
        card("fresa", "la fresa", [{ kind: "color", value: "rojo" }]),
        card("tomate", "el tomate", [{ kind: "color", value: "rojo" }]),
      ],
    };
    const quiz = createQuiz(reds, "read", fixed(0));
    expect(quiz.rounds.every((r) => r.attribute === undefined)).toBe(true);
  });
});
