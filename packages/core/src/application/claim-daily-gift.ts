import { dayKey } from "../domain/daily";
import {
  canClaimDailyGift,
  drawDailyGift,
  type DailyGift,
} from "../domain/daily-gift";
import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import type { RandomSource } from "../domain/random";
import { walletBalance } from "../domain/stars";
import { freezesOrStarting } from "../domain/weekly";
import { bankStars } from "./earn-stars";

/** El regalo del día: open today's free gift, once per calendar day. Returns
 *  the drawn gift plus the resulting star balance, or null when today's gift
 *  was already claimed (so a double tap or a re-open never pays twice). */
export class ClaimDailyGiftUseCase {
  constructor(
    private readonly store: EconomyStore,
    private readonly random: RandomSource,
  ) {}

  execute(kid: KidId, now: Date): { gift: DailyGift; stars: number } | null {
    const today = dayKey(now);
    if (!canClaimDailyGift(this.store.loadDailyGiftDay(kid), today)) {
      return null;
    }
    // Stamp the claim before paying out: any later error can't leave the day
    // re-claimable, and the day-key write is what makes claiming idempotent.
    this.store.saveDailyGiftDay(kid, today);
    const gift = drawDailyGift(this.random);
    if (gift.type === "freeze") {
      this.store.saveFreezes(
        kid,
        freezesOrStarting(this.store.loadFreezes(kid)) + 1,
      );
      return { gift, stars: walletBalance(this.store.loadWallet(kid)) };
    }
    return { gift, stars: bankStars(this.store, kid, gift.amount) };
  }
}
