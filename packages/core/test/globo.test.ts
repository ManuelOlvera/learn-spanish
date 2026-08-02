import { describe, expect, it } from "vitest";
import {
  createGloboGame,
  GLOBO_ALPHABET,
  GLOBO_LEVELS,
  GLOBO_LIVES,
  GLOBO_ROUNDS,
  globoDifficulties,
  globoWord,
  isSolved,
  lettersOf,
  livesLeft,
  revealed,
  wrongGuesses,
} from "../src/domain/globo";
import type { GloboDifficulty } from "../src/domain/globo";
import type { Deck } from "../src/domain/deck";
import { seededRandom } from "./helpers";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";

/** A deck with a spread of word lengths, so every band has something. */
function globoDeck(): Deck {
  const words = [
    "pez", "rana", "gato", "oso", "lobo",
    "caballo", "cerdo", "pollo", "conejo",
    "elefante", "mariposa", "cocodrilo",
  ];
  return {
    id: "globo-test",
    nameSpanish: "Prueba",
    nameEnglish: "Test",
    emoji: "🧪",
    cards: words.map((w, i) => ({
      id: w,
      spanish: `el ${w}`,
      english: w,
      emoji: String.fromCodePoint(0x1f400 + i),
    })),
  };
}

describe("globoWord", () => {
  it("strips the article, drops accents, upper-cases — ñ stays ñ", () => {
    expect(
      globoWord({ id: "x", spanish: "el pájaro", english: "", emoji: "🐦" }),
    ).toBe("PAJARO");
    expect(
      globoWord({ id: "x", spanish: "la araña", english: "", emoji: "🕷️" }),
    ).toBe("ARAÑA");
    expect(globoWord({ id: "x", spanish: "rojo", english: "", emoji: "🔴" })).toBe(
      "ROJO",
    );
  });

  it("rejects multi-word entries and exclamations", () => {
    expect(
      globoWord({ id: "x", spanish: "la uve doble", english: "", emoji: "W" }),
    ).toBeNull();
    expect(
      globoWord({ id: "x", spanish: "¡hola!", english: "", emoji: "👋" }),
    ).toBeNull();
  });

  it("leaves length filtering to the difficulty band", () => {
    // "no" is too short for any level but is still a well-formed word.
    expect(globoWord({ id: "x", spanish: "no", english: "", emoji: "🙂" })).toBe(
      "NO",
    );
  });
});

describe("the keyboard", () => {
  it("is the 27-letter Spanish alphabet, ñ included, no accented vowels", () => {
    expect(GLOBO_ALPHABET).toHaveLength(27);
    expect(GLOBO_ALPHABET).toContain("Ñ");
    expect(GLOBO_ALPHABET).not.toContain("Á");
    // Every letter a deaccented word can contain must be typable.
    for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      expect(GLOBO_ALPHABET).toContain(letter);
    }
  });
});

describe("globoDifficulties", () => {
  it("offers only levels the deck can fill with a full run", () => {
    const offered = globoDifficulties(globoDeck());
    expect(offered).toContain("easy");
    expect(offered).toContain("medium");
    expect(offered).toContain("hard");
  });

  it("drops a level the deck has too few words for", () => {
    const longOnly: Deck = {
      ...globoDeck(),
      cards: [
        { id: "a", spanish: "el elefante", english: "", emoji: "🐘" },
        { id: "b", spanish: "la mariposa", english: "", emoji: "🦋" },
        { id: "c", spanish: "el cocodrilo", english: "", emoji: "🐊" },
        { id: "d", spanish: "la tortuga", english: "", emoji: "🐢" },
      ],
    };
    // Four 6–10 letter words: hard fills, easy (3–5) has none.
    expect(globoDifficulties(longOnly)).toEqual(["hard"]);
  });

  it("offers nothing when no band can be filled", () => {
    const tiny: Deck = {
      ...globoDeck(),
      cards: [{ id: "a", spanish: "el sol", english: "", emoji: "☀️" }],
    };
    expect(globoDifficulties(tiny)).toEqual([]);
  });
});

