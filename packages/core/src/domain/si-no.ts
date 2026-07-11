import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import type { QuizMode } from "./quiz";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/** A picture is shown and a claim is made about it ("¿Es el gato?");
 *  the kid answers sí or no. Reuses the listen/read difficulty axis. */
export interface SiNoRound {
  readonly card: VocabularyCard;
  readonly claim: VocabularyCard;
  readonly isTrue: boolean;
}

export interface SiNoGame {
  readonly deckId: string;
  readonly mode: QuizMode;
  readonly rounds: readonly SiNoRound[];
}

export const SI_NO_ROUNDS = 8;

/** The claim as a native speaker would ask it about a picture:
 *  countable nouns swap their article for the indefinite ("¿Es un gato?",
 *  "¿Son unas tijeras?"), state adjectives take estar ("¿Está triste?"),
 *  bare words stay bare ("¿Es rojo?"), and cards with an explicit
 *  `question` (mass nouns, unique entities, idioms) use it verbatim. */
export function siNoQuestion(claim: VocabularyCard): string {
  if (claim.question !== undefined) {
    return claim.question;
  }
  if (claim.usesEstar) {
    return `¿Está ${claim.spanish}?`;
  }
  const articleSwaps = [
    { prefix: "el ", verb: "Es", article: "un" },
    { prefix: "la ", verb: "Es", article: "una" },
    { prefix: "los ", verb: "Son", article: "unos" },
    { prefix: "las ", verb: "Son", article: "unas" },
  ];
  for (const { prefix, verb, article } of articleSwaps) {
    if (claim.spanish.startsWith(prefix)) {
      return `¿${verb} ${article} ${claim.spanish.slice(prefix.length)}?`;
    }
  }
  return `¿Es ${claim.spanish}?`;
}

export function createSiNoGame(
  deck: Deck,
  mode: QuizMode,
  random: RandomSource = Math.random,
): SiNoGame {
  // A false claim needs at least one other card to lie with.
  if (deck.cards.length < 2) {
    throw new QuizDeckTooSmallError(deck.id, deck.cards.length, 2);
  }

  const cards = shuffled(deck.cards, random).slice(0, SI_NO_ROUNDS);
  const rounds = cards.map((card): SiNoRound => {
    const isTrue = random() < 0.5;
    if (isTrue) {
      return { card, claim: card, isTrue };
    }
    const others = deck.cards.filter((c) => c.id !== card.id);
    const claim = others[Math.floor(random() * others.length)]!;
    return { card, claim, isTrue };
  });

  return { deckId: deck.id, mode, rounds };
}
