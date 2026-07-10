import type { Deck } from "../domain/deck";
import type { DeckRepository } from "../domain/deck-repository";
import { STARTER_PACK } from "./starter-pack";

export class StaticDeckRepository implements DeckRepository {
  constructor(private readonly decks: readonly Deck[] = STARTER_PACK) {}

  listDecks(): Promise<readonly Deck[]> {
    return Promise.resolve(this.decks);
  }

  getDeck(deckId: string): Promise<Deck | null> {
    return Promise.resolve(this.decks.find((d) => d.id === deckId) ?? null);
  }
}
