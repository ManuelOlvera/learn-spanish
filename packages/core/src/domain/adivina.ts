import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";
import { bareWord } from "./spanish";

/**
 * Adivina la palabra — wordle. The kid **types** a guess and the board marks
 * every letter; a word the app doesn't know can't be submitted at all.
 *
 * Two different word sets, deliberately:
 *
 * - The **target** comes from the category the kid entered (Mi casa gives a
 *   casa word), which is what keeps the game inside its shelf.
 * - A **guess** may be any word in the whole pack of the right length (63/83/78
 *   at 4/5/6 letters). Narrower than that and almost every real attempt would
 *   be refused; wider needs a Spanish dictionary asset, which the app has no
 *   other reason to carry. So "a real word" here means "a word these kids have
 *   been taught" — and a refusal is honest about that: *no conozco esa palabra*.
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

/**
 * The four hints, each buyable once and each costing one of the six guesses —
 * the same trade el globo teaches with the balloon. Ordered weakest first, so
 * the tray reads as a ladder rather than four equivalent buttons.
 */
export const ADIVINA_TIPS = ["meaning", "picture", "first", "letter"] as const;

export type AdivinaTip = (typeof ADIVINA_TIPS)[number];

/** Guesses still available: tips are paid for out of the same budget. */
export function guessesLeft(
  guessCount: number,
  tipCount: number,
  budget: number = ADIVINA_GUESSES,
): number {
  return Math.max(0, budget - guessCount - tipCount);
}

/**
 * Which position the ✨ "una letra" tip should uncover: a letter not already
 * uncovered by an earlier tip. Deterministic given the random source, and
 * null once every position is showing — the UI must then stop offering it.
 */
export function revealTipIndex(
  word: string,
  alreadyShown: readonly number[],
  random: RandomSource = Math.random,
): number | null {
  const hidden = [...word]
    .map((_, index) => index)
    .filter((index) => !alreadyShown.includes(index));
  if (hidden.length === 0) {
    return null;
  }
  return shuffled(hidden, random)[0]!;
}

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
  /** Every word the kid is allowed to submit — pack-wide, target's length.
   *  Includes the target. */
  readonly dictionary: readonly string[];
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

/**
 * Every word a guess may be: the whole pack's words of that length, so the
 * kid can type any word they've been taught, not just this shelf's.
 */
export function adivinaDictionary(
  packCards: readonly VocabularyCard[],
  length: number,
): readonly string[] {
  return adivinaPool(packCards, length).map((entry) => entry.word);
}

/**
 * @param categoryCards the shelf the kid entered — where the answer comes from
 * @param packCards every card in the pack — what a guess may be
 */
export function createAdivinaGame(
  groupId: string,
  categoryCards: readonly VocabularyCard[],
  packCards: readonly VocabularyCard[],
  difficulty: AdivinaDifficulty,
  random: RandomSource = Math.random,
): AdivinaGame {
  const length = ADIVINA_LEVELS[difficulty];
  const pool = adivinaPool(categoryCards, length);
  if (pool.length < ADIVINA_MIN_POOL) {
    throw new QuizDeckTooSmallError(groupId, pool.length, ADIVINA_MIN_POOL);
  }
  return {
    groupId,
    difficulty,
    target: shuffled(pool, random)[0]!,
    dictionary: adivinaDictionary(packCards, length),
  };
}

/** Whether a typed guess may be submitted at all. */
export function isRealWord(
  guess: string,
  dictionary: readonly string[],
): boolean {
  return dictionary.includes(guess);
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

const MARK_RANK: Record<LetterMark, number> = { miss: 0, present: 1, hit: 2 };

/**
 * The best thing learned about each letter so far — what tints the keyboard.
 * Best, not latest: once a letter has been placed exactly, a later guess that
 * puts it somewhere wrong must not demote the key back to amber.
 */
export function keyboardMarks(
  guesses: readonly string[],
  target: string,
): ReadonlyMap<string, LetterMark> {
  const best = new Map<string, LetterMark>();
  for (const guess of guesses) {
    const marks = scoreGuess(guess, target);
    [...guess].forEach((letter, i) => {
      const mark = marks[i]!;
      const current = best.get(letter);
      if (current === undefined || MARK_RANK[mark] > MARK_RANK[current]) {
        best.set(letter, mark);
      }
    });
  }
  return best;
}
