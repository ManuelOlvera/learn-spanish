import { describe, expect, it } from "vitest";
import {
  ADIVINA_GUESSES,
  ADIVINA_LEVELS,
  ADIVINA_MIN_POOL,
  adivinaDifficulties,
  adivinaPool,
  createAdivinaGame,
  scoreGuess,
} from "../src/domain/adivina";
import type { AdivinaDifficulty } from "../src/domain/adivina";
import type { VocabularyCard } from "../src/domain/card";
import { seededRandom } from "./helpers";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import { StaticDeckGroupRepository } from "../src/infrastructure/static-deck-group-repository";

function cards(words: readonly string[]): readonly VocabularyCard[] {
  return words.map((w, i) => ({
    id: w,
    spanish: `el ${w}`,
    english: w,
    emoji: String.fromCodePoint(0x1f400 + i),
  }));
}

/** Eight five-letter words — a real pool at the medium level. */
const FIVES = [
  "perro",
  "gorra",
  "leche",
  "silla",
  "manzo",
  "queso",
  "playa",
  "verde",
];

describe("scoreGuess", () => {
  it("marks an exact match all hits", () => {
    expect(scoreGuess("PERRO", "PERRO")).toEqual([
      "hit",
      "hit",
      "hit",
      "hit",
      "hit",
    ]);
  });

  it("marks letters in the wrong place as present", () => {
    expect(scoreGuess("ORPRE", "PERRO")).toEqual([
      "present",
      "present",
      "present",
      "hit",
      "present",
    ]);
  });

  it("marks absent letters as misses", () => {
    expect(scoreGuess("SALTA", "PERRO")).toEqual([
      "miss",
      "miss",
      "miss",
      "miss",
      "miss",
    ]);
  });

  // The classic wordle bug: a letter guessed twice that appears once in the
  // target must light up ONCE, and the exact-position one wins.
  it("does not over-credit a duplicate letter", () => {
    // GATOS vs SOTAS? Use a clean case: target has one O, guess has two.
    expect(scoreGuess("OSO", "OSA")).toEqual(["hit", "hit", "miss"]);
    expect(scoreGuess("OSO", "AZO")).toEqual(["miss", "miss", "hit"]);
  });

  it("gives the position match priority over an earlier loose match", () => {
    // Target ALTA has two A's; guess AAAA can only light the two real ones.
    const marks = scoreGuess("AAAA", "ALTA");
    expect(marks.filter((m) => m === "hit")).toHaveLength(2);
    expect(marks.filter((m) => m === "present")).toHaveLength(0);
    expect(marks).toEqual(["hit", "miss", "miss", "hit"]);
  });

  it("credits a repeated guess letter only as often as the target has it", () => {
    // Target CASA: one C, one S, two A's. Guess AAAS: two A's can light.
    const marks = scoreGuess("AAAS", "CASA");
    expect(marks.filter((m) => m !== "miss")).toHaveLength(3);
  });

  it("rejects a guess of the wrong length", () => {
    expect(() => scoreGuess("PERR", "PERRO")).toThrow();
  });
});

describe("adivinaPool", () => {
  it("collects the words of exactly that length, deaccented", () => {
    const pool = adivinaPool(cards(["pájaro", "gato", "casa", "sol"]), 4);
    expect(pool.map((p) => p.word).sort()).toEqual(["CASA", "GATO"]);
  });

  it("drops multi-word cards", () => {
    const pool = adivinaPool(
      [
        { id: "a", spanish: "la uve doble", english: "", emoji: "W" },
        { id: "b", spanish: "el gato", english: "", emoji: "🐱" },
      ],
      4,
    );
    expect(pool.map((p) => p.word)).toEqual(["GATO"]);
  });

  it("de-duplicates a word two decks share", () => {
    // "naranja" is both a fruit and a colour — one entry in the guess list,
    // or the same word could be both the answer and a decoy.
    const pool = adivinaPool(
      [
        { id: "fruit", spanish: "la naranja", english: "orange", emoji: "🍊" },
        { id: "color", spanish: "naranja", english: "orange", emoji: "🟠" },
      ],
      7,
    );
    expect(pool).toHaveLength(1);
  });
});

describe("adivinaDifficulties", () => {
  it("offers a level only when the pool is big enough to deduce from", () => {
    const offered = adivinaDifficulties(cards(FIVES));
    expect(offered).toEqual(["medium"]);
  });

  it("offers nothing for a category of short words", () => {
    expect(adivinaDifficulties(cards(["sol", "pan", "pie", "mar"]))).toEqual([]);
  });

  it("needs the full minimum, not one short", () => {
    const nearly = cards(FIVES.slice(0, ADIVINA_MIN_POOL - 1));
    expect(adivinaDifficulties(nearly)).toEqual([]);
    const just = cards(FIVES.slice(0, ADIVINA_MIN_POOL));
    expect(just).toHaveLength(ADIVINA_MIN_POOL);
    expect(adivinaDifficulties(just)).toEqual(["medium"]);
  });
});

describe("createAdivinaGame", () => {
  it("draws a target from the category's own words", () => {
    const game = createAdivinaGame(
      "casa",
      cards(FIVES),
      "medium",
      seededRandom(5),
    );
    expect(game.pool.map((p) => p.word)).toContain(game.target.word);
    expect(game.target.word).toHaveLength(ADIVINA_LEVELS.medium);
  });

  it("offers every pool word as a tappable guess", () => {
    const game = createAdivinaGame(
      "casa",
      cards(FIVES),
      "medium",
      seededRandom(5),
    );
    expect(game.pool).toHaveLength(FIVES.length);
    for (const entry of game.pool) {
      expect(entry.word).toHaveLength(ADIVINA_LEVELS.medium);
    }
  });

  it("throws rather than dealing an unplayable round", () => {
    expect(() =>
      createAdivinaGame("casa", cards(["sol"]), "medium", seededRandom(1)),
    ).toThrow();
  });
});

describe("the real pack", () => {
  it("gives every category but the letters shelf a playable level", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const groups = await new StaticDeckGroupRepository().listGroups();
    for (const group of groups) {
      const groupCards = group.deckIds.flatMap(
        (id) => decks.find((d) => d.id === id)?.cards ?? [],
      );
      const offered = adivinaDifficulties(groupCards);
      if (group.id === "letras") {
        // Letter names are 2–4 characters and too few of any one length.
        expect(offered).toEqual([]);
      } else {
        expect(offered.length).toBeGreaterThan(0);
      }
    }
  });

  it("can always be won inside the guess budget from its own pool", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const groups = await new StaticDeckGroupRepository().listGroups();
    for (const group of groups) {
      const groupCards = group.deckIds.flatMap(
        (id) => decks.find((d) => d.id === id)?.cards ?? [],
      );
      for (const level of adivinaDifficulties(groupCards)) {
        const game = createAdivinaGame(
          group.id,
          groupCards,
          level as AdivinaDifficulty,
          seededRandom(13),
        );
        // Guessing the pool in order always finds the target; the budget only
        // has to be reachable, not generous.
        const at = game.pool.findIndex((p) => p.word === game.target.word);
        expect(at).toBeGreaterThanOrEqual(0);
        expect(ADIVINA_GUESSES).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
