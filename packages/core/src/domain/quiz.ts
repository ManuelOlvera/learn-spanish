import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";

/** "listen": hear the word, pick from 2 pictures (pre-readers).
 *  "read": read the word, pick from 4 pictures (early readers). */
export type QuizMode = "listen" | "read";

export interface QuizRound {
  readonly answer: VocabularyCard;
  /** Includes the answer, in presentation order. */
  readonly choices: readonly VocabularyCard[];
}

export interface Quiz {
  readonly deckId: string;
  readonly mode: QuizMode;
  readonly rounds: readonly QuizRound[];
}

/** Returns a number in [0, 1); injectable so quiz assembly is testable. */
export type RandomSource = () => number;

export const QUIZ_CHOICE_COUNT: Record<QuizMode, number> = {
  listen: 2,
  read: 4,
};

/** Kid-sized session: a quiz never asks more than this many rounds. */
export const MAX_QUIZ_ROUNDS = 8;

function shuffled<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function createQuiz(
  deck: Deck,
  mode: QuizMode,
  random: RandomSource = Math.random,
): Quiz {
  const choiceCount = QUIZ_CHOICE_COUNT[mode];
  if (deck.cards.length < choiceCount) {
    throw new QuizDeckTooSmallError(deck.id, deck.cards.length, choiceCount);
  }

  const answers = shuffled(deck.cards, random).slice(0, MAX_QUIZ_ROUNDS);
  const rounds = answers.map((answer): QuizRound => {
    const distractors = shuffled(
      deck.cards.filter((c) => c.id !== answer.id),
      random,
    ).slice(0, choiceCount - 1);
    return { answer, choices: shuffled([answer, ...distractors], random) };
  });

  return { deckId: deck.id, mode, rounds };
}
