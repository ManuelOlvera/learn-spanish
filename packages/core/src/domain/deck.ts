import type { VocabularyCard } from "./card";

export interface Deck {
  readonly id: string;
  readonly nameSpanish: string;
  readonly nameEnglish: string;
  readonly emoji: string;
  readonly cards: readonly VocabularyCard[];
}
