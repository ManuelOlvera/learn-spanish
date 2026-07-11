import { describe, expect, it } from "vitest";
import {
  createSceneGame,
  SCENE_ITEMS,
  SCENE_ROUNDS,
  sceneQuestion,
} from "../src/domain/scene";
import { QuizDeckTooSmallError } from "../src/domain/errors";
import { card, deckOf, seededRandom } from "./helpers";

describe("createSceneGame", () => {
  it("places 12 items and asks for 8 of them", () => {
    const game = createSceneGame(deckOf(15), "listen", seededRandom(1));
    expect(game.items).toHaveLength(SCENE_ITEMS);
    expect(game.rounds).toHaveLength(SCENE_ROUNDS);
  });

  it("keeps every item inside the board with no two in the same spot", () => {
    const game = createSceneGame(deckOf(12), "read", seededRandom(2));
    const spots = new Set<string>();
    for (const item of game.items) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThanOrEqual(100);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeLessThanOrEqual(100);
      spots.add(`${Math.round(item.x / 20)}-${Math.round(item.y / 20)}`);
    }
    expect(spots.size).toBe(game.items.length);
  });

  it("only asks for cards that are on the board, never twice", () => {
    const game = createSceneGame(deckOf(12), "listen", seededRandom(3));
    const placed = new Set(game.items.map((i) => i.card.id));
    const asked = game.rounds.map((r) => r.id);
    expect(new Set(asked).size).toBe(asked.length);
    for (const id of asked) {
      expect(placed.has(id)).toBe(true);
    }
  });

  it("shrinks to the deck size when smaller than a full scene", () => {
    const game = createSceneGame(deckOf(10), "listen", seededRandom(4));
    expect(game.items).toHaveLength(10);
  });

  it("throws a typed error when the deck cannot fill the rounds", () => {
    expect(() => createSceneGame(deckOf(4), "listen", seededRandom(5))).toThrow(
      QuizDeckTooSmallError,
    );
  });
});

describe("sceneQuestion", () => {
  it("asks ¿Dónde está…? with the definite article", () => {
    expect(sceneQuestion({ ...card(0), spanish: "el gato" })).toBe(
      "¿Dónde está el gato?",
    );
  });

  it("agrees in number for plural nouns", () => {
    expect(
      sceneQuestion({ ...card(0), spanish: "los calcetines" }),
    ).toBe("¿Dónde están los calcetines?");
  });

  it("adds the article for bare nouns (colors, numbers)", () => {
    expect(sceneQuestion({ ...card(0), spanish: "rojo" })).toBe(
      "¿Dónde está el rojo?",
    );
  });

  it("asks ¿Quién está…? for feelings", () => {
    expect(
      sceneQuestion({ ...card(0), spanish: "triste", usesEstar: true }),
    ).toBe("¿Quién está triste?");
  });
});
