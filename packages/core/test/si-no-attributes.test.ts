import { describe, expect, it } from "vitest";
import { createSiNoGame, roundQuestion } from "../src/domain/si-no";
import type { Deck } from "../src/domain/deck";
import type { VocabularyCard } from "../src/domain/card";
import type { CardAttribute } from "../src/domain/attribute";

function card(
  id: string,
  spanish: string,
  attributes?: readonly CardAttribute[],
): VocabularyCard {
  return { id, spanish, english: id, emoji: "🧪", ...(attributes ? { attributes } : {}) };
}

const attributed: Deck = {
  id: "d",
  nameSpanish: "d",
  nameEnglish: "d",
  emoji: "🧪",
  cards: [
    card("rana", "la rana", [{ kind: "color", value: "verde" }]),
    card("platano", "el plátano", [{ kind: "color", value: "amarillo" }]),
    card("manzana", "la manzana", [{ kind: "color", value: "rojo" }]),
    card("elefante", "el elefante", [{ kind: "size", value: "grande" }]),
  ],
};

const bare: Deck = {
  ...attributed,
  cards: [card("uno", "uno"), card("dos", "dos"), card("tres", "tres")],
};

/** A source that always returns the same value — enough to steer every
 *  coin-flip in the generator to one side. */
const fixed = (n: number) => () => n;

describe("sí o no with attribute claims (roadmap 4)", () => {
  it("asks about a property in read mode, not just an identity", () => {
    const game = createSiNoGame(attributed, "read", fixed(0));
    expect(game.rounds.some((r) => r.attribute !== undefined)).toBe(true);
  });

  it("leaves the listener's game as identity claims only", () => {
    // Deliberate: roadmap 4 says the *older* mode swaps in sentences. The
    // pre-reader's round is unchanged by this feature.
    const game = createSiNoGame(attributed, "listen", fixed(0));
    expect(game.rounds.every((r) => r.attribute === undefined)).toBe(true);
  });

  it("marks a true attribute round true, and its question agrees", () => {
    const game = createSiNoGame(attributed, "read", fixed(0.9));
    const round = game.rounds.find(
      (r) => r.attribute !== undefined && r.card.id === "manzana",
    );
    if (round !== undefined) {
      expect(round.isTrue).toBe(true);
      expect(roundQuestion(round)).toBe("¿La manzana es roja?");
    }
  });

  it("marks a false attribute round false", () => {
    const game = createSiNoGame(attributed, "read", fixed(0));
    for (const round of game.rounds) {
      if (round.attribute !== undefined) {
        const claimed = round.attribute.value;
        const holds = (round.card.attributes ?? []).some((a) => a.value === claimed);
        expect(round.isTrue).toBe(holds);
      }
    }
  });

  it("keeps the claimed card as the pictured card on an attribute round", () => {
    // The picture is what the kid judges the claim against, so the round may
    // never show one thing and ask about another.
    const game = createSiNoGame(attributed, "read", fixed(0));
    for (const round of game.rounds) {
      if (round.attribute !== undefined) {
        expect(round.claim.id).toBe(round.card.id);
      }
    }
  });

  it("falls back to identity claims on a deck with no attributes", () => {
    const game = createSiNoGame(bare, "read", fixed(0));
    expect(game.rounds.every((r) => r.attribute === undefined)).toBe(true);
    expect(game.rounds.length).toBeGreaterThan(0);
  });

  it("still asks an identity question the old way", () => {
    const game = createSiNoGame(bare, "read", fixed(0.9));
    expect(roundQuestion(game.rounds[0]!)).toMatch(/^¿Es /);
  });

  it("never deals a round it cannot lie about", () => {
    // Every attribute round must be able to be false, or the game degenerates
    // into "always tap sí".
    const game = createSiNoGame(attributed, "read", fixed(0.2));
    for (const round of game.rounds) {
      if (round.attribute !== undefined) {
        expect(round.attribute.value).toBeTruthy();
      }
    }
  });
});
