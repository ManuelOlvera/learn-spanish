import type { DeckGroup, DeckGroupRepository } from "../domain/deck-group";

export class ListDeckGroupsUseCase {
  constructor(private readonly groups: DeckGroupRepository) {}

  execute(): Promise<readonly DeckGroup[]> {
    return this.groups.listGroups();
  }
}
