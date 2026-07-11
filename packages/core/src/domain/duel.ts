import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/** Pass-the-tablet duel: both kids answer the same targets, each at their
 *  own difficulty (listener: 2 choices by ear; reader: 4 by written word). */
export interface DuelRound {
  readonly target: VocabularyCard;
  readonly listenChoices: readonly VocabularyCard[];
  readonly readChoices: readonly VocabularyCard[];
}

export interface DuelGame {
  readonly deckId: string;
  readonly rounds: readonly DuelRound[];
}

export const DUEL_ROUNDS = 6;
const LISTEN_CHOICES = 2;
const READ_CHOICES = 4;

export function createDuel(
  deck: Deck,
  random: RandomSource = Math.random,
): DuelGame {
  if (deck.cards.length < READ_CHOICES) {
    throw new QuizDeckTooSmallError(deck.id, deck.cards.length, READ_CHOICES);
  }

  const targets = shuffled(deck.cards, random).slice(0, DUEL_ROUNDS);
  const rounds = targets.map((target): DuelRound => {
    const others = shuffled(
      deck.cards.filter((c) => c.id !== target.id),
      random,
    );
    return {
      target,
      listenChoices: shuffled(
        [target, ...others.slice(0, LISTEN_CHOICES - 1)],
        random,
      ),
      readChoices: shuffled(
        [target, ...others.slice(0, READ_CHOICES - 1)],
        random,
      ),
    };
  });

  return { deckId: deck.id, rounds };
}
