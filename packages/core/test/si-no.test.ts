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
  function makeCard(spanish: string, extra: Partial<VocabularyCard> = {}): VocabularyCard {
    return { id: "x", spanish, english: "x", emoji: "❓", ...extra };
  }

  it("asks about countable nouns with the indefinite article, as a native would", () => {
    expect(siNoQuestion(makeCard("el gato"))).toBe("¿Es un gato?");
    expect(siNoQuestion(makeCard("la vaca"))).toBe("¿Es una vaca?");
  });

  it("uses Son + unos/unas for plural nouns", () => {
    expect(siNoQuestion(makeCard("los calcetines"))).toBe(
      "¿Son unos calcetines?",
    );
    expect(siNoQuestion(makeCard("las tijeras"))).toBe("¿Son unas tijeras?");
  });

  it("keeps bare adjectives bare", () => {
    expect(siNoQuestion(makeCard("rojo"))).toBe("¿Es rojo?");
  });

  it("asks with estar for state adjectives (feelings)", () => {
    expect(siNoQuestion(makeCard("triste", { usesEstar: true }))).toBe(
      "¿Está triste?",
    );
  });

  it("prefers an explicit question override (mass nouns, idioms, unique things)", () => {
    expect(
      siNoQuestion(makeCard("el agua", { question: "¿Es agua?" })),
    ).toBe("¿Es agua?");
    expect(
      siNoQuestion(makeCard("el calor", { question: "¿Hace calor?" })),
    ).toBe("¿Hace calor?");
    expect(
      siNoQuestion(makeCard("el sol", { question: "¿Es el sol?" })),
    ).toBe("¿Es el sol?");
  });

  it("marks every feelings-deck card as an estar state", async () => {
    const feelings = await new StaticDeckRepository().getDeck("feelings");
    expect(feelings).not.toBeNull();
    for (const card of feelings!.cards) {
      expect(card.usesEstar, `${card.id} must take estar`).toBe(true);
    }
  });

  it("gives every mass-noun, idiom, and unique-entity card its native question", async () => {
    const expected: Record<string, string> = {
      agua: "¿Es agua?",
      leche: "¿Es leche?",
      pan: "¿Es pan?",
      queso: "¿Es queso?",
      sol: "¿Es el sol?",
      luna: "¿Es la luna?",
      mar: "¿Es el mar?",
      lluvia: "¿Es lluvia?",
      nieve: "¿Es nieve?",
      viento: "¿Es viento?",
      calor: "¿Hace calor?",
      frio: "¿Hace frío?",
      fuego: "¿Es fuego?",
      papel: "¿Es papel?",
      futbol: "¿Es fútbol?",
      baloncesto: "¿Es baloncesto?",
      tenis: "¿Es tenis?",
      natacion: "¿Es natación?",
      beisbol: "¿Es béisbol?",
      voleibol: "¿Es voleibol?",
      golf: "¿Es golf?",
      esqui: "¿Es esquí?",
      patinaje: "¿Es patinaje?",
      ciclismo: "¿Es ciclismo?",
    };
    const decks = await new StaticDeckRepository().listDecks();
    const cards = new Map(
      decks.flatMap((d) => d.cards.map((c) => [c.id, c] as const)),
    );
    for (const [id, question] of Object.entries(expected)) {
      expect(cards.get(id)?.question, `${id} needs a question override`).toBe(
        question,
      );
    }
  });
});
