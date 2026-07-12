import { describe, expect, it } from "vitest";
import { ACCESSORIES, buyAccessory } from "../src/domain/wardrobe";
import { createCountingGame, COUNTING_ROUNDS } from "../src/domain/counting";
import { createSpellingGame, SPELLING_ROUNDS, spellingWord } from "../src/domain/spelling";
import { createQuizRound } from "../src/domain/quiz";
import { activityKind } from "../src/domain/mission";
import { decodeProgress, encodeProgress, mergeProgress } from "../src/domain/transfer";
import { QuizDeckTooSmallError } from "../src/domain/errors";
import { card, deckOf, seededRandom } from "./helpers";

describe("wardrobe", () => {
  it("offers a catalog with ids, emoji, and star costs", () => {
    expect(ACCESSORIES.length).toBeGreaterThanOrEqual(4);
    for (const item of ACCESSORIES) {
      expect(item.id).not.toBe("");
      expect(item.emoji).not.toBe("");
      expect(item.cost).toBeGreaterThan(0);
    }
    expect(new Set(ACCESSORIES.map((a) => a.id)).size).toBe(ACCESSORIES.length);
  });

  it("buying adds an accessory to the owned set once", () => {
    const owned = buyAccessory([], "corona");
    expect(owned).toEqual(["corona"]);
    expect(buyAccessory(owned, "corona")).toEqual(["corona"]);
    expect(buyAccessory(owned, "gafas")).toEqual(["corona", "gafas"]);
  });

  it("accessories union across transfer merges", () => {
    const a = { stickers: [], streaks: {}, avatars: {},
      pets: { listener: { meals: 3, lastFed: "2026-07-11", accessories: ["corona"] } } };
    const b = { stickers: [], streaks: {}, avatars: {},
      pets: { listener: { meals: 5, lastFed: "2026-07-10", accessories: ["gafas"] } } };
    expect(decodeProgress(encodeProgress(a)).pets?.listener?.accessories).toEqual(["corona"]);
    const merged = mergeProgress(a, b);
    expect(merged.pets?.listener).toMatchObject({
      meals: 5,
      lastFed: "2026-07-11",
      accessories: ["corona", "gafas"],
    });
  });
});

describe("createCountingGame", () => {
  const numbers = deckOf(10); // stands in for uno..diez
  const pool = Array.from({ length: 20 }, (_, i) => card(100 + i));

  it("asks 8 rounds with counts 1-10 and that many items shown", () => {
    const game = createCountingGame(pool, numbers.cards, "listen", seededRandom(1));
    expect(game.rounds).toHaveLength(COUNTING_ROUNDS);
    for (const round of game.rounds) {
      expect(round.count).toBeGreaterThanOrEqual(1);
      expect(round.count).toBeLessThanOrEqual(10);
    }
  });

  it("offers 2 choices listening and 4 reading, correct number present once", () => {
    for (const [mode, expected] of [["listen", 2], ["read", 4]] as const) {
      const game = createCountingGame(pool, numbers.cards, mode, seededRandom(2));
      for (const round of game.rounds) {
        expect(round.choices).toHaveLength(expected);
        // the answer card is the (count)th number card
        const hits = round.choices.filter((c) => c.id === numbers.cards[round.count - 1]!.id);
        expect(hits).toHaveLength(1);
      }
    }
  });

  it("throws when the number cards cannot cover the counts", () => {
    expect(() =>
      createCountingGame(pool, numbers.cards.slice(0, 3), "listen", seededRandom(3)),
    ).toThrow(QuizDeckTooSmallError);
  });
});

describe("createSpellingGame", () => {
  it("strips articles and keeps only kid-spellable words", () => {
    expect(spellingWord({ ...card(0), spanish: "el gato" })).toBe("gato");
    expect(spellingWord({ ...card(0), spanish: "los calcetines" })).toBeNull(); // too long
    expect(spellingWord({ ...card(0), spanish: "el pez payaso" })).toBeNull(); // two words
    expect(spellingWord({ ...card(0), spanish: "rojo" })).toBe("rojo");
  });

  it("deals 6 rounds of shuffled letter tiles, never pre-solved", () => {
    const deck = {
      ...deckOf(0),
      cards: ["el gato", "la vaca", "rojo", "el pan", "la luna", "el sol", "verde", "azul"].map(
        (spanish, i) => ({ ...card(i), spanish }),
      ),
    };
    const game = createSpellingGame(deck, seededRandom(4));
    expect(game.rounds).toHaveLength(SPELLING_ROUNDS);
    for (const round of game.rounds) {
      expect([...round.tiles].sort()).toEqual([...round.word].sort());
      expect(round.tiles.join("")).not.toBe(round.word);
    }
  });

  it("throws when a deck lacks spellable words", () => {
    const deck = {
      ...deckOf(0),
      cards: [{ ...card(0), spanish: "el pez payaso" }, { ...card(1), spanish: "los calcetines" }],
    };
    expect(() => createSpellingGame(deck, seededRandom(5))).toThrow(QuizDeckTooSmallError);
  });
});

describe("createQuizRound (reto)", () => {
  it("builds standalone rounds with the right choice counts", () => {
    const deck = deckOf(12);
    const round = createQuizRound(deck, "read", seededRandom(6));
    expect(round.choices).toHaveLength(4);
    expect(round.choices.filter((c) => c.id === round.answer.id)).toHaveLength(1);
  });
});

describe("activityKind additions", () => {
  it("maps counting and dash-less activities", () => {
    expect(activityKind("counting-listen")).toBe("counting");
    expect(activityKind("counting-read")).toBe("counting");
    expect(activityKind("spelling")).toBe("spelling");
  });
});
