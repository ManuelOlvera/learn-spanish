import { describe, expect, it } from "vitest";
import { earnedStars, MEAL_COST, MISSION_BONUS } from "../src/domain/stars";
import {
  activityKind,
  dailyMission,
  markMissionDone,
  missionComplete,
  type MissionState,
} from "../src/domain/mission";
import { stickerTier, TIER_THRESHOLDS } from "../src/domain/sticker-tiers";
import { feedPet, isPetHungry, petStage, type PetState } from "../src/domain/mascota";
import { AwardStickerUseCase } from "../src/application/award-sticker";
import type { AlbumStore, StickerCountsStore } from "../src/domain/album";
import { decodeProgress, encodeProgress, mergeProgress } from "../src/domain/transfer";

describe("earnedStars", () => {
  it("pays one star per first-try answer, minimum one for finishing", () => {
    expect(earnedStars(6)).toBe(6);
    expect(earnedStars(0)).toBe(1);
  });

  it("prices meals and the mission bonus", () => {
    expect(MEAL_COST).toBe(5);
    expect(MISSION_BONUS).toBe(10);
  });
});

describe("dailyMission", () => {
  it("gives 3 distinct tasks, stable all day, different per kid", () => {
    const a1 = dailyMission(new Date("2026-07-11T08:00:00Z"), "listener");
    const a2 = dailyMission(new Date("2026-07-11T21:00:00Z"), "listener");
    expect(a1).toEqual(a2);
    expect(new Set(a1).size).toBe(3);
    const days = new Set<string>();
    for (let d = 1; d <= 10; d++) {
      days.add(
        dailyMission(new Date(`2026-07-${String(d).padStart(2, "0")}T09:00:00Z`), "listener").join(","),
      );
    }
    expect(days.size).toBeGreaterThan(3); // varies day to day
  });

  it("maps activities to mission kinds", () => {
    expect(activityKind("quiz-listen")).toBe("quiz");
    expect(activityKind("si-no-read")).toBe("si-no");
    expect(activityKind("match-pictures")).toBe("match");
    expect(activityKind("frases-read")).toBe("frases");
    expect(activityKind("learn")).toBe("learn");
  });

  it("tracks progress within a day and resets across days", () => {
    let state: MissionState | null = null;
    state = markMissionDone(state, "2026-07-11", "quiz");
    state = markMissionDone(state, "2026-07-11", "quiz");
    state = markMissionDone(state, "2026-07-11", "scene");
    expect(state.done).toEqual(["quiz", "scene"]);
    state = markMissionDone(state, "2026-07-12", "match");
    expect(state.done).toEqual(["match"]);
    expect(state.claimed).toBe(false);
  });

  it("completes only when every mission task is done", () => {
    const mission = ["quiz", "scene", "duel"] as const;
    const partial: MissionState = { day: "2026-07-11", done: ["quiz", "scene"], claimed: false };
    const full: MissionState = { day: "2026-07-11", done: ["duel", "quiz", "scene"], claimed: false };
    expect(missionComplete(partial, mission)).toBe(false);
    expect(missionComplete(full, mission)).toBe(true);
  });
});

describe("sticker tiers", () => {
  it("upgrades at 1, 3, and 5 completions", () => {
    expect(TIER_THRESHOLDS).toEqual({ silver: 3, gold: 5 });
    expect(stickerTier(0)).toBe("none");
    expect(stickerTier(1)).toBe("earned");
    expect(stickerTier(3)).toBe("silver");
    expect(stickerTier(5)).toBe("gold");
    expect(stickerTier(9)).toBe("gold");
  });
});

class FakeAlbum implements AlbumStore {
  constructor(public stickers: readonly string[] = []) {}
  load() {
    return Promise.resolve(this.stickers);
  }
  save(s: readonly string[]) {
    this.stickers = s;
    return Promise.resolve();
  }
}

class FakeCounts implements StickerCountsStore {
  constructor(public counts: Record<string, number> = {}) {}
  load() {
    return Promise.resolve({ ...this.counts });
  }
  save(c: Readonly<Record<string, number>>) {
    this.counts = { ...c };
    return Promise.resolve();
  }
}

