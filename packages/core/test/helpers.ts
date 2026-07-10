import type { Deck } from "../src/domain/deck";
import type { VocabularyCard } from "../src/domain/card";

export function card(n: number): VocabularyCard {
  return {
    id: `word-${n}`,
    spanish: `palabra ${n}`,
    english: `word ${n}`,
    emoji: String.fromCodePoint(0x1f400 + n),
  };
}

export function deckOf(cardCount: number): Deck {
  return {
    id: "test-deck",
    nameSpanish: "Prueba",
    nameEnglish: "Test",
    emoji: "🧪",
    cards: Array.from({ length: cardCount }, (_, i) => card(i)),
  };
}

/** Deterministic RNG (mulberry32) so shuffle assertions are reproducible. */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
