import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";
import type { WordStats } from "./word-stats";

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

export const QUIZ_CHOICE_COUNT: Record<QuizMode, number> = {
  listen: 2,
  read: 4,
};

/** Kid-sized session: a quiz never asks more than this many rounds. */
export const MAX_QUIZ_ROUNDS = 8;

/** Without stats: a fair shuffle. With stats: missed words are drawn with
 *  extra weight, so quizzes quietly re-ask what the kid finds hard. */
function pickAnswers(
  cards: readonly VocabularyCard[],
  random: RandomSource,
  stats?: WordStats,
): readonly VocabularyCard[] {
  if (stats === undefined) {
    return shuffled(cards, random).slice(0, MAX_QUIZ_ROUNDS);
  }
  const pool = [...cards];
  const picked: VocabularyCard[] = [];
  while (picked.length < MAX_QUIZ_ROUNDS && pool.length > 0) {
    const weights = pool.map(
      (c) => 1 + Math.min((stats[c.id]?.wrong ?? 0) * 2, 6),
    );
    let roll = random() * weights.reduce((a, b) => a + b, 0);
    let index = 0;
    while (roll > weights[index]! && index < pool.length - 1) {
      roll -= weights[index]!;
      index++;
    }
    picked.push(pool.splice(index, 1)[0]!);
  }
  return picked;
}

export function createQuiz(
  deck: Deck,
  mode: QuizMode,
  random: RandomSource = Math.random,
  stats?: WordStats,
): Quiz {
  const choiceCount = QUIZ_CHOICE_COUNT[mode];
  if (deck.cards.length < choiceCount) {
    throw new QuizDeckTooSmallError(deck.id, deck.cards.length, choiceCount);
  }

  const answers = pickAnswers(deck.cards, random, stats);
  const rounds = answers.map((answer): QuizRound => {
    const distractors = shuffled(
      deck.cards.filter((c) => c.id !== answer.id),
      random,
    ).slice(0, choiceCount - 1);
    return { answer, choices: shuffled([answer, ...distractors], random) };
  });

  return { deckId: deck.id, mode, rounds };
}
