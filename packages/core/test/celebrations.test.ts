import { describe, expect, it } from "vitest";
import {
  CELEBRATIONS,
  pickCelebration,
} from "../src/domain/celebrations";

describe("celebrations", () => {
  it("offers several distinct cheers so a finish varies", () => {
    expect(CELEBRATIONS.length).toBeGreaterThanOrEqual(5);
    const phrases = CELEBRATIONS.map((c) => c.phrase);
    expect(new Set(phrases).size).toBe(phrases.length);
  });

  it("every cheer is a non-empty spoken phrase with a burst emoji", () => {
    for (const c of CELEBRATIONS) {
      expect(c.phrase.trim()).not.toBe("");
      expect(c.emoji.trim()).not.toBe("");
    }
  });

  it("praise stays gender-neutral (both kids play)", () => {
    for (const c of CELEBRATIONS) {
      expect(c.phrase.toLowerCase()).not.toMatch(/campe[oó]n|campeona|list[oa]\b/);
    }
  });

  it("pickCelebration maps the random draw across the whole pool", () => {
    expect(pickCelebration(() => 0)).toEqual(CELEBRATIONS[0]);
    // Just under 1 lands on the last entry, never past the end.
    expect(pickCelebration(() => 0.999999)).toEqual(
      CELEBRATIONS[CELEBRATIONS.length - 1],
    );
  });

  it("pickCelebration always returns a real cheer, even at the 1.0 edge", () => {
    expect(CELEBRATIONS).toContainEqual(pickCelebration(() => 1));
  });
});
