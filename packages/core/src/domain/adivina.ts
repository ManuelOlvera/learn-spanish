import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";
import { bareWord } from "./spanish";

/**
 * Adivina la palabra — the wordle mechanic, played over a whole **category**
 * rather than one deck.
 *
 * Why the category: the kid taps guesses from a word list instead of typing
 * them, because an eight-year-old with basic Spanish cannot invent probe
 * words — and that only works if the list is big enough to deduce from. At
 * deck scope it isn't: only 10 of 41 decks have five same-length words. A
 * shelf ("Mi casa" = familia + food + house + clothes + fruit) has 10–13.
 */
export type AdivinaDifficulty = "easy" | "medium" | "hard";

export const ADIVINA_DIFFICULTIES: readonly AdivinaDifficulty[] = [
  "easy",
  "medium",
  "hard",
];

/** Difficulty is the word length — nothing else changes. */
export const ADIVINA_LEVELS: Record<AdivinaDifficulty, number> = {
  easy: 4,
  medium: 5,
  hard: 6,
};

export const ADIVINA_GUESSES = 6;

/** Below this the guess list is so small the answer is luck, not deduction. */
export const ADIVINA_MIN_POOL = 6;

/** How one letter of a guess came out. */
export type LetterMark = "hit" | "present" | "miss";

export interface AdivinaWord {
  readonly card: VocabularyCard;
  readonly word: string;
}

export interface AdivinaGame {
  readonly groupId: string;
  readonly difficulty: AdivinaDifficulty;
  readonly target: AdivinaWord;
  /** Every word that can be tapped as a guess — the target is one of them. */
  readonly pool: readonly AdivinaWord[];
}

/**
 * The category's words of exactly `length`, deaccented and de-duplicated —
 * "naranja" is both a fruit and a colour, and the same word must not appear
 * twice in one guess list.
 */
export function adivinaPool(
  cards: readonly VocabularyCard[],
  length: number,
): readonly AdivinaWord[] {
  const seen = new Set<string>();
  const pool: AdivinaWord[] = [];
  for (const card of cards) {
    const word = bareWord(card.spanish);
    if (word === null || word.length !== length || seen.has(word)) {
      continue;
    }
    seen.add(word);
    pool.push({ card, word });
  }
  return pool;
}

/** The levels this category has a deducible pool for. */
export function adivinaDifficulties(
  cards: readonly VocabularyCard[],
): readonly AdivinaDifficulty[] {
  return ADIVINA_DIFFICULTIES.filter(
    (difficulty) =>
      adivinaPool(cards, ADIVINA_LEVELS[difficulty]).length >= ADIVINA_MIN_POOL,
  );
}

export function createAdivinaGame(
  groupId: string,
  cards: readonly VocabularyCard[],
  difficulty: AdivinaDifficulty,
  random: RandomSource = Math.random,
): AdivinaGame {
  const pool = adivinaPool(cards, ADIVINA_LEVELS[difficulty]);
  if (pool.length < ADIVINA_MIN_POOL) {
    throw new QuizDeckTooSmallError(groupId, pool.length, ADIVINA_MIN_POOL);
  }
  return {
    groupId,
    difficulty,
    target: shuffled(pool, random)[0]!,
    pool,
  };
}

/**
 * Wordle scoring, two passes. The second pass is the whole subtlety: a letter
 * may only be marked `present` as many times as the target still has spare
 * copies of it, and exact positions claim theirs first. Without that, guessing
 * OSO against OSA lights both O's and lies to the kid.
 */
export function scoreGuess(guess: string, target: string): readonly LetterMark[] {
  if (guess.length !== target.length) {
    throw new Error(
      `Guess "${guess}" is ${guess.length} letters but the word is ${target.length}`,
    );
  }
  const marks: LetterMark[] = Array.from({ length: guess.length }, () => "miss");
  const spare = new Map<string, number>();

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      marks[i] = "hit";
    } else {
      const letter = target[i]!;
      spare.set(letter, (spare.get(letter) ?? 0) + 1);
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === "hit") {
      continue;
    }
    const letter = guess[i]!;
    const left = spare.get(letter) ?? 0;
    if (left > 0) {
      marks[i] = "present";
      spare.set(letter, left - 1);
    }
  }

  return marks;
}

export function isWon(marks: readonly LetterMark[]): boolean {
  return marks.every((mark) => mark === "hit");
}
