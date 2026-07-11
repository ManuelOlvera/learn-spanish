import { describe, expect, it } from "vitest";
import { createDuel, DUEL_ROUNDS } from "../src/domain/duel";
import { QuizDeckTooSmallError } from "../src/domain/errors";
import { deckOf, seededRandom } from "./helpers";

describe("createDuel", () => {
  it("deals 6 rounds, each with 2 listen choices and 4 read choices", () => {
    const duel = createDuel(deckOf(12), seededRandom(1));
    expect(duel.rounds).toHaveLength(DUEL_ROUNDS);
    for (const round of duel.rounds) {
      expect(round.listenChoices).toHaveLength(2);
      expect(round.readChoices).toHaveLength(4);
    }
  });

  it("shares the same target between both kids' choice sets", () => {
    const duel = createDuel(deckOf(12), seededRandom(2));
    for (const round of duel.rounds) {
      expect(
        round.listenChoices.filter((c) => c.id === round.target.id),
      ).toHaveLength(1);
      expect(
        round.readChoices.filter((c) => c.id === round.target.id),
      ).toHaveLength(1);
    }
  });

  it("never repeats a target and draws all choices from the deck", () => {
    const deck = deckOf(12);
    const ids = new Set(deck.cards.map((c) => c.id));
    const duel = createDuel(deck, seededRandom(3));
    const targets = duel.rounds.map((r) => r.target.id);
    expect(new Set(targets).size).toBe(targets.length);
    for (const round of duel.rounds) {
      for (const c of [...round.listenChoices, ...round.readChoices]) {
        expect(ids.has(c.id)).toBe(true);
      }
    }
  });

  it("throws a typed error on a too-small deck", () => {
    expect(() => createDuel(deckOf(3), seededRandom(4))).toThrow(
      QuizDeckTooSmallError,
    );
  });
});
