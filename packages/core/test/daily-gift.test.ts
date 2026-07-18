import { describe, expect, it } from "vitest";
import {
  canClaimDailyGift,
  DAILY_GIFT_FREEZE_CHANCE,
  drawDailyGift,
} from "../src/domain/daily-gift";

describe("daily gift — canClaim", () => {
  it("is claimable when never claimed", () => {
    expect(canClaimDailyGift(null, "2026-07-18")).toBe(true);
  });

  it("is not claimable again on the same day", () => {
    expect(canClaimDailyGift("2026-07-18", "2026-07-18")).toBe(false);
  });

  it("reopens on a new day", () => {
    expect(canClaimDailyGift("2026-07-18", "2026-07-19")).toBe(true);
  });
});

describe("daily gift — draw", () => {
  it("draws a freeze on a low roll", () => {
    // First roll under the freeze chance selects the freeze branch.
    expect(drawDailyGift(() => DAILY_GIFT_FREEZE_CHANCE / 2)).toEqual({
      type: "freeze",
    });
  });

  it("draws stars otherwise, always a modest top-up (10–25)", () => {
    // random() is consumed twice (freeze check, then amount), so a constant
    // stub just past the freeze chance still lands inside the 10–25 band.
    for (const r of [DAILY_GIFT_FREEZE_CHANCE + 0.001, 0.5, 0.999999]) {
      const gift = drawDailyGift(() => r);
      expect(gift.type).toBe("stars");
      if (gift.type === "stars") {
        expect(gift.amount).toBeGreaterThanOrEqual(10);
        expect(gift.amount).toBeLessThanOrEqual(25);
      }
    }
  });

  it("never hands out an accessory (that stays the paid box's job)", () => {
    for (let r = 0; r < 1; r += 0.05) {
      expect(["stars", "freeze"]).toContain(drawDailyGift(() => r).type);
    }
  });
});
