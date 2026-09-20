import type { VocabularyCard } from "./card";
import type { Deck } from "./deck";
import { agree, cardAgreement } from "./spanish";
import type { RandomSource } from "./random";

/**
 * What a picture can be asked *about* — the content that turns every game
 * from "which word is this?" into "what is this thing like?" (roadmap 21).
 *
 * Two rules decide everything here:
 *
 * **An attribute must be provable from the card's own picture.** A pre-reader
 * answers by looking, so an attribute they cannot check is an unanswerable
 * question. That is why the kinds are these two and why most of the pack
 * carries none: los meses, las letras and los verbos have no property a
 * picture shows.
 *
 * **An attribute is typed, not free text.** A false claim is built by swapping
 * within a kind, and only a kind makes that safe: swap a colour for a size and
 * "el plátano es grande" is arguably true, which would mark a kid wrong for
 * being right.
 */
export type AttributeKind = "color" | "size";

export interface CardAttribute {
  readonly kind: AttributeKind;
  /** The **masculine singular** form. Agreement with the card's own word is
   *  derived at claim time, never stored — one fact, one place. */
  readonly value: string;
}

/**
 * The closed vocabularies. Colours are exactly the shipped Los colores deck
 * plus `gris`, so a claim never uses a word the kids have not met; sizes are
 * a pair, which is what makes a false size claim simply the opposite.
 */
export const ATTRIBUTE_VALUES: Readonly<Record<AttributeKind, readonly string[]>> = {
  color: [
    "rojo",
    "naranja",
    "amarillo",
    "verde",
    "azul",
    "morado",
    "rosa",
    "marrón",
    "negro",
    "blanco",
    "gris",
  ],
  size: ["grande", "pequeño"],
};

/** A claim about a card, true or false, ready to be spoken or read. */
export interface AttributeClaim {
  readonly card: VocabularyCard;
  readonly attribute: CardAttribute;
  readonly isTrue: boolean;
  /** "la manzana es roja" — the statement form, for a daily card. */
  readonly text: string;
  /** "¿La manzana es roja?" — the asked form, for sí o no. */
  readonly question: string;
}

export function cardAttributes(card: VocabularyCard): readonly CardAttribute[] {
  return card.attributes ?? [];
}

export function hasAttributeValue(card: VocabularyCard, value: string): boolean {
  return cardAttributes(card).some((a) => a.value === value);
}

/** The claim as a sentence, with **both** the verb and the adjective agreed
 *  to the card's word — "las palomitas son blancas", never "es blanca". */
export function attributeText(
  card: VocabularyCard,
  attribute: CardAttribute,
): string {
  const agreement = cardAgreement(card);
  const verb = agreement.number === "plural" ? "son" : "es";
  return `${card.spanish} ${verb} ${agree(attribute.value, agreement)}`;
}

export function attributeClaim(
  card: VocabularyCard,
  attribute: CardAttribute,
): AttributeClaim {
  const text = attributeText(card, attribute);
  return {
    card,
    attribute,
    isTrue: hasAttributeValue(card, attribute.value),
    text,
    question: `¿${text.charAt(0).toUpperCase()}${text.slice(1)}?`,
  };
}

/**
 * An attribute of `kind` that is **false** of this card — the lie a sí-o-no
 * round needs.
 *
 * Every value the card actually holds is excluded, not just the one being
 * replaced: a card with two true colours must not be "lied" about with its
 * own second colour. Null when the card claims nothing of that kind, because
 * there is then no true claim to contrast with and the round would be
 * teaching a property the kid has never been told.
 */
export function falseAttributeFor(
  card: VocabularyCard,
  kind: AttributeKind,
  random: RandomSource = Math.random,
): CardAttribute | null {
  if (!cardAttributes(card).some((a) => a.kind === kind)) {
    return null;
  }
  const candidates = ATTRIBUTE_VALUES[kind].filter((v) => !hasAttributeValue(card, v));
  if (candidates.length === 0) {
    return null;
  }
  const value = candidates[Math.floor(random() * candidates.length)] ?? candidates[0]!;
  return { kind, value };
}

/**
 * Every card in the pack that can be asked about.
 *
 * Learn-only and secret decks are skipped for the reason the exam pool skips
 * them: a shelf that deals no questions should not supply them to anything
 * else either.
 */
export function attributedCards(decks: readonly Deck[]): readonly VocabularyCard[] {
  return decks
    .filter((deck) => deck.learnOnly !== true && deck.secret !== true)
    .flatMap((deck) => deck.cards)
    .filter((card) => cardAttributes(card).length > 0);
}
