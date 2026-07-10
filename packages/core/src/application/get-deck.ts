import type { Deck } from "../domain/deck";
import type { DeckRepository } from "../domain/deck-repository";
import { DeckNotFoundError } from "../domain/errors";

export class GetDeckUseCase {
  constructor(private readonly decks: DeckRepository) {}

  async execute(deckId: string): Promise<Deck> {
    const deck = await this.decks.getDeck(deckId);
    if (deck === null) {
      throw new DeckNotFoundError(deckId);
    }
    return deck;
  }
}
