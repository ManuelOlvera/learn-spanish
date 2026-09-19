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
  /** The same shelves in **camino order**, which is not the home screen's
   *  browsing order. The ladder itself is content curation and lives with the
   *  shelves in `infrastructure` (ADR 016); exposing it here is what keeps the
   *  use cases that need it from reaching across the layering to fetch it. */
  listGroupsInTrailOrder(): Promise<readonly DeckGroup[]>;
}
