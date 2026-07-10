import { describe, expect, it } from "vitest";
import { GetDeckUseCase } from "../src/application/get-deck";
import { ListDecksUseCase } from "../src/application/list-decks";
import { DeckNotFoundError } from "../src/domain/errors";
import type { Deck } from "../src/domain/deck";
import type { DeckRepository } from "../src/domain/deck-repository";

const animals: Deck = {
  id: "animals",
  nameSpanish: "Los animales",
  nameEnglish: "Animals",
  emoji: "🐶",
  cards: [
    { id: "perro", spanish: "el perro", english: "the dog", emoji: "🐶" },
  ],
};

class FakeDeckRepository implements DeckRepository {
  constructor(private readonly decks: readonly Deck[]) {}
  listDecks(): Promise<readonly Deck[]> {
    return Promise.resolve(this.decks);
  }
  getDeck(deckId: string): Promise<Deck | null> {
    return Promise.resolve(this.decks.find((d) => d.id === deckId) ?? null);
  }
}

describe("GetDeckUseCase", () => {
  it("returns the deck when it exists", async () => {
    const useCase = new GetDeckUseCase(new FakeDeckRepository([animals]));
    await expect(useCase.execute("animals")).resolves.toEqual(animals);
  });

  it("throws DeckNotFoundError for an unknown deck id", async () => {
    const useCase = new GetDeckUseCase(new FakeDeckRepository([animals]));
    await expect(useCase.execute("rocketships")).rejects.toBeInstanceOf(
      DeckNotFoundError,
    );
  });

  it("includes the missing deck id in the error", async () => {
    const useCase = new GetDeckUseCase(new FakeDeckRepository([]));
    await expect(useCase.execute("rocketships")).rejects.toMatchObject({
      deckId: "rocketships",
    });
  });
});

describe("ListDecksUseCase", () => {
  it("returns every deck from the repository", async () => {
    const useCase = new ListDecksUseCase(new FakeDeckRepository([animals]));
    await expect(useCase.execute()).resolves.toEqual([animals]);
  });
});
