import { stickerId } from "./album";
import type { ActivityId } from "./album";
import { kidForActivity } from "./kid";
import type { KidId } from "./kid";
import { stickerTier } from "./sticker-tiers";
import type { StickerTier } from "./sticker-tiers";

/**
 * A "category" is one album section (a deck, or the pack-wide frases). It's
 * completed when every sticker a kid can *actually earn* in it is filled —
 * and it deepens as those stickers tier up. Completing a whole category to
 * bronze / silver / gold opens an escalating star chest, once per tier.
 */

/** The activities a given kid can earn: the shared ones (learn) plus that
 *  kid's own difficulty variant. A pre-reader never reaches the read/words
 *  games, so their album must not show — or count — those slots. */
export function activitiesForKid(
  activities: readonly ActivityId[],
  kid: KidId,
): readonly ActivityId[] {
  return activities.filter((activity) => {
    const owner = kidForActivity(activity);
    return owner === null || owner === kid;
  });
}

/** The completion tier of one album section for a kid, from its earnable
 *  slots' counts. A slot earned before the tier system (in the album but with
 *  no count) reads as one completion, matching the album's own tier display. */
export function categoryTierFromAlbum(
  kid: KidId,
  deckId: string,
  activities: readonly ActivityId[],
  counts: Readonly<Record<string, number>>,
  earned: ReadonlySet<string>,
): StickerTier {
  const slots = activitiesForKid(activities, kid).map((activity) => {
    const id = stickerId(kid, deckId, activity);
    return counts[id] ?? (earned.has(id) ? 1 : 0);
  });
  return categoryTier(slots);
}

/** Tiers low→high; `none` = not yet earned. Index doubles as rank. */
const TIER_ORDER: readonly StickerTier[] = ["none", "earned", "silver", "gold"];

export function tierRank(tier: StickerTier): number {
  return TIER_ORDER.indexOf(tier);
}

/** A category is only as strong as its weakest slot: gold when *every*
 *  earnable sticker is gold, `none` while any slot is still empty. */
export function categoryTier(counts: readonly number[]): StickerTier {
  if (counts.length === 0) {
    return "none";
  }
  return counts.reduce<StickerTier>((weakest, count) => {
    const tier = stickerTier(count);
    return tierRank(tier) < tierRank(weakest) ? tier : weakest;
  }, "gold");
}

/** Star chest for finishing a category at each tier — richer the higher it goes. */
export const CATEGORY_BONUS: Record<Exclude<StickerTier, "none">, number> = {
  earned: 15,
  silver: 30,
  gold: 50,
};

export function categoryReward(tier: StickerTier): number {
  return tier === "none" ? 0 : CATEGORY_BONUS[tier];
}

/** The chest to open now: the current tier when it outranks whatever tier was
 *  last claimed, else null. Each tier's chest opens exactly once — reaching
 *  gold straight past an unclaimed silver simply opens the gold chest. */
export function pendingCategoryTier(
  current: StickerTier,
  claimed: StickerTier,
): Exclude<StickerTier, "none"> | null {
  return current !== "none" && tierRank(current) > tierRank(claimed)
    ? current
    : null;
}
