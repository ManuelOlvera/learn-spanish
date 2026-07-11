import { describe, expect, it } from "vitest";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";

const repo = new StaticDeckRepository();

describe("starter pack content", () => {
  it("ships the expected categories", async () => {
    const decks = await repo.listDecks();
    expect(decks.map((d) => d.id)).toEqual([
      "animals",
      "colors",
      "numbers",
      "numbers-11-20",
      "numbers-tens",
      "food",
      "body",
      "clothes",
      "house",
      "vehicles",
      "weather",
      "school",
      "feelings",
      "nature",
      "toys",
      "sports",
      "bugs",
      "zoo",
      "jobs",
      "city",
      "sea",
      "fruit",
      "music",
      "mystery",
    ]);
  });

  it("keeps decks kid-sized: 10-15 cards each", async () => {
    const decks = await repo.listDecks();
    for (const deck of decks) {
      expect(deck.cards.length).toBeGreaterThanOrEqual(10);
      expect(deck.cards.length).toBeLessThanOrEqual(15);
    }
  });

  it("counts to 100: 11-20 complete, then every ten up to cien", async () => {
    const teens = await repo.getDeck("numbers-11-20");
    expect(teens?.cards.map((c) => c.spanish)).toEqual([
      "once",
      "doce",
      "trece",
      "catorce",
      "quince",
      "dieciséis",
      "diecisiete",
      "dieciocho",
      "diecinueve",
      "veinte",
    ]);
    const tens = await repo.getDeck("numbers-tens");
    expect(tens?.cards.map((c) => c.spanish)).toEqual([
      "diez",
      "veinte",
      "treinta",
      "cuarenta",
      "cincuenta",
      "sesenta",
      "setenta",
      "ochenta",
      "noventa",
      "cien",
    ]);
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

  it("never repeats an emoji within a deck (quiz choices are picture-only)", async () => {
    const decks = await repo.listDecks();
    for (const deck of decks) {
      const emoji = deck.cards.map((c) => c.emoji);
      expect(new Set(emoji).size).toBe(emoji.length);
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
