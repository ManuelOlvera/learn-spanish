import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEVEL,
  gameModesFor,
  levelFor,
  promoteLevel,
  twinActivity,
  type KidLevels,
} from "../src/domain/kid";
import {
  activitiesForKid,
  categoryTierFromAlbum,
  earnableActivities,
  stickerCount,
} from "../src/domain/category";
import { ALL_ACTIVITIES } from "../src/domain/album";
import { mergeProgress, sanitizeSnapshot } from "../src/domain/transfer";
import type { ProgressSnapshot } from "../src/domain/transfer";

const base: ProgressSnapshot = { stickers: [], streaks: {}, avatars: {} };

/** A snapshot carrying one profile's level, typed so the literals narrow. */
function withLevel(kid: "listener" | "reader", level: "listen" | "read", at: number): ProgressSnapshot {
  return { ...base, levels: { [kid]: { level, at } } };
}
const T = Date.UTC(2026, 8, 20, 9, 0, 0);

describe("a profile's level (roadmap 18)", () => {
  it("defaults to the level its id has always implied", () => {
    // No migration: an absent level reads exactly as today's behaviour.
    expect(levelFor("listener")).toBe("listen");
    expect(levelFor("reader")).toBe("read");
    expect(levelFor("listener", {})).toBe("listen");
    expect(DEFAULT_LEVEL.listener).toBe("listen");
  });

  it("takes the stored level once a grown-up has set one", () => {
    const levels: KidLevels = { listener: { level: "read", at: T } };
    expect(levelFor("listener", levels)).toBe("read");
    // The other profile is untouched by its sibling's promotion.
    expect(levelFor("reader", levels)).toBe("read");
  });

  it("goes back down again — a promotion is a judgement, not a one-way door", () => {
    const up = promoteLevel({}, "listener", "read", T);
    const down = promoteLevel(up, "listener", "listen", T + 1000);
    expect(levelFor("listener", down)).toBe("listen");
  });

  it("picks the games' modes from the level, not from the id", () => {
    expect(gameModesFor("listen")).toEqual({ quiz: "listen", match: "pictures" });
    expect(gameModesFor("read")).toEqual({ quiz: "read", match: "words" });
  });
});

describe("what a promoted profile can earn", () => {
  const promoted: KidLevels = { listener: { level: "read", at: T } };

  it("earns the read activities once promoted", () => {
    const earned = activitiesForKid(undefined, "listener", promoted);
    expect(earned).toContain("quiz-read");
    expect(earned).toContain("match-words");
    expect(earned).not.toContain("quiz-listen");
  });

  it("earns exactly what the other reader earns", () => {
    expect(activitiesForKid(undefined, "listener", promoted)).toEqual(
      activitiesForKid(undefined, "reader"),
    );
  });

  it("keeps sharing the activities that belong to no level", () => {
    expect(activitiesForKid(undefined, "listener", promoted)).toContain("learn");
  });

  it("still honours a deck's skipped games", () => {
    const deck = {
      id: "d", nameSpanish: "d", nameEnglish: "d", emoji: "🧪", cards: [],
      skipActivities: ["si-no-listen", "si-no-read"] as const,
    };
    expect(earnableActivities(deck, "listener", promoted)).not.toContain("si-no-read");
  });
});

describe("the twin rule — a listen sticker satisfies its read counterpart", () => {
  it("pairs each mode-specific activity with its opposite", () => {
    expect(twinActivity("quiz-listen")).toBe("quiz-read");
    expect(twinActivity("quiz-read")).toBe("quiz-listen");
    expect(twinActivity("match-pictures")).toBe("match-words");
    expect(twinActivity("match-words")).toBe("match-pictures");
    expect(twinActivity("si-no-listen")).toBe("si-no-read");
    expect(twinActivity("connect-read")).toBe("connect-listen");
    expect(twinActivity("scene-listen")).toBe("scene-read");
  });

  it("has no twin for an activity that belongs to no level", () => {
    expect(twinActivity("learn")).toBeNull();
  });

  it("is its own inverse, so the rule reads the same in both directions", () => {
    for (const a of [
      "quiz-listen", "quiz-read", "si-no-listen", "si-no-read",
      "match-pictures", "match-words", "connect-listen", "connect-read",
      "scene-listen", "scene-read",
    ] as const) {
      expect(twinActivity(twinActivity(a)!)).toBe(a);
    }
  });
});

