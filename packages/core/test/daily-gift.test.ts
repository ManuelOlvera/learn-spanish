import { describe, expect, it } from "vitest";
import {
  canClaimDailyGift,
  DAILY_GIFT_BOOST_CHANCE,
  DAILY_GIFT_FREEZE_CHANCE,
  drawDailyGift,
} from "../src/domain/daily-gift";

/** Where each branch's band starts, given one branch roll (see drawDailyGift). */
const BOOST_BAND = DAILY_GIFT_FREEZE_CHANCE;
const STARS_BAND = DAILY_GIFT_FREEZE_CHANCE + DAILY_GIFT_BOOST_CHANCE;

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

  it("draws a ⚡ boost in the band above the freeze", () => {
    expect(drawDailyGift(() => BOOST_BAND + 0.001)).toEqual({
      type: "boost",
      tier: 2,
    });
  });

  it("never hands out the x3 boost — that stays the paid box's prize", () => {
    for (let r = 0; r < 1; r += 0.01) {
      const gift = drawDailyGift(() => r);
      if (gift.type === "boost") {
        expect(gift.tier).toBe(2);
      }
    }
  });

  it("draws stars otherwise, always a modest top-up (10–25)", () => {
    // random() is consumed twice (branch, then amount), so a constant stub past
    // the boost band still lands inside the 10–25 band.
    for (const r of [STARS_BAND + 0.001, 0.5, 0.999999]) {
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
      expect(["stars", "freeze", "boost"]).toContain(drawDailyGift(() => r).type);
    }
  });
});
