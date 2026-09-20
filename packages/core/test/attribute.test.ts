import { describe, expect, it } from "vitest";
import {
  ATTRIBUTE_VALUES,
  attributeClaim,
  attributeText,
  cardAttributes,
  falseAttributeFor,
  hasAttributeValue,
  attributedCards,
} from "../src/domain/attribute";
import type { CardAttribute } from "../src/domain/attribute";
import type { VocabularyCard } from "../src/domain/card";

function card(
  id: string,
  spanish: string,
  attributes?: readonly CardAttribute[],
): VocabularyCard {
  return { id, spanish, english: id, emoji: "🧪", ...(attributes ? { attributes } : {}) };
}

const platano = card("platano", "el plátano", [{ kind: "color", value: "amarillo" }]);
const manzana = card("manzana", "la manzana", [{ kind: "color", value: "rojo" }]);
const elefante = card("elefante", "el elefante", [
  { kind: "color", value: "gris" },
  { kind: "size", value: "grande" },
]);
const rana = card("rana", "la rana", [
  { kind: "color", value: "verde" },
  { kind: "size", value: "pequeño" },
]);
const uno = card("uno", "uno");

describe("building the claim a kid hears", () => {
  it("agrees the adjective with the card's own word", () => {
    expect(attributeText(platano, { kind: "color", value: "amarillo" })).toBe(
      "el plátano es amarillo",
    );
    expect(attributeText(manzana, { kind: "color", value: "rojo" })).toBe(
      "la manzana es roja",
    );
  });

  it("uses son for a plural word, never es", () => {
    // "las palomitas es blanca" is the kind of mistake that teaches a child
    // wrong Spanish out loud, so the verb agrees as well as the adjective.
    const palomitas = card("palomitas", "las palomitas", [
      { kind: "color", value: "blanco" },
    ]);
    expect(attributeText(palomitas, { kind: "color", value: "blanco" })).toBe(
      "las palomitas son blancas",
    );
    const guisantes = card("guisantes", "los guisantes", [
      { kind: "color", value: "verde" },
    ]);
    expect(attributeText(guisantes, { kind: "color", value: "verde" })).toBe(
      "los guisantes son verdes",
    );
  });

  it("agrees a size the same way", () => {
    expect(attributeText(rana, { kind: "size", value: "pequeño" })).toBe(
      "la rana es pequeña",
    );
    expect(attributeText(elefante, { kind: "size", value: "grande" })).toBe(
      "el elefante es grande",
    );
  });

  it("asks it as a question when a game needs one", () => {
    expect(attributeClaim(manzana, { kind: "color", value: "rojo" }).question).toBe(
      "¿La manzana es roja?",
    );
  });

  it("knows whether the claim it built is true", () => {
    expect(attributeClaim(manzana, { kind: "color", value: "rojo" }).isTrue).toBe(true);
    expect(attributeClaim(manzana, { kind: "color", value: "verde" }).isTrue).toBe(
      false,
    );
  });
});

describe("lying about an attribute", () => {
  it("swaps within the same kind, never across kinds", () => {
    // The whole reason attributes are typed: "el plátano es grande" is
    // arguably true, so a false claim built by swapping a colour for a size
    // is not reliably false.
    for (let i = 0; i < 50; i += 1) {
      const lie = falseAttributeFor(platano, "color", () => i / 50);
      expect(lie?.kind).toBe("color");
      expect(ATTRIBUTE_VALUES.color).toContain(lie?.value);
    }
  });

  it("never picks a value that is actually true of the card", () => {
    for (let i = 0; i < 50; i += 1) {
      const lie = falseAttributeFor(platano, "color", () => i / 50);
      expect(lie?.value).not.toBe("amarillo");
    }
  });

  it("excludes every true value when a card has more than one of a kind", () => {
    const bandera = card("bandera", "la bandera", [
      { kind: "color", value: "rojo" },
      { kind: "color", value: "verde" },
    ]);
    for (let i = 0; i < 50; i += 1) {
      const lie = falseAttributeFor(bandera, "color", () => i / 50);
      expect(["rojo", "verde"]).not.toContain(lie?.value);
    }
  });

  it("returns the opposite size, since there are only two", () => {
    expect(falseAttributeFor(rana, "size", () => 0)?.value).toBe("grande");
    expect(falseAttributeFor(elefante, "size", () => 0)?.value).toBe("pequeño");
  });

  it("has nothing to lie about on a card with no attribute of that kind", () => {
    expect(falseAttributeFor(uno, "color", () => 0)).toBeNull();
    expect(falseAttributeFor(platano, "size", () => 0)).toBeNull();
  });

  it("builds a false claim that reads as correct Spanish", () => {
    const lie = falseAttributeFor(manzana, "color", () => 0)!;
    const claim = attributeClaim(manzana, lie);
    expect(claim.isTrue).toBe(false);
    // Agreement still has to hold on a lie — a wrong fact, not wrong grammar.
    expect(claim.text.startsWith("la manzana es ")).toBe(true);
    expect(claim.text).not.toContain("rojo");
  });
});

describe("finding the words that can be asked about", () => {
  it("reads a card's attributes, and none from a card without them", () => {
    expect(cardAttributes(platano)).toHaveLength(1);
    expect(cardAttributes(uno)).toEqual([]);
  });

  it("answers whether a card holds a given value", () => {
    expect(hasAttributeValue(rana, "verde")).toBe(true);
    expect(hasAttributeValue(rana, "rojo")).toBe(false);
  });

  it("collects only the attributed cards from a pack", () => {
    const decks = [
      { id: "d1", nameSpanish: "d1", nameEnglish: "d1", emoji: "🧪", cards: [platano, uno] },
      { id: "d2", nameSpanish: "d2", nameEnglish: "d2", emoji: "🧪", cards: [rana] },
    ];
    expect(attributedCards(decks).map((c) => c.id)).toEqual(["platano", "rana"]);
  });

  it("skips a learn-only or secret deck's cards", () => {
    // Same rule as the exam pool: a shelf that deals no questions should not
    // supply them to anything else either.
    const decks = [
      {
        id: "verbs", nameSpanish: "v", nameEnglish: "v", emoji: "🧪",
        learnOnly: true, cards: [platano],
      },
      {
        id: "secret", nameSpanish: "s", nameEnglish: "s", emoji: "🧪",
        secret: true, cards: [manzana],
      },
      { id: "ok", nameSpanish: "o", nameEnglish: "o", emoji: "🧪", cards: [rana] },
    ];
    expect(attributedCards(decks).map((c) => c.id)).toEqual(["rana"]);
  });
});
