import { describe, expect, it } from "vitest";
import { COMBO_MILESTONES, isComboMilestone } from "../src/domain/combo";

describe("combo milestones", () => {
  it("fires at 3, 5, and 10 in a row and nowhere else", () => {
    expect(COMBO_MILESTONES).toEqual([3, 5, 10]);
    expect(isComboMilestone(3)).toBe(true);
    expect(isComboMilestone(5)).toBe(true);
    expect(isComboMilestone(10)).toBe(true);
    for (const n of [0, 1, 2, 4, 6, 7, 8, 9, 11]) {
      expect(isComboMilestone(n), `count ${n}`).toBe(false);
    }
  });
});
