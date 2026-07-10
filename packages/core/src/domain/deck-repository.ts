import type { Deck } from "./deck";

export interface DeckRepository {
  listDecks(): Promise<readonly Deck[]>;
  getDeck(deckId: string): Promise<Deck | null>;
}
