import { describe, expect, it } from "vitest";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import {
  ATTRIBUTE_VALUES,
  attributeText,
  attributedCards,
  cardAttributes,
  falseAttributeFor,
} from "../src/domain/attribute";
import type { AttributeKind } from "../src/domain/attribute";

const repo = new StaticDeckRepository();

/** The decks that carry attribute content. Pinned so adding one is a
 *  deliberate act with a recount, the same way the pack size is pinned. */
const ATTRIBUTED_DECKS = [
  "animals",
  "food",
  "nature",
  "toys",
  "bugs",
  "zoo",
  "sea",
  "fruit",
  "aves",
  "verduras",
  "dulces",
];

describe("attribute content (roadmap 21)", () => {
  it("attributes 94 words across eleven decks (update this with the content)", async () => {
    const decks = await repo.listDecks();
    expect(attributedCards(decks)).toHaveLength(94);
    const withAttributes = decks
      .filter((d) => d.cards.some((c) => cardAttributes(c).length > 0))
      .map((d) => d.id);
    expect(withAttributes.sort()).toEqual([...ATTRIBUTED_DECKS].sort());
  });

  it("only ever uses a value from the closed vocabulary", async () => {
    const decks = await repo.listDecks();
    for (const card of attributedCards(decks)) {
      for (const attribute of cardAttributes(card)) {
        expect(ATTRIBUTE_VALUES[attribute.kind]).toContain(attribute.value);
      }
    }
  });

  it("never claims both sizes of one thing", async () => {
    const decks = await repo.listDecks();
    for (const card of attributedCards(decks)) {
      const sizes = cardAttributes(card).filter((a) => a.kind === "size");
      expect(sizes.length).toBeLessThanOrEqual(1);
    }
  });

  it("never repeats a kind+value on one card", async () => {
    const decks = await repo.listDecks();
    for (const card of attributedCards(decks)) {
      const seen = cardAttributes(card).map((a) => `${a.kind}:${a.value}`);
      expect(new Set(seen).size).toBe(seen.length);
    }
  });

  it("puts no attribute on a learn-only or secret deck", async () => {
    // attributedCards filters these out, so this checks the *content* rather
    // than the filter: an attribute there would be dead data.
    const decks = await repo.listDecks();
    for (const deck of decks) {
      if (deck.learnOnly === true || deck.secret === true) {
        expect(deck.cards.flatMap(cardAttributes)).toEqual([]);
      }
    }
  });

  it("can always build a false claim for every kind it claims", async () => {
    // The invariant sí o no depends on: a round that cannot lie has no
    // false half, and a game that only ever says the truth teaches a kid to
    // tap ✅ without listening.
    const decks = await repo.listDecks();
    for (const card of attributedCards(decks)) {
      for (const kind of new Set(cardAttributes(card).map((a) => a.kind))) {
        expect(falseAttributeFor(card, kind as AttributeKind, () => 0)).not.toBeNull();
      }
    }
  });

  it("reads as grammatical Spanish for every attributed card", async () => {
    // Renders every true claim in the pack and checks the shape of it. The
    // agreement rules are unit-tested; this is the sweep that catches a card
    // whose article the rules cannot read.
    const decks = await repo.listDecks();
    for (const card of attributedCards(decks)) {
      for (const attribute of cardAttributes(card)) {
        const text = attributeText(card, attribute);
        expect(text.startsWith(card.spanish)).toBe(true);
        expect(text).toMatch(/ (es|son) /);
        // An -o adjective must have inflected away from its citation form
        // whenever the word it describes is feminine or plural.
        expect(text.endsWith(" rojo")).toBe(
          attribute.value === "rojo" && card.spanish.startsWith("el "),
        );
      }
    }
  });

  it("agrees with the handful of words that break the article rule", async () => {
    // "el agua" and "el águila" are feminine nouns that take *el* for
    // phonetic reasons, so the article lies about their gender. Both are
    // deliberately given only invariant adjectives (azul, marrón, grande),
    // which is why the wrong gender cannot surface — pinned here so a later
    // author does not hand one of them a colour like rojo.
    const decks = await repo.listDecks();
    const byId = new Map(decks.flatMap((d) => d.cards).map((c) => [c.id, c]));
    for (const id of ["agua", "aguila"]) {
      const card = byId.get(id);
      if (card === undefined) continue;
      for (const attribute of cardAttributes(card)) {
        expect(attributeText(card, attribute)).not.toMatch(/o$/);
      }
    }
  });
});
