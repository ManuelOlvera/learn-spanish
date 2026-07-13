import { categoryReward, pendingCategoryTier } from "../domain/category";
import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import type { StickerTier } from "../domain/sticker-tiers";
import { bankStars } from "./earn-stars";

/** Bank the chest for reaching `tier` in a category, once per tier — a chest
 *  that already paid (at this tier or higher) never re-pays. Returns the star
 *  bonus paid, or null when there is nothing to claim. */
export class ClaimCategoryRewardUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, deckId: string, tier: StickerTier): number | null {
    const record = this.store.loadCategoryAwards(kid);
    const claimed = record[deckId] ?? "none";
    if (pendingCategoryTier(tier, claimed) === null) {
      return null;
    }
    this.store.saveCategoryAwards(kid, { ...record, [deckId]: tier });
    const bonus = categoryReward(tier);
    bankStars(this.store, kid, bonus);
    return bonus;
  }
}
