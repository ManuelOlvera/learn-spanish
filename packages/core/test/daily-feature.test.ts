import { describe, expect, it } from "vitest";
import { dailyCard, dailyFeature } from "../src/domain/daily";
import type { Deck } from "../src/domain/deck";
import type { VocabularyCard } from "../src/domain/card";
import type { CardAttribute } from "../src/domain/attribute";

function card(
  id: string,
  spanish: string,
  attributes?: readonly CardAttribute[],
): VocabularyCard {
  return { id, spanish, english: id, emoji: "🧪", ...(attributes ? { attributes } : {}) };
}

const decks: readonly Deck[] = [
  {
    id: "d",
    nameSpanish: "d",
    nameEnglish: "d",
    emoji: "🧪",
    cards: [
      card("rana", "la rana", [{ kind: "color", value: "verde" }]),
      card("platano", "el plátano", [{ kind: "color", value: "amarillo" }]),
      card("manzana", "la manzana", [{ kind: "color", value: "rojo" }]),
      card("uno", "uno"),
      card("dos", "dos"),
      card("tres", "tres"),
    ],
  },
];

const bare: readonly Deck[] = [{ ...decks[0]!, cards: [card("uno", "uno")] }];

const days = Array.from({ length: 30 }, (_, i) => new Date(2026, 8, i + 1));

describe("carta del día per level (roadmap 10)", () => {
  it("gives the listener a word, with no sentence", () => {
    const feature = dailyFeature(decks, new Date(2026, 8, 19), "listener");
    expect(feature.attribute).toBeUndefined();
    expect(feature.text).toBe(feature.card.spanish);
  });

  it("gives the reader a sentence about the card", () => {
    const feature = dailyFeature(decks, new Date(2026, 8, 19), "reader");
    expect(feature.attribute).toBeDefined();
    expect(feature.text).toMatch(/ (es|son) /);
  });

  it("agrees the reader's sentence with its own card", () => {
    for (const day of days) {
      const feature = dailyFeature(decks, day, "reader");
      expect(feature.text.startsWith(feature.card.spanish)).toBe(true);
    }
  });

  it("only ever states something true", () => {
    // The daily card teaches; it is the one surface that must never lie.
    for (const day of days) {
      const { card: c, attribute } = dailyFeature(decks, day, "reader");
      expect((c.attributes ?? []).some((a) => a.value === attribute?.value)).toBe(true);
    }
  });

  it("is deterministic for a date at each level", () => {
    const day = new Date(2026, 8, 19);
    for (const level of ["listener", "reader"] as const) {
      expect(dailyFeature(decks, day, level)).toEqual(dailyFeature(decks, day, level));
    }
  });

  it("varies across the month", () => {
    const seen = new Set(days.map((d) => dailyFeature(decks, d, "reader").text));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("always has a sentence for the reader, even though most words have none", () => {
    // Picked from the attributed cards rather than from the whole pack: with
    // 97 of 598 words attributed, picking the day's card first and hoping it
    // has attributes would leave the reader a bare word most days.
    for (const day of days) {
      expect(dailyFeature(decks, day, "reader").attribute).toBeDefined();
    }
  });

  it("falls back to a word when nothing in the pack is attributed", () => {
    const feature = dailyFeature(bare, new Date(2026, 8, 19), "reader");
    expect(feature.attribute).toBeUndefined();
    expect(feature.text).toBe("uno");
  });

  it("leaves the old shared daily card working", () => {
    // dailyCard is still what the listener's feature resolves to, and other
    // callers are unaffected.
    const day = new Date(2026, 8, 19);
    expect(dailyFeature(decks, day, "listener").card).toEqual(dailyCard(decks, day));
  });
});
