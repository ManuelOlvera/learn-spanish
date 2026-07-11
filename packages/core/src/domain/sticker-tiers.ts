/** Replay value: the same album slot upgrades as the activity is replayed. */
export type StickerTier = "none" | "earned" | "silver" | "gold";

export const TIER_THRESHOLDS = { silver: 3, gold: 5 } as const;

export function stickerTier(count: number): StickerTier {
  if (count >= TIER_THRESHOLDS.gold) {
    return "gold";
  }
  if (count >= TIER_THRESHOLDS.silver) {
    return "silver";
  }
  return count >= 1 ? "earned" : "none";
}
