import { describe, expect, it } from "vitest";
import {
  createMemoryGame,
  MEMORY_DIFFICULTIES,
  MEMORY_PAIR_COUNT,
  tilesMatch,
} from "../src/domain/memory";
import { QuizDeckTooSmallError } from "../src/domain/errors";
import { deckOf, seededRandom } from "./helpers";

describe("createMemoryGame", () => {
  it("sizes the board by difficulty: 3 / 5 / 8 pairs", () => {
    expect(MEMORY_PAIR_COUNT).toEqual({ easy: 3, medium: 5, hard: 8 });
    for (const difficulty of MEMORY_DIFFICULTIES) {
      const game = createMemoryGame(deckOf(12), "pictures", difficulty, seededRandom(1));
      expect(game.difficulty).toBe(difficulty);
      expect(game.tiles).toHaveLength(MEMORY_PAIR_COUNT[difficulty] * 2);
    }
  });

  it("keeps every tile a picture in pictures mode", () => {
    const game = createMemoryGame(deckOf(12), "pictures", "hard", seededRandom(1));
    for (const tile of game.tiles) {
      expect(tile.face).toBe("picture");
    }
  });

  it("pairs a picture with its word in words mode", () => {
    const game = createMemoryGame(deckOf(12), "words", "medium", seededRandom(2));
    expect(game.tiles).toHaveLength(MEMORY_PAIR_COUNT.medium * 2);
    const byCard = new Map<string, string[]>();
    for (const tile of game.tiles) {
      byCard.set(tile.cardId, [...(byCard.get(tile.cardId) ?? []), tile.face]);
    }
    for (const faces of byCard.values()) {
      expect(faces.sort()).toEqual(["picture", "word"]);
    }
  });

  it("gives every tile a unique id and exactly two tiles per card", () => {
    const game = createMemoryGame(deckOf(12), "pictures", "medium", seededRandom(3));
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
    const a = createMemoryGame(deckOf(12), "words", "medium", seededRandom(4));
    const b = createMemoryGame(deckOf(12), "words", "medium", seededRandom(5));
    expect(a.tiles.map((t) => t.id)).not.toEqual(b.tiles.map((t) => t.id));
  });

  it("throws a typed error when the deck cannot fill the pairs", () => {
    // A 2-card deck can't even fill the easy board (3 pairs).
    expect(() =>
      createMemoryGame(deckOf(2), "pictures", "easy", seededRandom(6)),
    ).toThrow(QuizDeckTooSmallError);
    // A 5-card deck fills easy/medium but not hard (8).
    expect(() =>
      createMemoryGame(deckOf(5), "pictures", "hard", seededRandom(6)),
    ).toThrow(QuizDeckTooSmallError);
  });
});

describe("tilesMatch", () => {
  it("matches two different tiles of the same card and nothing else", () => {
    const game = createMemoryGame(deckOf(12), "pictures", "medium", seededRandom(7));
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
