import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";

/**
 * La llave de papá — a grown-up opens one locked shelf of el camino
 * (ADR 021's 2026-09-19 addendum).
 *
 * Returns the full set of shelves this kid has had opened, so the caller can
 * render the parent's own keys back to them.
 *
 * There is deliberately **no matching lock**: the set only ever grows, which
 * is what lets ADR 004 merge it by union with no new semantics, and what makes
 * the failure direction of an override "stays open" rather than "quietly shut
 * again after a sync". Undoing a key is a roadmap item, not an oversight.
 */
export class UnlockShelfUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, groupId: string): readonly string[] {
    const open = this.store.loadUnlockedShelves(kid);
    if (open.includes(groupId)) {
      return open;
    }
    const next = [...open, groupId];
    this.store.saveUnlockedShelves(kid, next);
    return next;
  }
}
