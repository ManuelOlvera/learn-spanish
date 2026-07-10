import { describe, expect, it } from "vitest";
import {
  createMemoryGame,
  MEMORY_PAIR_COUNT,
  tilesMatch,
} from "../src/domain/memory";
import { QuizDeckTooSmallError } from "../src/domain/errors";
import { deckOf, seededRandom } from "./helpers";

describe("createMemoryGame", () => {
  it("lays out 4 picture pairs in pictures mode", () => {
    const game = createMemoryGame(deckOf(12), "pictures", seededRandom(1));
    expect(game.tiles).toHaveLength(MEMORY_PAIR_COUNT.pictures * 2);
    for (const tile of game.tiles) {
      expect(tile.face).toBe("picture");
    }
  });

  it("lays out 6 picture↔word pairs in words mode", () => {
    const game = createMemoryGame(deckOf(12), "words", seededRandom(2));
    expect(game.tiles).toHaveLength(MEMORY_PAIR_COUNT.words * 2);
    const byCard = new Map<string, string[]>();
    for (const tile of game.tiles) {
      byCard.set(tile.cardId, [...(byCard.get(tile.cardId) ?? []), tile.face]);
    }
    for (const faces of byCard.values()) {
      expect(faces.sort()).toEqual(["picture", "word"]);
    }
  });

  it("gives every tile a unique id and exactly two tiles per card", () => {
    const game = createMemoryGame(deckOf(12), "pictures", seededRandom(3));
    const ids = game.tiles.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const perCard = new Map<string, number>();
    for (const tile of game.tiles) {
      perCard.set(tile.cardId, (perCard.get(tile.cardId) ?? 0) + 1);
    }
    for (const count of perCard.values()) {
      expect(count).toBe(2);
    }
  });

  it("shuffles the layout differently for different random sources", () => {
    const a = createMemoryGame(deckOf(12), "words", seededRandom(4));
    const b = createMemoryGame(deckOf(12), "words", seededRandom(5));
    expect(a.tiles.map((t) => t.id)).not.toEqual(b.tiles.map((t) => t.id));
  });

  it("throws a typed error when the deck cannot fill the pairs", () => {
    expect(() =>
      createMemoryGame(deckOf(3), "pictures", seededRandom(6)),
    ).toThrow(QuizDeckTooSmallError);
  });
});

describe("tilesMatch", () => {
  it("matches two different tiles of the same card and nothing else", () => {
    const game = createMemoryGame(deckOf(12), "pictures", seededRandom(7));
    const [first] = game.tiles;
    const partner = game.tiles.find(
      (t) => t.cardId === first!.cardId && t.id !== first!.id,
    );
    const stranger = game.tiles.find((t) => t.cardId !== first!.cardId);
    expect(tilesMatch(first!, partner!)).toBe(true);
    expect(tilesMatch(first!, stranger!)).toBe(false);
    expect(tilesMatch(first!, first!)).toBe(false);
  });
});
