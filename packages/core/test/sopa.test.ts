import { describe, expect, it } from "vitest";
import {
  createSopaGame,
  findSopaWord,
  gridWord,
  lineBetween,
  SOPA_BOARDS,
  sopaDifficulties,
} from "../src/domain/sopa";
import type { SopaGame } from "../src/domain/sopa";
import type { Deck } from "../src/domain/deck";
import { seededRandom } from "./helpers";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";

/** The shared deckOf() helper uses multi-word spanish ("palabra 0"), which a
 *  word search rightly rejects — sopa tests need real single words. */
function sopaDeck(): Deck {
  const words = [
    "gato", "perro", "vaca", "pez", "rana", "leon",
    "oso", "lobo", "pato", "mono", "cabra", "burro",
  ];
  return {
    id: "sopa-test",
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

describe("gridWord", () => {
  it("strips the article, drops accents, upper-cases — ñ stays ñ", () => {
    expect(gridWord({ id: "x", spanish: "el pájaro", english: "", emoji: "🐦" })).toBe("PAJARO");
    expect(gridWord({ id: "x", spanish: "la araña", english: "", emoji: "🕷️" })).toBe("ARAÑA");
    expect(gridWord({ id: "x", spanish: "rojo", english: "", emoji: "🔴" })).toBe("ROJO");
  });

  it("rejects multi-word and out-of-range entries", () => {
    expect(gridWord({ id: "x", spanish: "la uve doble", english: "", emoji: "W" })).toBeNull();
    expect(gridWord({ id: "x", spanish: "no", english: "", emoji: "🙂" })).toBeNull();
    expect(gridWord({ id: "x", spanish: "el rinoceronte", english: "", emoji: "🦏" })).toBeNull(); // > 8
  });
});

describe("lineBetween", () => {
  // On a 6-wide grid: index = row * 6 + col.
  it("returns the inclusive cells of straight lines", () => {
    expect(lineBetween(6, 0, 3)).toEqual([0, 1, 2, 3]); // row
    expect(lineBetween(6, 2, 26)).toEqual([2, 8, 14, 20, 26]); // column
    expect(lineBetween(6, 0, 21)).toEqual([0, 7, 14, 21]); // diagonal ↘
    expect(lineBetween(6, 5, 25)).toEqual([5, 10, 15, 20, 25]); // diagonal ↙
  });

  it("rejects bent selections and single cells", () => {
    expect(lineBetween(6, 0, 8)).toBeNull(); // knight-ish
    expect(lineBetween(6, 0, 0)).toBeNull();
  });
});

describe("createSopaGame", () => {
  function cellsFor(game: SopaGame, answer: string): boolean {
    // The answer must be readable along some straight line in the grid.
    const size = game.size;
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        for (const [dr, dc] of dirs) {
          let word = "";
          for (let k = 0; k < answer.length; k++) {
            const r = row + dr! * k;
            const c = col + dc! * k;
            if (r < 0 || r >= size || c < 0 || c >= size) break;
            word += game.grid[r * size + c];
          }
          if (word === answer) return true;
        }
      }
    }
    return false;
  }

  it("hides every target word along a straight line and fills the rest", () => {
    const deck = sopaDeck();
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const game = createSopaGame(deck, difficulty, seededRandom(7));
      const board = SOPA_BOARDS[difficulty];
      expect(game.size).toBe(board.size);
      expect(game.grid).toHaveLength(board.size * board.size);
      expect(game.words).toHaveLength(board.words);
      for (const word of game.words) {
        expect(cellsFor(game, word.answer), word.answer).toBe(true);
      }
      // Fill letters come from the Spanish alphabet, no gaps.
      expect(game.grid.every((l) => /^[A-ZÑ]$/.test(l))).toBe(true);
    }
  });

  it("is deterministic for a seeded random source", () => {
    const deck = sopaDeck();
    const a = createSopaGame(deck, "medium", seededRandom(3));
    const b = createSopaGame(deck, "medium", seededRandom(3));
    expect(a.grid).toEqual(b.grid);
    expect(a.words.map((w) => w.card.id)).toEqual(b.words.map((w) => w.card.id));
  });
});

describe("findSopaWord", () => {
  it("matches a selected line to an unfound word, either direction", () => {
    const deck = sopaDeck();
    const game = createSopaGame(deck, "easy", seededRandom(5));
    const target = game.words[0]!;
    // Locate the word's actual cells by scanning, then select them.
    const size = game.size;
    outer: for (let start = 0; start < size * size; start++) {
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
        const row = Math.floor(start / size);
        const col = start % size;
        const endRow = row + dr * (target.answer.length - 1);
        const endCol = col + dc * (target.answer.length - 1);
        if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;
        const end = endRow * size + endCol;
        const line = lineBetween(size, start, end);
        if (line === null) continue;
        const word = line.map((i) => game.grid[i]).join("");
        if (word === target.answer) {
          expect(findSopaWord(game, line, [])?.card.id).toBe(target.card.id);
          // Backwards selection (kid taps the other end first) also counts.
          expect(findSopaWord(game, [...line].reverse(), [])?.card.id).toBe(
            target.card.id,
          );
          // Already-found words don't match twice.
          expect(findSopaWord(game, line, [target.card.id])).toBeNull();
          break outer;
        }
      }
    }
  });

  it("reuses a shared letter: crossing words each find independently", () => {
    // SOL across row 0, SAL down column 0 — both anchored on the shared S at
    // cell 0. Finding one must never lock that cell out of the other (the UI
    // bug: a found cell became untappable, so the second word was unreachable).
    const card = (id: string) => ({ id, spanish: `el ${id}`, english: id, emoji: "🔤" });
    const game: SopaGame = {
      deckId: "cross",
      size: 3,
      grid: ["S", "O", "L", "A", "X", "Y", "L", "Z", "W"],
      words: [
        { card: card("sol"), answer: "SOL" },
        { card: card("sal"), answer: "SAL" },
      ],
    };
    const sol = lineBetween(3, 0, 2)!; // row: S O L
    const sal = lineBetween(3, 0, 6)!; // column: S A L, shares cell 0
    expect(findSopaWord(game, sol, [])?.card.id).toBe("sol");
    // With SOL found, the shared S at cell 0 still completes SAL.
    expect(findSopaWord(game, sal, ["sol"])?.card.id).toBe("sal");
  });
});

describe("sopaDifficulties", () => {
  it("offers only the sizes a deck can actually fill", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const animals = decks.find((d) => d.id === "animals")!;
    expect(sopaDifficulties(animals)).toEqual(["easy", "medium", "hard"]);
    // Centenas words are mostly too long for any grid.
    const centenas = decks.find((d) => d.id === "centenas")!;
    expect(sopaDifficulties(centenas)).toEqual([]);
  });
});
