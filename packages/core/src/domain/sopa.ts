import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/**
 * La sopa de letras: deck words hidden in a letter grid — reader-level only
 * (finding a written word IS reading). Words run in straight lines: left to
 * right, top to bottom, and both downward diagonals — never backwards, this
 * is reading practice. The kid taps the first and last letter; a straight
 * selection whose letters spell an unfound word (either tap order) finds it.
 */
export type SopaDifficulty = "easy" | "medium" | "hard";

export const SOPA_DIFFICULTIES: readonly SopaDifficulty[] = [
  "easy",
  "medium",
  "hard",
];

/** Grid side and hidden-word count per difficulty. */
export const SOPA_BOARDS: Record<
  SopaDifficulty,
  { readonly size: number; readonly words: number }
> = {
  easy: { size: 6, words: 3 },
  medium: { size: 7, words: 4 },
  hard: { size: 8, words: 5 },
};

export interface SopaWord {
  readonly card: VocabularyCard;
  /** The grid form: article stripped, accents dropped (Ñ kept), upper-case. */
  readonly answer: string;
}

export interface SopaGame {
  readonly deckId: string;
  readonly size: number;
  /** Row-major letters, size × size. */
  readonly grid: readonly string[];
  readonly words: readonly SopaWord[];
}

const MIN_LETTERS = 3;
const MAX_LETTERS = 8; // the largest grid side

/** Spanish word searches drop accents (á files under A) but Ñ is its own
 *  letter and stays. Fill letters draw from the same alphabet. */
const FILL_ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

function deaccent(word: string): string {
  return word
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ü/g, "u");
}

/** The grid form of a card, or null when it can't live in a word search
 *  (multi-word after the article strips, or too short/long). */
export function gridWord(card: VocabularyCard): string | null {
  const bare = card.spanish.replace(/^(el|la|los|las) /, "");
  if (bare.includes(" ") || bare.includes("¡")) {
    return null;
  }
  if (bare.length < MIN_LETTERS || bare.length > MAX_LETTERS) {
    return null;
  }
  return deaccent(bare).toUpperCase();
}

function candidates(deck: Deck, maxLength: number): readonly SopaWord[] {
  return deck.cards.flatMap((card) => {
    const answer = gridWord(card);
    return answer === null || answer.length > maxLength
      ? []
      : [{ card, answer }];
  });
}

/** The board sizes this deck can actually fill — the menu and the in-game
 *  picker offer only these. */
export function sopaDifficulties(deck: Deck): readonly SopaDifficulty[] {
  return SOPA_DIFFICULTIES.filter(
    (difficulty) =>
      candidates(deck, SOPA_BOARDS[difficulty].size).length >=
      SOPA_BOARDS[difficulty].words,
  );
}

/** Word directions: rightward, downward, and the two downward diagonals —
 *  every hidden word reads forward. */
const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function tryPlace(
  grid: string[],
  size: number,
  answer: string,
  random: RandomSource,
): boolean {
  for (let attempt = 0; attempt < 200; attempt++) {
    const [dr, dc] = DIRECTIONS[Math.floor(random() * DIRECTIONS.length)]!;
    const span = answer.length - 1;
    const rowMax = size - 1 - dr * span;
    const colMin = dc < 0 ? span : 0;
    const colMax = dc > 0 ? size - 1 - span : size - 1;
    if (rowMax < 0 || colMax < colMin) {
      continue;
    }
    const row = Math.floor(random() * (rowMax + 1));
    const col = colMin + Math.floor(random() * (colMax - colMin + 1));
    const cells: number[] = [];
    let fits = true;
    for (let k = 0; k < answer.length; k++) {
      const index = (row + dr * k) * size + (col + dc * k);
      const existing = grid[index]!;
      if (existing !== "" && existing !== answer[k]) {
        fits = false;
        break;
      }
      cells.push(index);
    }
    if (!fits) {
      continue;
    }
    cells.forEach((index, k) => {
      grid[index] = answer[k]!;
    });
    return true;
  }
  return false;
}

export function createSopaGame(
  deck: Deck,
  difficulty: SopaDifficulty,
  random: RandomSource = Math.random,
): SopaGame {
  const board = SOPA_BOARDS[difficulty];
  const pool = candidates(deck, board.size);
  if (pool.length < board.words) {
    throw new QuizDeckTooSmallError(deck.id, pool.length, board.words);
  }

  // Long words are the hardest to seat; place them first. A collision-heavy
  // board is simply retried — with ≤5 short words on a 6–8 grid a handful of
  // attempts always lands.
  for (let boardAttempt = 0; boardAttempt < 25; boardAttempt++) {
    const words = shuffled(pool, random)
      .slice(0, board.words)
      .sort((a, b) => b.answer.length - a.answer.length);
    const grid: string[] = Array.from({ length: board.size * board.size }, () => "");
    if (words.every((word) => tryPlace(grid, board.size, word.answer, random))) {
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] === "") {
          grid[i] = FILL_ALPHABET[Math.floor(random() * FILL_ALPHABET.length)]!;
        }
      }
      return { deckId: deck.id, size: board.size, grid, words };
    }
  }
  // Practically unreachable; a typed error beats a corrupt board.
  throw new QuizDeckTooSmallError(deck.id, pool.length, board.words);
}

/** The inclusive cells from `from` to `to` when they sit on one straight
 *  line (row, column, or diagonal); null for bent selections or a single
 *  cell. Indices are row-major on a `size`-wide grid. */
export function lineBetween(
  size: number,
  from: number,
  to: number,
): readonly number[] | null {
  const dr = Math.floor(to / size) - Math.floor(from / size);
  const dc = (to % size) - (from % size);
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  if (steps === 0) {
    return null;
  }
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
    return null;
  }
  const stepRow = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepCol = dc === 0 ? 0 : dc / Math.abs(dc);
  const cells: number[] = [];
  for (let k = 0; k <= steps; k++) {
    cells.push(
      (Math.floor(from / size) + stepRow * k) * size +
        ((from % size) + stepCol * k),
    );
  }
  return cells;
}

/** The unfound word a selected line spells — in either tap order (a kid may
 *  anchor on the word's last letter); null when it spells nothing new. */
export function findSopaWord(
  game: SopaGame,
  cells: readonly number[],
  foundCardIds: readonly string[],
): SopaWord | null {
  const letters = cells.map((index) => game.grid[index]).join("");
  const reversed = [...letters].reverse().join("");
  return (
    game.words.find(
      (word) =>
        !foundCardIds.includes(word.card.id) &&
        (word.answer === letters || word.answer === reversed),
    ) ?? null
  );
}
