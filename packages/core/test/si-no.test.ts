import { describe, expect, it } from "vitest";
import {
  createSiNoGame,
  SI_NO_ROUNDS,
  siNoQuestion,
} from "../src/domain/si-no";
import { QuizDeckTooSmallError } from "../src/domain/errors";
import type { Deck } from "../src/domain/deck";
import type { VocabularyCard } from "../src/domain/card";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";

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

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("createSiNoGame", () => {
  it("plays 8 rounds with no repeated picture", () => {
    const game = createSiNoGame(deckOf(12), "listen", seededRandom(1));
    expect(game.rounds).toHaveLength(SI_NO_ROUNDS);
    const cardIds = game.rounds.map((r) => r.card.id);
    expect(new Set(cardIds).size).toBe(cardIds.length);
  });

  it("marks a round true exactly when the claim names the picture", () => {
    const game = createSiNoGame(deckOf(12), "read", seededRandom(2));
    for (const round of game.rounds) {
      expect(round.isTrue).toBe(round.claim.id === round.card.id);
    }
  });

  it("mixes true and false rounds", () => {
    const game = createSiNoGame(deckOf(12), "listen", seededRandom(3));
    const truths = game.rounds.map((r) => r.isTrue);
    expect(truths).toContain(true);
    expect(truths).toContain(false);
  });

  it("draws false claims from the same deck", () => {
    const deckIds = new Set(deckOf(12).cards.map((c) => c.id));
    const game = createSiNoGame(deckOf(12), "listen", seededRandom(4));
    for (const round of game.rounds) {
      expect(deckIds.has(round.claim.id)).toBe(true);
    }
  });

  it("echoes deck id and mode", () => {
    const game = createSiNoGame(deckOf(10), "read", seededRandom(5));
    expect(game.deckId).toBe("test-deck");
    expect(game.mode).toBe("read");
  });

  it("throws a typed error when the deck has fewer than 2 cards", () => {
    expect(() => createSiNoGame(deckOf(1), "listen", seededRandom(6))).toThrow(
      QuizDeckTooSmallError,
    );
  });
});

describe("siNoQuestion", () => {
  it("asks with ser for things and inherent qualities", () => {
    expect(
      siNoQuestion({ id: "gato", spanish: "el gato", english: "the cat", emoji: "🐱" }),
    ).toBe("¿Es el gato?");
  });

  it("asks with estar for state adjectives (feelings)", () => {
    expect(
      siNoQuestion({
        id: "triste",
        spanish: "triste",
        english: "sad",
        emoji: "😢",
        usesEstar: true,
      }),
    ).toBe("¿Está triste?");
  });

  it("marks every feelings-deck card as an estar state", async () => {
    const feelings = await new StaticDeckRepository().getDeck("feelings");
    expect(feelings).not.toBeNull();
    for (const card of feelings!.cards) {
      expect(card.usesEstar, `${card.id} must take estar`).toBe(true);
    }
  });
});
