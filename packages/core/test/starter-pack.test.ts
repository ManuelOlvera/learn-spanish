import { describe, expect, it } from "vitest";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";

const repo = new StaticDeckRepository();

describe("starter pack content", () => {
  it("ships the four launch categories", async () => {
    const decks = await repo.listDecks();
    expect(decks.map((d) => d.id)).toEqual([
      "animals",
      "colors",
      "numbers",
      "food",
    ]);
  });

  it("holds 40-60 words total, at least 10 per deck", async () => {
    const decks = await repo.listDecks();
    const total = decks.reduce((sum, d) => sum + d.cards.length, 0);
    expect(total).toBeGreaterThanOrEqual(40);
    expect(total).toBeLessThanOrEqual(60);
    for (const deck of decks) {
      expect(deck.cards.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("gives every card an id, Spanish word, English gloss, and emoji", async () => {
    const decks = await repo.listDecks();
    for (const deck of decks) {
      for (const card of deck.cards) {
        expect(card.id).not.toBe("");
        expect(card.spanish).not.toBe("");
        expect(card.english).not.toBe("");
        // Pre-readers navigate by picture alone — a card without a visual is broken.
        expect(card.emoji).not.toBe("");
      }
    }
  });

  it("never repeats a card id across the whole pack", async () => {
    const decks = await repo.listDecks();
    const ids = decks.flatMap((d) => d.cards.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("finds a deck by id and returns null for unknown ids", async () => {
    await expect(repo.getDeck("animals")).resolves.toMatchObject({
      id: "animals",
    });
    await expect(repo.getDeck("nope")).resolves.toBeNull();
  });
});