describe("createGloboGame", () => {
  it("deals a full run of words inside the difficulty's length band", () => {
    for (const level of ["easy", "medium", "hard"] as GloboDifficulty[]) {
      const game = createGloboGame(globoDeck(), level, seededRandom(7));
      expect(game.rounds).toHaveLength(GLOBO_ROUNDS);
      const { min, max } = GLOBO_LEVELS[level];
      for (const round of game.rounds) {
        expect(round.word.length).toBeGreaterThanOrEqual(min);
        expect(round.word.length).toBeLessThanOrEqual(max);
      }
    }
  });

  it("never repeats a word within a run", () => {
    const game = createGloboGame(globoDeck(), "medium", seededRandom(3));
    const ids = game.rounds.map((r) => r.card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carries the level's tip kind — the picture only on easy", () => {
    expect(createGloboGame(globoDeck(), "easy", seededRandom(1)).tip).toBe(
      "picture",
    );
    expect(createGloboGame(globoDeck(), "medium", seededRandom(1)).tip).toBe(
      "meaning",
    );
    expect(createGloboGame(globoDeck(), "hard", seededRandom(1)).tip).toBe(
      "meaning",
    );
  });

  it("throws rather than dealing a short run", () => {
    const tiny: Deck = {
      ...globoDeck(),
      cards: [{ id: "a", spanish: "el sol", english: "", emoji: "☀️" }],
    };
    expect(() => createGloboGame(tiny, "easy", seededRandom(1))).toThrow(
      /needs/,
    );
  });
});

describe("guessing", () => {
  it("reveals every occurrence of a correct letter at once", () => {
    expect(revealed("PERRO", ["R"])).toEqual([null, null, "R", "R", null]);
    expect(revealed("PERRO", ["R", "O", "P"])).toEqual([
      "P",
      null,
      "R",
      "R",
      "O",
    ]);
  });

  it("counts a repeated guess once, so it can't drain the balloon twice", () => {
    // A UI that lets the same wrong letter through twice must not double-cost.
    expect(wrongGuesses("GATO", ["X", "X"])).toEqual(["X", "X"]);
    expect(livesLeft("GATO", ["X"], false)).toBe(GLOBO_LIVES - 1);
    // The set of distinct wrong letters is what the balloon tracks.
    expect(livesLeft("GATO", [...new Set(["X", "X"])], false)).toBe(
      GLOBO_LIVES - 1,
    );
  });

  it("charges nothing for a correct letter", () => {
    expect(livesLeft("GATO", ["G", "A", "T", "O"], false)).toBe(GLOBO_LIVES);
  });

  it("pops the balloon on exactly the sixth wrong letter", () => {
    const wrong = ["B", "C", "D", "F", "H"];
    expect(livesLeft("GATO", wrong, false)).toBe(1);
    expect(livesLeft("GATO", [...wrong, "J"], false)).toBe(0);
  });

  it("charges one life for the tip, on top of wrong letters", () => {
    expect(livesLeft("GATO", [], true)).toBe(GLOBO_LIVES - 1);
    expect(livesLeft("GATO", ["B", "C"], true)).toBe(GLOBO_LIVES - 3);
  });

  it("never reports negative air", () => {
    expect(livesLeft("GATO", ["B", "C", "D", "F", "H", "J", "K"], true)).toBe(0);
  });

  it("is solved once every distinct letter is guessed", () => {
    expect(isSolved("PERRO", ["P", "E", "R"])).toBe(false);
    expect(isSolved("PERRO", ["P", "E", "R", "O"])).toBe(true);
    // The double R needs one guess, not two.
    expect(lettersOf("PERRO")).toEqual(["P", "E", "R", "O"]);
  });

  it("counts ñ as its own letter", () => {
    expect(isSolved("ARAÑA", ["A", "R"])).toBe(false);
    expect(isSolved("ARAÑA", ["A", "R", "Ñ"])).toBe(true);
  });
});

describe("the real pack", () => {
  it("gives most decks at least one playable level", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const playable = decks.filter((d) => globoDifficulties(d).length > 0);
    expect(playable.length).toBeGreaterThan(decks.length / 2);
  });

  it("only ever deals words the alphabet can spell", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    for (const deck of decks) {
      for (const level of globoDifficulties(deck)) {
        const game = createGloboGame(deck, level, seededRandom(11));
        for (const round of game.rounds) {
          for (const letter of round.word) {
            expect(GLOBO_ALPHABET).toContain(letter);
          }
        }
      }
    }
  });
});