describe("AwardStickerUseCase with tiers", () => {
  it("counts completions and reports tier-ups", async () => {
    const award = new AwardStickerUseCase(new FakeAlbum(), new FakeCounts());
    const first = await award.execute("listener", "animals", "learn");
    expect(first).toMatchObject({ isNew: true, count: 1, tier: "earned", tierUp: true });
    const second = await award.execute("listener", "animals", "learn");
    expect(second).toMatchObject({ isNew: false, count: 2, tier: "earned", tierUp: false });
    const third = await award.execute("listener", "animals", "learn");
    expect(third).toMatchObject({ count: 3, tier: "silver", tierUp: true });
  });

  it("treats legacy stickers without counts as one completion", async () => {
    const award = new AwardStickerUseCase(
      new FakeAlbum(["listener:animals:learn"]),
      new FakeCounts({}),
    );
    const result = await award.execute("listener", "animals", "learn");
    expect(result).toMatchObject({ isNew: false, count: 2, tier: "earned" });
  });
});

describe("mascota", () => {
  it("hatches and grows with meals", () => {
    expect(petStage(0)).toBe(0);
    expect(petStage(3)).toBe(1);
    expect(petStage(8)).toBe(2);
    expect(petStage(15)).toBe(3);
  });

  it("feeding adds a meal and remembers the day", () => {
    const fed = feedPet(null, "2026-07-11");
    expect(fed).toEqual({ meals: 1, lastFed: "2026-07-11" });
    expect(feedPet(fed, "2026-07-12").meals).toBe(2);
  });

  it("feeding never strips the wardrobe (accessories survive growth)", () => {
    const dressed: PetState = {
      meals: 2,
      lastFed: "2026-07-10",
      accessories: ["gorro", "gafas"],
      worn: ["gorro"],
    };
    const fed = feedPet(dressed, "2026-07-11");
    expect(fed.meals).toBe(3);
    expect(fed.accessories).toEqual(["gorro", "gafas"]);
    expect(fed.worn).toEqual(["gorro"]);
  });

  it("gets hungry after two days without food, never before", () => {
    const pet: PetState = { meals: 4, lastFed: "2026-07-10" };
    expect(isPetHungry(pet, "2026-07-11")).toBe(false);
    expect(isPetHungry(pet, "2026-07-12")).toBe(true);
    expect(isPetHungry({ meals: 0, lastFed: null }, "2026-07-12")).toBe(false);
  });
});

describe("economy travels in transfer codes", () => {
  it("round-trips and max-merges stars, counts, and pets", () => {
    const a = {
      stickers: [], streaks: {}, avatars: {},
      stars: { listener: 12 },
      stickerCounts: { "listener:animals:learn": 4 },
      pets: { listener: { meals: 5, lastFed: "2026-07-10" } },
    };
    const b = {
      stickers: [], streaks: {}, avatars: {},
      stars: { listener: 8, reader: 3 },
      stickerCounts: { "listener:animals:learn": 2, "reader:zoo:learn": 1 },
      pets: { listener: { meals: 7, lastFed: "2026-07-09" } },
    };
    expect(decodeProgress(encodeProgress(a))).toEqual(a);
    const merged = mergeProgress(a, b);
    expect(merged.stars).toEqual({ listener: 12, reader: 3 });
    expect(merged.stickerCounts).toEqual({
      "listener:animals:learn": 4,
      "reader:zoo:learn": 1,
    });
    expect(merged.pets?.listener).toEqual({ meals: 7, lastFed: "2026-07-10" });
  });

  it("carries the pet's wardrobe (owned + worn) across a transfer", () => {
    const a = {
      stickers: [], streaks: {}, avatars: {},
      pets: {
        listener: {
          meals: 5,
          lastFed: "2026-07-10",
          accessories: ["gorro", "gafas"],
          worn: ["gorro"],
        },
      },
    };
    expect(decodeProgress(encodeProgress(a))).toEqual(a);
    const b = {
      stickers: [], streaks: {}, avatars: {},
      pets: {
        listener: { meals: 3, lastFed: "2026-07-08", accessories: ["corona"], worn: ["corona"] },
      },
    };
    const merged = mergeProgress(a, b);
    // Owned unions; worn keeps what the receiving device had on.
    expect(merged.pets?.listener?.accessories).toEqual(["gorro", "gafas", "corona"]);
    expect(merged.pets?.listener?.worn).toEqual(["gorro"]);
  });

  it("unions kid-level owned accessories across a transfer", () => {
    const a = { stickers: [], streaks: {}, avatars: {},
      ownedAccessories: { listener: ["corona", "gafas"] } };
    const b = { stickers: [], streaks: {}, avatars: {},
      ownedAccessories: { listener: ["gafas", "varita"], reader: ["flor"] } };
    expect(decodeProgress(encodeProgress(a)).ownedAccessories?.listener).toEqual([
      "corona",
      "gafas",
    ]);
    const merged = mergeProgress(a, b);
    expect(merged.ownedAccessories?.listener).toEqual(["corona", "gafas", "varita"]);
    expect(merged.ownedAccessories?.reader).toEqual(["flor"]);
  });
});
