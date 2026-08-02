import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";
import { bareWord, SPANISH_ALPHABET } from "./spanish";

/**
 * El globo (the ahorcado mechanic, drawn as a deflating balloon — a hanged
 * man has no place in a sticker book for small children). The word is blanks;
 * the kid taps letters and every wrong guess lets out one breath of air.
 *
 * Reader-level only, like Deletrea and la sopa. The card's picture is NOT
 * shown — it would hand over the answer — it is a paid tip instead.
 */
export type GloboDifficulty = "easy" | "medium" | "hard";

export const GLOBO_DIFFICULTIES: readonly GloboDifficulty[] = [
  "easy",
  "medium",
  "hard",
];

/** Wrong guesses the balloon survives. Constant across difficulties: the
 *  balloon always has six breaths, and difficulty scales the word instead. */
export const GLOBO_LIVES = 6;

/** Words per run. */
export const GLOBO_ROUNDS = 4;

/**
 * What the 💡 tip gives away, per difficulty. The picture is the strong
 * clue, so it is the easy level's tip only; harder levels get the English
 * meaning, which still leaves the Spanish word to be found.
 */
export type GloboTip = "picture" | "meaning";

/** Word length band and tip kind per difficulty. */
export const GLOBO_LEVELS: Record<
  GloboDifficulty,
  { readonly min: number; readonly max: number; readonly tip: GloboTip }
> = {
  easy: { min: 3, max: 5, tip: "picture" },
  medium: { min: 4, max: 7, tip: "meaning" },
  hard: { min: 6, max: 10, tip: "meaning" },
};

/** The full guessing keyboard: the 27 letters of the Spanish alphabet.
 *  Accented vowels are absent by design — words are deaccented, so Á is
 *  guessed as A and the keyboard stays thumb-sized. */
export const GLOBO_ALPHABET: readonly string[] = [...SPANISH_ALPHABET];

export interface GloboRound {
  readonly card: VocabularyCard;
  /** The word to guess: article stripped, deaccented, uppercased. */
  readonly word: string;
}

export interface GloboGame {
  readonly deckId: string;
  readonly difficulty: GloboDifficulty;
  readonly rounds: readonly GloboRound[];
  /** What a tip reveals in this game — fixed by difficulty. */
  readonly tip: GloboTip;
}

/**
 * The guessable form of a card, or null when it isn't guessable at all
 * (multi-word after stripping the article, or an exclamation). Length is
 * filtered per difficulty band, not here.
 */
export function globoWord(card: VocabularyCard): string | null {
  return bareWord(card.spanish);
}

function candidates(
  deck: Deck,
  difficulty: GloboDifficulty,
): readonly GloboRound[] {
  const { min, max } = GLOBO_LEVELS[difficulty];
  return deck.cards.flatMap((card) => {
    const word = globoWord(card);
    return word === null || word.length < min || word.length > max
      ? []
      : [{ card, word }];
  });
}

/** The levels this deck has enough words for — the menu and the in-game
 *  picker offer only these. */
export function globoDifficulties(deck: Deck): readonly GloboDifficulty[] {
  return GLOBO_DIFFICULTIES.filter(
    (difficulty) => candidates(deck, difficulty).length >= GLOBO_ROUNDS,
  );
}

export function createGloboGame(
  deck: Deck,
  difficulty: GloboDifficulty,
  random: RandomSource = Math.random,
): GloboGame {
  const pool = candidates(deck, difficulty);
  if (pool.length < GLOBO_ROUNDS) {
    throw new QuizDeckTooSmallError(deck.id, pool.length, GLOBO_ROUNDS);
  }
  return {
    deckId: deck.id,
    difficulty,
    rounds: shuffled(pool, random).slice(0, GLOBO_ROUNDS),
    tip: GLOBO_LEVELS[difficulty].tip,
  };
}

/** Every distinct letter the word is made of — what a win requires. */
export function lettersOf(word: string): readonly string[] {
  return [...new Set([...word])];
}

/** Wrong guesses so far: the guessed letters the word doesn't contain. */
export function wrongGuesses(
  word: string,
  guessed: readonly string[],
): readonly string[] {
  return guessed.filter((letter) => !word.includes(letter));
}

/** Air left in the balloon. A taken tip costs one, on top of wrong letters. */
export function livesLeft(
  word: string,
  guessed: readonly string[],
  tipTaken: boolean,
): number {
  const spent = wrongGuesses(word, guessed).length + (tipTaken ? 1 : 0);
  return Math.max(0, GLOBO_LIVES - spent);
}

export function isSolved(word: string, guessed: readonly string[]): boolean {
  return lettersOf(word).every((letter) => guessed.includes(letter));
}

/** The word as shown: guessed letters revealed, the rest still blank. */
export function revealed(
  word: string,
  guessed: readonly string[],
): readonly (string | null)[] {
  return [...word].map((letter) => (guessed.includes(letter) ? letter : null));
}
