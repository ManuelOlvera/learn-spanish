import { describe, expect, it } from "vitest";
import {
  ADIVINA_GUESSES,
  ADIVINA_LEVELS,
  ADIVINA_TIPS,
  guessesLeft,
  revealTipIndex,
  ADIVINA_MIN_POOL,
  adivinaDictionary,
  adivinaDifficulties,
  adivinaPool,
  createAdivinaGame,
  isRealWord,
  keyboardMarks,
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
  /** Words from other shelves — legal to type, never the answer here. */
  const ELSEWHERE = ["perro", "coche", "nieve", "libro"];

  it("draws the target from the category, never from the wider pack", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const game = createAdivinaGame(
        "casa",
        cards(FIVES),
        cards([...FIVES, ...ELSEWHERE]),
        "medium",
        seededRandom(seed),
      );
      expect(FIVES.map((w) => w.toUpperCase())).toContain(game.target.word);
      expect(game.target.word).toHaveLength(ADIVINA_LEVELS.medium);
    }
  });

  it("accepts any pack word of the right length as a guess", () => {
    const game = createAdivinaGame(
      "casa",
      cards(FIVES),
      cards([...FIVES, ...ELSEWHERE]),
      "medium",
      seededRandom(5),
    );
    // A word from another shelf is typable...
    expect(isRealWord("PERRO", game.dictionary)).toBe(true);
    // ...the target always is...
    expect(isRealWord(game.target.word, game.dictionary)).toBe(true);
    // ...and a made-up word never is.
    expect(isRealWord("ZZZZZ", game.dictionary)).toBe(false);
    expect(isRealWord("QWERT", game.dictionary)).toBe(false);
  });

  it("keeps the dictionary to the target's length", () => {
    const game = createAdivinaGame(
      "casa",
      cards(FIVES),
      cards([...FIVES, ...ELSEWHERE, "sol", "elefante"]),
      "medium",
      seededRandom(2),
    );
    for (const word of game.dictionary) {
      expect(word).toHaveLength(ADIVINA_LEVELS.medium);
    }
    expect(isRealWord("SOL", game.dictionary)).toBe(false);
  });

  it("throws rather than dealing an unplayable round", () => {
    expect(() =>
      createAdivinaGame(
        "casa",
        cards(["sol"]),
        cards(FIVES),
        "medium",
        seededRandom(1),
      ),
    ).toThrow();
  });
});

describe("tips", () => {
  it("spends a guess, so four tips leave two tries", () => {
    expect(guessesLeft(0, 0)).toBe(ADIVINA_GUESSES);
    expect(guessesLeft(0, 4)).toBe(ADIVINA_GUESSES - 4);
    expect(guessesLeft(2, 1)).toBe(ADIVINA_GUESSES - 3);
  });

  it("never reports a negative budget", () => {
    expect(guessesLeft(5, 4)).toBe(0);
  });

  it("uncovers a position that isn't showing yet", () => {
    for (let seed = 1; seed <= 15; seed++) {
      const index = revealTipIndex("PERRO", [0, 4], seededRandom(seed));
      expect([1, 2, 3]).toContain(index);
    }
  });

  it("returns null once the whole word is showing", () => {
    expect(revealTipIndex("GATO", [0, 1, 2, 3], seededRandom(1))).toBeNull();
  });

  it("can uncover the last remaining position", () => {
    expect(revealTipIndex("GATO", [0, 1, 3], seededRandom(4))).toBe(2);
  });

  it("offers the four kinds, weakest first", () => {
    expect(ADIVINA_TIPS).toEqual(["meaning", "picture", "first", "letter"]);
  });
});

describe("keyboardMarks", () => {
  it("tints a key by the best news about that letter", () => {
    // PERRO: R appears twice. Guess GORRA then PERRO.
    const marks = keyboardMarks(["FRESA"], "PERRO");
    expect(marks.get("R")).toBe("present");
    expect(marks.get("E")).toBe("present");
    expect(marks.get("F")).toBe("miss");
  });

  it("never demotes a letter already placed exactly", () => {
    // First guess places O exactly; a later guess puts O in the wrong slot.
    const marks = keyboardMarks(["PERRO", "OSTRA"], "PERRO");
    expect(marks.get("O")).toBe("hit");
    expect(marks.get("P")).toBe("hit");
  });

  it("is empty before the first guess", () => {
    expect(keyboardMarks([], "PERRO").size).toBe(0);
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

  it("always lets the kid type the answer itself", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const groups = await new StaticDeckGroupRepository().listGroups();
    const packCards = decks.flatMap((d) => d.cards);
    for (const group of groups) {
      const groupCards = group.deckIds.flatMap(
        (id) => decks.find((d) => d.id === id)?.cards ?? [],
      );
      for (const level of adivinaDifficulties(groupCards)) {
        const game = createAdivinaGame(
          group.id,
          groupCards,
          packCards,
          level as AdivinaDifficulty,
          seededRandom(13),
        );
        // An unwinnable round — a target the dictionary rejects — would be the
        // worst possible bug here.
        expect(isRealWord(game.target.word, game.dictionary)).toBe(true);
        expect(game.dictionary.length).toBeGreaterThanOrEqual(ADIVINA_GUESSES);
      }
    }
  });

  it("gives every playable length a real typing vocabulary", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const packCards = decks.flatMap((d) => d.cards);
    for (const length of [4, 5, 6]) {
      const dictionary = adivinaDictionary(packCards, length);
      expect(dictionary.length).toBeGreaterThan(50);
      expect(new Set(dictionary).size).toBe(dictionary.length);
    }
  });
});
