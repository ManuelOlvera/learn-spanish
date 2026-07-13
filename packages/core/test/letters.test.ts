import { describe, expect, it } from "vitest";
import {
  applyLetterCase,
  buildAlphabetDeck,
  isCasePairGlyph,
  LETTER_CASES,
} from "../src/domain/letters";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";

describe("isCasePairGlyph", () => {
  it("recognises the letter-card faces (upper+lower pairs)", () => {
    expect(isCasePairGlyph("Aa")).toBe(true);
    expect(isCasePairGlyph("Ññ")).toBe(true);
    expect(isCasePairGlyph("Áá")).toBe(true);
  });

  it("leaves every other card face alone", () => {
    expect(isCasePairGlyph("🐶")).toBe(false); // real emoji (surrogate pair)
    expect(isCasePairGlyph("1️⃣0️⃣")).toBe(false); // keycap sequence
    expect(isCasePairGlyph("100")).toBe(false); // digit face (centenas)
    expect(isCasePairGlyph("AA")).toBe(false); // not a case pair
    expect(isCasePairGlyph("aa")).toBe(false);
    expect(isCasePairGlyph("A")).toBe(false); // already single
    expect(isCasePairGlyph("")).toBe(false);
  });
});

describe("applyLetterCase", () => {
  it("slices a case pair to the chosen case", () => {
    expect(applyLetterCase("Bb", "upper")).toBe("B");
    expect(applyLetterCase("Bb", "lower")).toBe("b");
    expect(applyLetterCase("Bb", "both")).toBe("Bb");
    expect(applyLetterCase("Ññ", "lower")).toBe("ñ");
    expect(applyLetterCase("Áá", "upper")).toBe("Á");
  });

  it("passes non-letter faces through untouched in every case", () => {
    for (const letterCase of LETTER_CASES) {
      expect(applyLetterCase("🐶", letterCase)).toBe("🐶");
      expect(applyLetterCase("1️⃣0️⃣", letterCase)).toBe("1️⃣0️⃣");
      expect(applyLetterCase("100", letterCase)).toBe("100");
    }
  });
});

describe("buildAlphabetDeck", () => {
  it("assembles all 27 letters in order, ñ after n, no accented vowels", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const abecedario = buildAlphabetDeck(decks);
    expect(abecedario.cards.map((c) => c.emoji.slice(0, 1)).join("")).toBe(
      "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ",
    );
    expect(abecedario.cards).toHaveLength(27);
    expect(abecedario.cards.some((c) => c.id.endsWith("-tilde"))).toBe(false);
  });
});
