import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/** "pictures": pair two identical pictures (pre-readers).
 *  "words": pair a picture with its written Spanish word (early readers). */
export type MemoryMode = "pictures" | "words";

export interface MemoryTile {
  readonly id: string;
  readonly card: VocabularyCard;
  readonly cardId: string;
  /** What this tile shows when flipped face-up. */
  readonly face: "picture" | "word";
}

export interface MemoryGame {
  readonly deckId: string;
  readonly mode: MemoryMode;
  readonly tiles: readonly MemoryTile[];
}

/** Kid-sized boards: 8 tiles for pre-readers, 12 for readers. */
export const MEMORY_PAIR_COUNT: Record<MemoryMode, number> = {
  pictures: 4,
  words: 6,
};

export function createMemoryGame(
  deck: Deck,
  mode: MemoryMode,
  random: RandomSource = Math.random,
): MemoryGame {
  const pairCount = MEMORY_PAIR_COUNT[mode];
  if (deck.cards.length < pairCount) {
    throw new QuizDeckTooSmallError(deck.id, deck.cards.length, pairCount);
  }

  const cards = shuffled(deck.cards, random).slice(0, pairCount);
  const tiles = cards.flatMap((card): MemoryTile[] => [
    { id: `${card.id}-a`, card, cardId: card.id, face: "picture" },
    {
      id: `${card.id}-b`,
      card,
      cardId: card.id,
      face: mode === "pictures" ? "picture" : "word",
    },
  ]);

  return { deckId: deck.id, mode, tiles: shuffled(tiles, random) };
}

export function tilesMatch(a: MemoryTile, b: MemoryTile): boolean {
  return a.id !== b.id && a.cardId === b.cardId;
}
