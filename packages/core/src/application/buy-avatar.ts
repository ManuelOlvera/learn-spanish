import { AVATAR_COSTS } from "../domain/avatars";
import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { trySpend } from "./spend-stars";

/**
 * Buy an avatar for its AVATAR_CATALOG price — the caller names the emoji,
 * never the cost. Null for an emoji outside the catalog, a free starter
 * (those are always owned), an already-bought one, or an empty wallet.
 * Returns the new balance.
 */
export class BuyAvatarUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, emoji: string): number | null {
    const cost = AVATAR_COSTS[emoji];
    if (cost === undefined || cost === 0) {
      return null;
    }
    const owned = this.store.loadOwnedAvatars(kid);
    if (owned.includes(emoji)) {
      return null;
    }
    const stars = trySpend(this.store, kid, cost);
    if (stars === null) {
      return null;
    }
    this.store.saveOwnedAvatars(kid, [...owned, emoji]);
    return stars;
  }
}
