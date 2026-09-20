import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import {
  cardAttributes,
  hasAttributeValue,
  type CardAttribute,
} from "./attribute";
import { agree, cardAgreement } from "./spanish";
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
  /**
   * Set on an **attribute round**: the prompt asks for a property ("toca el
   * que es verde") rather than a word (roadmap 21).
   *
   * Dealt only when **exactly one** choice holds the value — the answer. Two
   * green pictures would mark a kid wrong for tapping the other green one,
   * so a board that cannot be built unambiguously falls back to an ordinary
   * identity round instead.
   */
  readonly attribute?: CardAttribute;
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

/** One standalone round — El reto generates these until the clock runs out. */
export function createQuizRound(
  deck: Deck,
  mode: QuizMode,
  random: RandomSource = Math.random,
): QuizRound {
  const choiceCount = QUIZ_CHOICE_COUNT[mode];
  if (deck.cards.length < choiceCount) {
    throw new QuizDeckTooSmallError(deck.id, deck.cards.length, choiceCount);
  }
  const answer = deck.cards[Math.floor(random() * deck.cards.length)]!;
  const distractors = shuffled(
    deck.cards.filter((c) => c.id !== answer.id),
    random,
  ).slice(0, choiceCount - 1);
  return { answer, choices: shuffled([answer, ...distractors], random) };
}

/** How often a read-mode round asks for a property instead of a word, when
 *  the board can be built unambiguously. */
const ATTRIBUTE_ROUND_SHARE = 0.5;

/**
 * Try to build an attribute round for this answer: pick one of its
 * attributes, then fill the board from cards that **do not** hold that value.
 * Null when the deck cannot supply enough non-matching distractors, which is
 * the fallback that keeps the question answerable.
 */
function attributeRound(
  answer: VocabularyCard,
  deck: Deck,
  choiceCount: number,
  random: RandomSource,
): QuizRound | null {
  const attributes = cardAttributes(answer);
  if (attributes.length === 0) {
    return null;
  }
  const attribute = attributes[Math.floor(random() * attributes.length)]!;
  const eligible = deck.cards.filter(
    (c) => c.id !== answer.id && !hasAttributeValue(c, attribute.value),
  );
  if (eligible.length < choiceCount - 1) {
    return null;
  }
  const distractors = shuffled(eligible, random).slice(0, choiceCount - 1);
  return {
    answer,
    choices: shuffled([answer, ...distractors], random),
    attribute,
  };
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
    if (mode === "read" && random() < ATTRIBUTE_ROUND_SHARE) {
      const round = attributeRound(answer, deck, choiceCount, random);
      if (round !== null) {
        return round;
      }
    }
    const distractors = shuffled(
      deck.cards.filter((c) => c.id !== answer.id),
      random,
    ).slice(0, choiceCount - 1);
    return { answer, choices: shuffled([answer, ...distractors], random) };
  });

  return { deckId: deck.id, mode, rounds };
}

/**
 * What the round asks for, as the reader sees it: the word on an ordinary
 * round, the property on an attribute round.
 *
 * "Toca la que es verde" — the article agrees with the *answer*, which is the
 * one place this leaks a hint. It is the natural phrasing and the hint is
 * small (gender rules out roughly half a board at most, and the pictures are
 * what decide it), where "toca el/la que es verde" would be clumsy Spanish
 * read aloud to a child.
 */
export function quizPrompt(round: QuizRound): string {
  if (round.attribute === undefined) {
    return round.answer.spanish;
  }
  const agreement = cardAgreement(round.answer);
  const article = { m: "el", f: "la" }[agreement.gender];
  const plural = agreement.number === "plural";
  return `Toca ${plural ? `${article}s` : article} que ${
    plural ? "son" : "es"
  } ${agree(round.attribute.value, agreement)}`;
}