describe("a promotion costs her nothing", () => {
  // The whole promise of roadmap 18, pinned at the layer that decides it.
  const deck = {
    id: "animals", nameSpanish: "a", nameEnglish: "a", emoji: "🐶",
    cards: [],
  };
  const promoted: KidLevels = { listener: { level: "read", at: T } };
  const listenStickers = [
    "learn", "quiz-listen", "si-no-listen",
    "match-pictures", "connect-listen", "scene-listen",
  ].map((a) => `listener:animals:${a}`);
  const earned = new Set(listenStickers);
  const counts = Object.fromEntries(listenStickers.map((id) => [id, 3]));

  it("fills every read slot from its listen twin", () => {
    for (const activity of earnableActivities(deck, "listener", promoted)) {
      expect(
        stickerCount("listener", "animals", activity, counts, earned),
      ).toBeGreaterThan(0);
    }
  });

  it("keeps the deck complete — the step must not fall to 1 of 6", () => {
    // It did, in the first cut: the game menu and el camino both counted by
    // looking the sticker id up directly, which skips the twin rule.
    const activities = earnableActivities(deck, "listener", promoted);
    const done = activities.filter(
      (a) => stickerCount("listener", "animals", a, counts, earned) > 0,
    ).length;
    expect(done).toBe(activities.length);
  });

  it("keeps the medal it had", () => {
    expect(
      categoryTierFromAlbum("listener", "animals", ALL_ACTIVITIES, counts, earned, promoted),
    ).toBe(
      categoryTierFromAlbum("listener", "animals", ALL_ACTIVITIES, counts, earned),
    );
  });

  it("never lets the depth drop when the new level's sticker is first earned", () => {
    // Her listen count is 3; the read sticker starts at 1. `max` keeps the
    // medal where it was rather than demoting it mid-transition.
    const withRead = new Set([...earned, "listener:animals:quiz-read"]);
    const bothCounts = { ...counts, "listener:animals:quiz-read": 1 };
    expect(
      stickerCount("listener", "animals", "quiz-read", bothCounts, withRead),
    ).toBe(3);
  });
});

describe("the level on the wire", () => {
  it("takes the later change, whichever device it came from", () => {
    const early = withLevel("listener", "listen", T);
    const late = withLevel("listener", "read", T + 1000);
    expect(mergeProgress(early, late).levels?.listener?.level).toBe("read");
    // Order-independent: the same answer whichever device syncs first.
    expect(mergeProgress(late, early).levels?.listener?.level).toBe("read");
  });

  it("carries a demotion as readily as a promotion", () => {
    const up = withLevel("listener", "read", T);
    const down = withLevel("listener", "listen", T + 5);
    expect(mergeProgress(up, down).levels?.listener?.level).toBe("listen");
    expect(mergeProgress(down, up).levels?.listener?.level).toBe("listen");
  });

  it("breaks an exact tie the same way from both sides", () => {
    // Near-impossible with millisecond stamps, but the tie-break has to be
    // commutative or the merge stops being order-independent.
    const a = withLevel("listener", "listen", T);
    const b = withLevel("listener", "read", T);
    expect(mergeProgress(a, b).levels?.listener).toEqual(
      mergeProgress(b, a).levels?.listener,
    );
  });

  it("keeps each profile's level apart", () => {
    const merged = mergeProgress(
      withLevel("listener", "read", T),
      withLevel("reader", "listen", T),
    );
    expect(merged.levels?.listener?.level).toBe("read");
    expect(merged.levels?.reader?.level).toBe("listen");
  });

  it("leaves a pre-level snapshot with no levels key at all", () => {
    expect(sanitizeSnapshot({ stickers: [], streaks: {}, avatars: {} }).levels)
      .toBeUndefined();
  });

  it("drops a level it has never heard of", () => {
    const raw = {
      ...base,
      levels: { listener: { level: "expert", at: T } },
    };
    expect(sanitizeSnapshot(raw).levels?.listener).toBeUndefined();
  });

  it("drops a timestamp that is not a sane number", () => {
    const raw = { ...base, levels: { listener: { level: "read", at: "now" } } };
    expect(sanitizeSnapshot(raw).levels?.listener).toBeUndefined();
  });
});
