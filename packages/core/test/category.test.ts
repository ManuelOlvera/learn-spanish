import { describe, expect, it } from "vitest";
import {
  activitiesForKid,
  categoryReward,
  categoryTier,
  CATEGORY_BONUS,
  pendingCategoryTier,
  tierRank,
} from "../src/domain/category";
import { ALL_ACTIVITIES, SENTENCE_ACTIVITIES } from "../src/domain/album";
import { TIER_THRESHOLDS } from "../src/domain/sticker-tiers";

describe("activitiesForKid", () => {
  it("gives the pre-reader only listen/pictures games plus shared learn", () => {
    const listener = activitiesForKid(ALL_ACTIVITIES, "listener");
    expect([...listener]).toEqual([
      "learn",
      "quiz-listen",
      "si-no-listen",
      "match-pictures",
      "connect-listen",
      "scene-listen",
    ]);
    // Never the read/words variants a pre-reader can't reach.
    expect(listener).not.toContain("quiz-read");
    expect(listener).not.toContain("match-words");
  });

  it("gives the reader the read/words games plus shared learn", () => {
    const reader = activitiesForKid(ALL_ACTIVITIES, "reader");
    expect([...reader]).toEqual([
      "learn",
      "quiz-read",
      "si-no-read",
      "match-words",
      "connect-read",
      "scene-read",
    ]);
  });

  it("splits the pack-wide frases by kid too", () => {
    expect([...activitiesForKid(SENTENCE_ACTIVITIES, "listener")]).toEqual([
      "frases-listen",
    ]);
    expect([...activitiesForKid(SENTENCE_ACTIVITIES, "reader")]).toEqual([
      "frases-read",
    ]);
  });
});

describe("categoryTier", () => {
  const { silver, gold } = TIER_THRESHOLDS;

  it("is none while any slot is unearned", () => {
    expect(categoryTier([])).toBe("none");
    expect(categoryTier([5, 5, 0])).toBe("none");
  });

  it("is the weakest slot's tier", () => {
    expect(categoryTier([1, 1, 1])).toBe("earned");
    expect(categoryTier([gold, gold, silver])).toBe("silver");
    expect(categoryTier([gold, gold, gold])).toBe("gold");
    // one lagging slot holds the whole category back
    expect(categoryTier([gold, gold, 1])).toBe("earned");
  });
});

describe("category rewards", () => {
  it("pays more the higher the completion tier", () => {
    expect(categoryReward("none")).toBe(0);
    expect(categoryReward("earned")).toBe(CATEGORY_BONUS.earned);
    expect(CATEGORY_BONUS.earned).toBeLessThan(CATEGORY_BONUS.silver);
    expect(CATEGORY_BONUS.silver).toBeLessThan(CATEGORY_BONUS.gold);
  });
});

describe("pendingCategoryTier", () => {
  it("opens a chest only when the tier advances past what was claimed", () => {
    expect(pendingCategoryTier("earned", "none")).toBe("earned");
    expect(pendingCategoryTier("gold", "silver")).toBe("gold");
    // already claimed at this tier or higher — nothing to open
    expect(pendingCategoryTier("earned", "earned")).toBeNull();
    expect(pendingCategoryTier("silver", "gold")).toBeNull();
    // not complete yet
    expect(pendingCategoryTier("none", "none")).toBeNull();
  });

  it("skips straight to gold when silver was never claimed", () => {
    expect(pendingCategoryTier("gold", "none")).toBe("gold");
    expect(tierRank("gold")).toBeGreaterThan(tierRank("earned"));
  });
});
