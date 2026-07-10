import type { DeckGroup, DeckGroupRepository } from "../domain/deck-group";
import { DECK_GROUPS } from "./deck-groups";

export class StaticDeckGroupRepository implements DeckGroupRepository {
  listGroups(): Promise<readonly DeckGroup[]> {
    return Promise.resolve(DECK_GROUPS);
  }
}
