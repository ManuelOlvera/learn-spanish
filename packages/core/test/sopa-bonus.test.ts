import { describe, expect, it } from "vitest";
import {
  createSopaGame,
  findSopaWord,
  isBonusWord,
  lineBetween,
  SOPA_BOARDS,
} from "../src/domain/sopa";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import type { SopaGame, SopaWord } from "../src/domain/sopa";

const repo = new StaticDeckRepository();

/** Every straight line on the board, as the player's taps would produce. */
function everyLine(game: SopaGame): readonly (readonly number[])[] {
  const lines: (readonly number[])[] = [];
  for (let from = 0; from < game.grid.length; from += 1) {
    for (let to = 0; to < game.grid.length; to += 1) {
      const cells = lineBetween(game.size, from, to);
      if (cells !== null) lines.push(cells);
    }
  }
  return lines;
}

function findAll(game: SopaGame): readonly SopaWord[] {
  const found: SopaWord[] = [];
  for (const cells of everyLine(game)) {
    const word = findSopaWord(game, cells, found.map((w) => w.card.id));
    if (word !== null) found.push(word);
  }
  return found;
}

const seeded = (n: number) => {
  let x = n;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
};

describe("la sopa hides more than it asks for", () => {
  it("seats bonus words beyond the target list", async () => {
    const deck = (await repo.listDecks()).find((d) => d.id === "animals")!;
    let withBonus = 0;
    for (let s = 0; s < 20; s += 1) {
      const game = createSopaGame(deck, "hard", seeded(s));
      if (game.bonus.length > 0) withBonus += 1;
    }
    // Best-effort by design — a crowded board may fit none — but on a deck
    // this size most boards should hide something.
    expect(withBonus).toBeGreaterThan(10);
  });

  it("asks for exactly the difficulty's word count, bonuses aside", async () => {
    const deck = (await repo.listDecks()).find((d) => d.id === "animals")!;
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const game = createSopaGame(deck, difficulty, seeded(7));
      expect(game.words).toHaveLength(SOPA_BOARDS[difficulty].words);
    }
  });

  it("never lists a bonus word among the targets", async () => {
    const deck = (await repo.listDecks()).find((d) => d.id === "animals")!;
    for (let s = 0; s < 20; s += 1) {
      const game = createSopaGame(deck, "hard", seeded(s));
      const targets = game.words.map((w) => w.card.id);
      for (const extra of game.bonus) {
        expect(targets).not.toContain(extra.card.id);
      }
    }
  });

  it("keeps every hidden word findable and unambiguous", async () => {
    // The invariant the whole board rests on: a selection must credit exactly
    // one card. Bonuses share the grid with the targets, so they have to obey
    // the same no-collision rule — ARAÑA inside TELARAÑA would hand a kid two
    // words for one selection.
    const deck = (await repo.listDecks()).find((d) => d.id === "animals")!;
    for (let s = 0; s < 20; s += 1) {
      const game = createSopaGame(deck, "hard", seeded(s));
      const all = [...game.words, ...game.bonus].map((w) => w.answer);
      expect(new Set(all).size).toBe(all.length);
      for (const a of all) {
        for (const b of all) {
          if (a === b) continue;
          expect(a.includes(b)).toBe(false);
          expect(a.includes([...b].reverse().join(""))).toBe(false);
        }
      }
    }
  });

  it("actually places every bonus it claims", async () => {
    // A bonus the grid does not contain is a promise the board cannot keep.
    const deck = (await repo.listDecks()).find((d) => d.id === "animals")!;
    for (let s = 0; s < 12; s += 1) {
      const game = createSopaGame(deck, "hard", seeded(s));
      const found = findAll(game).map((w) => w.card.id);
      for (const extra of game.bonus) {
        expect(found).toContain(extra.card.id);
      }
    }
  });

  it("credits a bonus word when a kid selects it", async () => {
    const deck = (await repo.listDecks()).find((d) => d.id === "animals")!;
    for (let s = 0; s < 12; s += 1) {
      const game = createSopaGame(deck, "hard", seeded(s));
      if (game.bonus.length === 0) continue;
      const found = findAll(game);
      expect(found.map((w) => w.card.id)).toContain(game.bonus[0]!.card.id);
      return;
    }
  });

  it("knows which found word was a bonus", async () => {
    const deck = (await repo.listDecks()).find((d) => d.id === "animals")!;
    for (let s = 0; s < 12; s += 1) {
      const game = createSopaGame(deck, "hard", seeded(s));
      if (game.bonus.length === 0) continue;
      expect(isBonusWord(game, game.bonus[0]!.card.id)).toBe(true);
      expect(isBonusWord(game, game.words[0]!.card.id)).toBe(false);
      return;
    }
  });

  it("leaves a deck that can barely fill its targets with no bonuses", async () => {
    // Nothing is forced: a board with no room simply hides nothing extra, and
    // the game is exactly what it was.
    const tiny = {
      id: "t", nameSpanish: "t", nameEnglish: "t", emoji: "🧪",
      cards: [
        { id: "sol", spanish: "el sol", english: "sun", emoji: "☀️" },
        { id: "pan", spanish: "el pan", english: "bread", emoji: "🍞" },
        { id: "rey", spanish: "el rey", english: "king", emoji: "👑" },
      ],
    };
    const game = createSopaGame(tiny, "easy", seeded(3));
    expect(game.words).toHaveLength(3);
    expect(game.bonus).toEqual([]);
  });
});
