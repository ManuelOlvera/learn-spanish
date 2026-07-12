import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/** "pictures": pair two identical pictures (pre-readers).
 *  "words": pair a picture with its written Spanish word (early readers). */
export type MemoryMode = "pictures" | "words";

export const MEMORY_MODES: readonly MemoryMode[] = ["pictures", "words"];

/** How many pairs are on the board — chosen per play, independent of the
 *  pictures/words mode. More pairs = more to remember. */
export type MemoryDifficulty = "easy" | "medium" | "hard";

export const MEMORY_DIFFICULTIES: readonly MemoryDifficulty[] = [
  "easy",
  "medium",
  "hard",
];

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
  readonly difficulty: MemoryDifficulty;
  readonly tiles: readonly MemoryTile[];
}

/** Pairs per difficulty. Hard is 8, and every non-secret deck ships ≥10
 *  cards, so any deck can fill any level. */
export const MEMORY_PAIR_COUNT: Record<MemoryDifficulty, number> = {
  easy: 3,
  medium: 5,
  hard: 8,
};

export function createMemoryGame(
  deck: Deck,
  mode: MemoryMode,
  difficulty: MemoryDifficulty,
  random: RandomSource = Math.random,
): MemoryGame {
  const pairCount = MEMORY_PAIR_COUNT[difficulty];
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

  return { deckId: deck.id, mode, difficulty, tiles: shuffled(tiles, random) };
}

export function tilesMatch(a: MemoryTile, b: MemoryTile): boolean {
  return a.id !== b.id && a.cardId === b.cardId;
}
