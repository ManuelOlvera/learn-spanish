import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import type { QuizMode } from "./quiz";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/** One connect-the-columns board: the same cards on both sides, dealt in
 *  different orders. The presentation decides what each side shows
 *  (listen: Spanish ↔ picture; read: Spanish ↔ English). */
export interface ConnectBoard {
  readonly left: readonly VocabularyCard[];
  readonly right: readonly VocabularyCard[];
}

export interface ConnectGame {
  readonly deckId: string;
  readonly mode: QuizMode;
  readonly boards: readonly ConnectBoard[];
}

/** Kid-sized: two short boards beat one long scroll. */
export const CONNECT_BOARDS = 2;
export const CONNECT_PAIRS = 5;

function dealSides(
  cards: readonly VocabularyCard[],
  random: RandomSource,
): ConnectBoard {
  const left = shuffled(cards, random);
  let right = shuffled(cards, random);
  for (
    let attempt = 0;
    attempt < 10 && right.every((c, i) => c.id === left[i]!.id);
    attempt++
  ) {
    right = shuffled(cards, random);
  }
  if (right.every((c, i) => c.id === left[i]!.id)) {
    right = [...right.slice(1), right[0]!];
  }
  return { left, right };
}

export function createConnectGame(
  deck: Deck,
  mode: QuizMode,
  random: RandomSource = Math.random,
): ConnectGame {
  if (deck.cards.length < CONNECT_PAIRS) {
    throw new QuizDeckTooSmallError(deck.id, deck.cards.length, CONNECT_PAIRS);
  }

  const boardCount = Math.min(
    CONNECT_BOARDS,
    Math.floor(deck.cards.length / CONNECT_PAIRS),
  );
  const cards = shuffled(deck.cards, random).slice(
    0,
    boardCount * CONNECT_PAIRS,
  );
  const boards = Array.from({ length: boardCount }, (_, i) =>
    dealSides(cards.slice(i * CONNECT_PAIRS, (i + 1) * CONNECT_PAIRS), random),
  );

  return { deckId: deck.id, mode, boards };
}
