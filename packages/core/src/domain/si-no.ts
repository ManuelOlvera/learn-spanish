import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import {
  attributeClaim,
  cardAttributes,
  falseAttributeFor,
  type CardAttribute,
} from "./attribute";
import type { QuizMode } from "./quiz";
import { DIFFICULTIES, type Difficulty } from "./difficulty";
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

/**
 * Rounds per board size (roadmap 12). ¿Sí o no? has no board to grow, so its
 * difficulty is **length** — how many claims a kid sits through.
 *
 * A round asks about a distinct card, so a level is only offered on a deck
 * with enough cards to fill it (`siNoDifficulties`). The pack holds decks at
 * 10-17 cards, so easy and medium are always available and hard is not.
 */
export const SI_NO_ROUND_COUNT: Record<Difficulty, number> = {
  easy: 4,
  medium: SI_NO_ROUNDS,
  hard: 12,
};

/** The levels this deck can actually fill — the same "offer what fits" rule
 *  la sopa and el globo already use, rather than silently dealing a short
 *  game that calls itself hard. */
export function siNoDifficulties(deck: Deck): readonly Difficulty[] {
  return DIFFICULTIES.filter((d) => deck.cards.length >= SI_NO_ROUND_COUNT[d]);
}

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
  /** Absent means the length this game has always had. */
  difficulty?: Difficulty,
): SiNoGame {
  // A false claim needs at least one other card to lie with.
  if (deck.cards.length < 2) {
    throw new QuizDeckTooSmallError(deck.id, deck.cards.length, 2);
  }

  const wanted =
    difficulty === undefined ? SI_NO_ROUNDS : SI_NO_ROUND_COUNT[difficulty];
  const cards = shuffled(deck.cards, random).slice(0, wanted);
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
