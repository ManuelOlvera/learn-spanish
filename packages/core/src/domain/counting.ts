import type { VocabularyCard } from "./card";
import type { QuizMode } from "./quiz";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/** ¿Cuántos hay?: n copies of a picture appear; the kid counts and taps
 *  the right number (keycap 👂 / written word 🔤 via presentation). */
export interface CountingRound {
  /** How many items are shown (1..numberCards.length). */
  readonly count: number;
  /** The pictured thing, repeated `count` times. */
  readonly item: VocabularyCard;
  /** Number cards to pick from; the (count)th number card is correct. */
  readonly choices: readonly VocabularyCard[];
}

export interface CountingGame {
  readonly mode: QuizMode;
  readonly rounds: readonly CountingRound[];
}

export const COUNTING_ROUNDS = 8;
const CHOICES: Record<QuizMode, number> = { listen: 2, read: 4 };

export function createCountingGame(
  itemPool: readonly VocabularyCard[],
  numberCards: readonly VocabularyCard[],
  mode: QuizMode,
  random: RandomSource = Math.random,
): CountingGame {
  const choiceCount = CHOICES[mode];
  if (numberCards.length < Math.max(choiceCount, 4) || itemPool.length === 0) {
    throw new QuizDeckTooSmallError("counting", numberCards.length, 4);
  }

  const items = shuffled(itemPool, random).slice(0, COUNTING_ROUNDS);
  const rounds = items.map((item): CountingRound => {
    const count = 1 + Math.floor(random() * numberCards.length);
    const answer = numberCards[count - 1]!;
    const distractors = shuffled(
      numberCards.filter((c) => c.id !== answer.id),
      random,
    ).slice(0, choiceCount - 1);
    return { count, item, choices: shuffled([answer, ...distractors], random) };
  });

  return { mode, rounds };
}
