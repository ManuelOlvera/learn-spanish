import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import {
  attributeClaim,
  cardAttributes,
  falseAttributeFor,
  type CardAttribute,
} from "./attribute";
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
  /**
   * Set on an **attribute round**: the property claimed about `card`, true or
   * false (roadmap 21). `claim` is then `card` itself — the picture is what
   * the kid judges the claim against, so a round may never show one thing and
   * ask about another.
   *
   * Read mode only. Roadmap 4 asks for sentences in the *older* mode, and the
   * pre-reader's identity round is deliberately untouched.
   */
  readonly attribute?: CardAttribute;
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

/** How often a read-mode round asks about a property rather than an identity,
 *  when the card can support one. Half, so a session mixes the two rather
 *  than becoming a different game. */
const ATTRIBUTE_ROUND_SHARE = 0.5;

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
    const attributeRound =
      mode === "read" &&
      cardAttributes(card).length > 0 &&
      random() < ATTRIBUTE_ROUND_SHARE;

    if (attributeRound) {
      const kinds = [...new Set(cardAttributes(card).map((a) => a.kind))];
      const kind = kinds[Math.floor(random() * kinds.length)]!;
      if (isTrue) {
        const held = cardAttributes(card).filter((a) => a.kind === kind);
        const attribute = held[Math.floor(random() * held.length)]!;
        return { card, claim: card, isTrue: true, attribute };
      }
      const lie = falseAttributeFor(card, kind, random);
      // A kind with nothing left to lie with falls through to an identity
      // round rather than dealing a claim that can only ever be true.
      if (lie !== null) {
        return { card, claim: card, isTrue: false, attribute: lie };
      }
    }

    if (isTrue) {
      return { card, claim: card, isTrue };
    }
    const others = deck.cards.filter((c) => c.id !== card.id);
    const claim = others[Math.floor(random() * others.length)]!;
    return { card, claim, isTrue };
  });

  return { deckId: deck.id, mode, rounds };
}

/**
 * The question a round asks — an attribute claim where it has one, the
 * identity claim otherwise.
 *
 * Every surface must go through this rather than `siNoQuestion(round.claim)`:
 * an attribute round's `claim` *is* its `card`, so the old call would ask
 * "¿Es una manzana?" about a round whose answer is about its colour.
 */
export function roundQuestion(round: SiNoRound): string {
  return round.attribute === undefined
    ? siNoQuestion(round.claim)
    : attributeClaim(round.card, round.attribute).question;
}
