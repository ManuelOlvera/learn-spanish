import type { Deck } from "../domain/deck";
import type { DeckRepository } from "../domain/deck-repository";

export class ListDecksUseCase {
  constructor(private readonly decks: DeckRepository) {}

  async execute(): Promise<readonly Deck[]> {
    return this.decks.listDecks();
  }
}
