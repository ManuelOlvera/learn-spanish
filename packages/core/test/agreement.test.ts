import { describe, expect, it } from "vitest";
import { agree, cardAgreement } from "../src/domain/spanish";
import type { VocabularyCard } from "../src/domain/card";

function card(spanish: string, extra: Partial<VocabularyCard> = {}): VocabularyCard {
  return { id: "x", spanish, english: "x", emoji: "🧪", ...extra };
}

describe("adjective agreement", () => {
  const MS = { gender: "m", number: "singular" } as const;
  const FS = { gender: "f", number: "singular" } as const;
  const MP = { gender: "m", number: "plural" } as const;
  const FP = { gender: "f", number: "plural" } as const;

  it("inflects an -o adjective for both genders", () => {
    expect(agree("rojo", MS)).toBe("rojo");
    expect(agree("rojo", FS)).toBe("roja");
  });

  it("pluralises an -o adjective", () => {
    expect(agree("rojo", MP)).toBe("rojos");
    expect(agree("rojo", FP)).toBe("rojas");
  });

  it("leaves an -e adjective alone in gender", () => {
    // verde, grande: one form for both genders, which is why an agreement
    // rule keyed on the *card* rather than the adjective would be wrong.
    expect(agree("verde", MS)).toBe("verde");
    expect(agree("verde", FS)).toBe("verde");
    expect(agree("grande", FS)).toBe("grande");
  });

  it("pluralises a vowel-final invariant adjective with -s", () => {
    expect(agree("verde", MP)).toBe("verdes");
    expect(agree("naranja", FP)).toBe("naranjas");
    expect(agree("rosa", MP)).toBe("rosas");
  });

  it("leaves an -a adjective alone in gender", () => {
    // naranja and rosa are nouns used as colours; they do not take -o.
    expect(agree("naranja", MS)).toBe("naranja");
    expect(agree("rosa", MS)).toBe("rosa");
  });

  it("leaves a consonant-final adjective alone in gender", () => {
    expect(agree("azul", FS)).toBe("azul");
    expect(agree("marrón", FS)).toBe("marrón");
  });

  it("pluralises a consonant-final adjective with -es", () => {
    expect(agree("azul", MP)).toBe("azules");
  });

  it("drops the written accent when -es moves the stress", () => {
    // marrón → marrones, never "marrónes". The accent exists only to mark
    // stress on the last syllable; the plural syllable makes it redundant,
    // and leaving it is a spelling error a parent would notice.
    expect(agree("marrón", MP)).toBe("marrones");
    expect(agree("marrón", FP)).toBe("marrones");
  });

  it("handles the -ñ- adjective without mangling it", () => {
    expect(agree("pequeño", FS)).toBe("pequeña");
    expect(agree("pequeño", FP)).toBe("pequeñas");
  });
});

describe("reading gender and number off a card", () => {
  it("takes them from the article the word already carries", () => {
    expect(cardAgreement(card("el perro"))).toEqual({
      gender: "m",
      number: "singular",
    });
    expect(cardAgreement(card("la vaca"))).toEqual({
      gender: "f",
      number: "singular",
    });
    expect(cardAgreement(card("los zapatos"))).toEqual({
      gender: "m",
      number: "plural",
    });
    expect(cardAgreement(card("las tijeras"))).toEqual({
      gender: "f",
      number: "plural",
    });
  });

  it("falls back to the explicit article on a bare word", () => {
    // Letter cards speak bare ("be") but are feminine in a sentence — the
    // same reason `article` exists for the scene hunt.
    expect(cardAgreement(card("be", { article: "la" }))).toEqual({
      gender: "f",
      number: "singular",
    });
  });

  it("defaults a bare article-less word to masculine singular", () => {
    expect(cardAgreement(card("rojo"))).toEqual({
      gender: "m",
      number: "singular",
    });
  });

  it("is not fooled by a word that merely starts with those letters", () => {
    // "el elefante" is masculine; "la" in "la lámpara" is the article, but
    // "las" in "lasaña" is not — the space is what makes it an article.
    expect(cardAgreement(card("lasaña"))).toEqual({
      gender: "m",
      number: "singular",
    });
    expect(cardAgreement(card("el elefante")).gender).toBe("m");
  });
});
