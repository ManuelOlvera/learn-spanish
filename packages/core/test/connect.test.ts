import { describe, expect, it } from "vitest";
import {
  CONNECT_BOARDS,
  CONNECT_PAIRS,
  createConnectGame,
} from "../src/domain/connect";
import { QuizDeckTooSmallError } from "../src/domain/errors";
import { deckOf, seededRandom } from "./helpers";

describe("createConnectGame", () => {
  it("deals 2 boards of 5 pairs", () => {
    const game = createConnectGame(deckOf(12), "listen", seededRandom(1));
    expect(game.boards).toHaveLength(CONNECT_BOARDS);
    for (const board of game.boards) {
      expect(board.left).toHaveLength(CONNECT_PAIRS);
      expect(board.right).toHaveLength(CONNECT_PAIRS);
    }
  });

  it("puts the same cards on both sides of a board, in different orders", () => {
    const game = createConnectGame(deckOf(12), "read", seededRandom(2));
    for (const board of game.boards) {
      const leftIds = board.left.map((c) => c.id);
      const rightIds = board.right.map((c) => c.id);
      expect([...leftIds].sort()).toEqual([...rightIds].sort());
      expect(leftIds).not.toEqual(rightIds);
    }
  });

  it("never repeats a card across boards", () => {
    const game = createConnectGame(deckOf(12), "listen", seededRandom(3));
    const all = game.boards.flatMap((b) => b.left.map((c) => c.id));
    expect(new Set(all).size).toBe(all.length);
  });

  it("shrinks to one board when the deck cannot fill two", () => {
    // 5-9 cards: one board is possible, two are not.
    const game = createConnectGame(deckOf(7), "listen", seededRandom(4));
    expect(game.boards).toHaveLength(1);
  });

  it("shuffles differently for different random sources", () => {
    const a = createConnectGame(deckOf(12), "read", seededRandom(5));
    const b = createConnectGame(deckOf(12), "read", seededRandom(6));
    expect(a.boards[0]!.left.map((c) => c.id)).not.toEqual(
      b.boards[0]!.left.map((c) => c.id),
    );
  });

  it("echoes deck id and mode", () => {
    const game = createConnectGame(deckOf(10), "read", seededRandom(7));
    expect(game.deckId).toBe("test-deck");
    expect(game.mode).toBe("read");
  });

  it("throws a typed error when the deck cannot fill one board", () => {
    expect(() => createConnectGame(deckOf(4), "listen", seededRandom(8))).toThrow(
      QuizDeckTooSmallError,
    );
  });
});
