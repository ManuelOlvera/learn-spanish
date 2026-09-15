import { describe, expect, it } from "vitest";
import {
  activitiesForKid,
  categoryReward,
  categoryTier,
  categoryTierFromAlbum,
  CATEGORY_BONUS,
  earnableActivities,
  pendingCategoryTier,
  pruneStickerCounts,
  stickerCount,
  tierRank,
} from "../src/domain/category";
import {
  ALL_ACTIVITIES,
  SENTENCE_ACTIVITIES,
  stickerId,
} from "../src/domain/album";
import type { ActivityId } from "../src/domain/album";
import type { Deck } from "../src/domain/deck";
import type { KidId } from "../src/domain/kid";
import { TIER_THRESHOLDS } from "../src/domain/sticker-tiers";
import { card } from "./helpers";

function testDeck(id: string, extra: Partial<Deck> = {}): Deck {
  return {
    id,
    nameSpanish: id,
    nameEnglish: id,
    emoji: "🧪",
    cards: [card(1), card(2), card(3), card(4)],
    ...extra,
  };
}

describe("earnableActivities", () => {
  it("offers a kid only their own difficulty's activities", () => {
    const listener = earnableActivities(testDeck("uno"), "listener");
    expect(listener).toContain("learn");
    expect(listener).toContain("quiz-listen");
    expect(listener).not.toContain("quiz-read");
    expect(listener).toHaveLength(6);
  });

  it("offers a learn-only deck nothing but flashcards", () => {
    expect(
      earnableActivities(testDeck("verbo", { learnOnly: true }), "reader"),
    ).toEqual(["learn"]);
  });

  it("falls back to the full set with no deck (the pack-wide sections)", () => {
    expect(earnableActivities(null, "reader")).toEqual(
      activitiesForKid(ALL_ACTIVITIES, "reader"),
    );
  });

  /**
   * The bug this function exists to close: the album drew every deck with the
   * full six activities while el camino counted a learn-only deck's one. So
   * finishing the verbs' flashcards completed the deck on the route, and left
   * the album showing five slots nothing could fill — no medal, and the
   * completion chest checked the same six and paid nothing.
   */
  it("gives a finished learn-only deck its medal, as el camino already did", () => {
    const verbo = testDeck("verbo", { learnOnly: true });
    const earned = new Set([stickerId("reader", "verbo", "learn")]);
    const activities = earnableActivities(verbo, "reader");

    expect(
      categoryTierFromAlbum("reader", "verbo", activities, {}, earned),
    ).toBe("earned");
    // What the album used to ask, and why the medal never came.
    expect(
      categoryTierFromAlbum(
        "reader",
        "verbo",
        activitiesForKid(ALL_ACTIVITIES, "reader"),
        {},
        earned,
      ),
    ).toBe("none");
  });
});

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

  it("rides the 2026-09-15 rebalance (ADR 020)", () => {
    // Finishing a whole album section has to out-pay the games that filled it,
    // or the medal is a worse prize than the last sticker on the way to it.
    expect(CATEGORY_BONUS).toEqual({ earned: 40, silver: 80, gold: 125 });
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

/**
 * The counts ledger is not a second record of *whether* an activity was
 * finished — only of how often. When the two disagreed, the album put a 🥇 on
 * a category whose stickers were absent while home's pips (which only ever
 * counted stickers) showed the same deck untouched, and the completion chest
 * paid stars against the inflated tier.
 */
describe("stickerCount: the sticker is the proof, the count is the depth", () => {
  const counts = { "listener:platos:learn": 5 };

  it("reads a count with no sticker behind it as zero", () => {
    expect(
      stickerCount("listener", "platos", "learn", counts, new Set()),
    ).toBe(0);
  });

  it("reads the count when the sticker is there", () => {
    expect(
      stickerCount(
        "listener",
        "platos",
        "learn",
        counts,
        new Set(["listener:platos:learn"]),
      ),
    ).toBe(5);
  });

  it("reads a pre-tier sticker with no count row as one completion", () => {
    expect(
      stickerCount(
        "listener",
        "platos",
        "learn",
        {},
        new Set(["listener:platos:learn"]),
      ),
    ).toBe(1);
  });

  it("never credits another kid's sticker", () => {
    expect(
      stickerCount(
        "reader",
        "platos",
        "learn",
        counts,
        new Set(["listener:platos:learn"]),
      ),
    ).toBe(0);
  });
});

describe("categoryTierFromAlbum", () => {
  const deck = testDeck("platos");
  const activities = earnableActivities(deck, "listener");
  const fullCounts = Object.fromEntries(
    activities.map((a) => [stickerId("listener", "platos", a), 5]),
  );

  it("awards no medal when the ledger is full but the album is empty", () => {
    expect(
      categoryTierFromAlbum("listener", "platos", activities, fullCounts, new Set()),
    ).toBe("none");
  });

  it("awards gold when the stickers back every count", () => {
    const earned = new Set(
      activities.map((a) => stickerId("listener", "platos", a)),
    );
    expect(
      categoryTierFromAlbum("listener", "platos", activities, fullCounts, earned),
    ).toBe("gold");
  });

  it("is held down by the one slot whose sticker is missing", () => {
    const earned = new Set(
      activities.slice(1).map((a) => stickerId("listener", "platos", a)),
    );
    expect(
      categoryTierFromAlbum("listener", "platos", activities, fullCounts, earned),
    ).toBe("none");
  });
});

describe("pruneStickerCounts", () => {
  const earned = new Set(["listener:animales:learn", "listener:animales:quiz-listen"]);

  it("drops a count whose sticker is not in the album", () => {
    // ADR 016: a count with no sticker behind it reads as zero everywhere, so
    // putting it on the wire syncs a number no screen may act on.
    expect(
      pruneStickerCounts({ "listener:comida:learn": 7 }, earned),
    ).toEqual({});
  });

  it("drops a count of one, which says nothing the sticker did not", () => {
    // stickerCount() reads an absent count under an earned sticker as 1, so
    // shipping the 1 is pure repetition of the sticker id.
    expect(
      pruneStickerCounts({ "listener:animales:learn": 1 }, earned),
    ).toEqual({});
  });

  it("keeps every count that records real depth", () => {
    expect(
      pruneStickerCounts(
        { "listener:animales:learn": 5, "listener:animales:quiz-listen": 2 },
        earned,
      ),
    ).toEqual({
      "listener:animales:learn": 5,
      "listener:animales:quiz-listen": 2,
    });
  });

  it("never lets a pruned snapshot change what a tier reads", () => {
    // The property that makes this safe to do on the wire: every surface asks
    // stickerCount, and pruning may not move a single one of its answers.
    const counts = {
      "listener:animales:learn": 1,
      "listener:animales:quiz-listen": 4,
      "listener:comida:learn": 9, // orphan
    };
    const pruned = pruneStickerCounts(counts, earned);
    for (const id of [...earned, "listener:comida:learn"]) {
      const [kid, deckId, activity] = id.split(":") as [KidId, string, ActivityId];
      expect(stickerCount(kid, deckId, activity, pruned, earned)).toBe(
        stickerCount(kid, deckId, activity, counts, earned),
      );
    }
  });
});
