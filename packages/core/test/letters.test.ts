import { describe, expect, it } from "vitest";
import {
  applyLetterCase,
  buildAlphabetDeck,
  isCasePairGlyph,
  LETTER_CASES,
} from "../src/domain/letters";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import { sceneQuestion } from "../src/domain/scene";
import { siNoQuestion } from "../src/domain/si-no";

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

describe("letter cards are named, not articled", () => {
  /** The kids heard "la a, la be, la ce…" and it confused them: the article is
   *  not part of the letter's name. Cards speak the bare name; the article is
   *  carried separately, for the games that need a noun phrase. */
  it("speaks and shows the bare letter name", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const letters = buildAlphabetDeck(decks).cards;
    for (const card of letters) {
      expect(card.spanish).not.toMatch(/^(el|la|los|las) /);
    }
    const names = Object.fromEntries(letters.map((c) => [c.id, c.spanish]));
    expect(names["letra-a"]).toBe("a");
    expect(names["letra-b"]).toBe("be");
    expect(names["letra-c"]).toBe("ce");
    expect(names["letra-enye"]).toBe("eñe");
    expect(names["letra-w"]).toBe("uve doble");
  });

  it("still asks for a letter as a native would — the article survives in questions", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const be = buildAlphabetDeck(decks).cards.find((c) => c.id === "letra-b")!;
    // Letter names are feminine: never "el be", never a bare "¿Dónde está be?".
    expect(sceneQuestion(be)).toBe("¿Dónde está la be?");
    expect(siNoQuestion(be)).toBe("¿Es la be?");
  });

  it("accented vowels keep 'con tilde' so a listen round stays answerable", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    const vocales = decks.find((d) => d.id === "vocales")!;
    const aTilde = vocales.cards.find((c) => c.id === "letra-a-tilde")!;
    expect(aTilde.spanish).toBe("a con tilde");
    expect(sceneQuestion(aTilde)).toBe("¿Dónde está la a con tilde?");
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
