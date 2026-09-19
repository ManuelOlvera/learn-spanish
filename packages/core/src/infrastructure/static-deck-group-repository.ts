import type { DeckGroup, DeckGroupRepository } from "../domain/deck-group";
import { DECK_GROUPS, groupsInTrailOrder } from "./deck-groups";

export class StaticDeckGroupRepository implements DeckGroupRepository {
  listGroupsInTrailOrder(): Promise<readonly DeckGroup[]> {
    return Promise.resolve(groupsInTrailOrder(DECK_GROUPS));
  }

  listGroups(): Promise<readonly DeckGroup[]> {
    return Promise.resolve(DECK_GROUPS);
  }
}
