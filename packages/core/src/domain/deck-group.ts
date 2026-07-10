/** A themed shelf of decks — the home screen shows groups, not decks,
 *  so it stays one screen at any pack size. */
export interface DeckGroup {
  readonly id: string;
  readonly nameSpanish: string;
  readonly nameEnglish: string;
  readonly emoji: string;
  readonly deckIds: readonly string[];
}

export interface DeckGroupRepository {
  listGroups(): Promise<readonly DeckGroup[]>;
}
