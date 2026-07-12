import { describe, expect, it } from "vitest";
import {
  ACTIVE_WEEK_DAYS,
  FREEZE_COST,
  markActiveDay,
  rollWeek,
  STARTING_FREEZES,
  weekActiveDayCount,
  weekIsActive,
  weekKey,
} from "../src/domain/weekly";
import type { WeekProgress, WeeklyStreak } from "../src/domain/weekly";

describe("weekKey", () => {
  it("returns the Monday (UTC) of the week", () => {
    // 2026-07-13 is a Monday; the whole week maps to it.
    expect(weekKey(new Date("2026-07-13T00:00:00Z"))).toBe("2026-07-13");
    expect(weekKey(new Date("2026-07-15T12:00:00Z"))).toBe("2026-07-13");
    expect(weekKey(new Date("2026-07-19T23:59:00Z"))).toBe("2026-07-13"); // Sunday
  });

  it("rolls to the previous Monday just before midnight UTC Sunday", () => {
    expect(weekKey(new Date("2026-07-12T23:59:00Z"))).toBe("2026-07-06");
  });

  it("handles a week that spans a year boundary", () => {
    expect(weekKey(new Date("2026-01-01T00:00:00Z"))).toBe("2025-12-29");
  });
});

describe("markActiveDay", () => {
  const week = "2026-07-13";

  it("starts a fresh week when there is no progress", () => {
    expect(markActiveDay(null, week, "2026-07-13")).toEqual({
      week,
      days: ["2026-07-13"],
    });
  });

  it("adds distinct days within the same week", () => {
    const p = markActiveDay(markActiveDay(null, week, "2026-07-13"), week, "2026-07-14");
    expect(p.days).toEqual(["2026-07-13", "2026-07-14"]);
  });

  it("is idempotent for the same day", () => {
    const once = markActiveDay(null, week, "2026-07-13");
    expect(markActiveDay(once, week, "2026-07-13")).toEqual(once);
  });

  it("resets the day set when a new week begins", () => {
    const lastWeek: WeekProgress = { week: "2026-07-06", days: ["2026-07-06", "2026-07-07"] };
    expect(markActiveDay(lastWeek, week, "2026-07-13")).toEqual({
      week,
      days: ["2026-07-13"],
    });
  });
});

describe("weekIsActive", () => {
  const week = "2026-07-13";

  it("needs ACTIVE_WEEK_DAYS distinct active days", () => {
    let p: WeekProgress | null = null;
    for (let d = 13; d < 13 + ACTIVE_WEEK_DAYS - 1; d++) {
      p = markActiveDay(p, week, `2026-07-${d}`);
    }
    expect(weekIsActive(p, week)).toBe(false);
    p = markActiveDay(p, week, `2026-07-${13 + ACTIVE_WEEK_DAYS - 1}`);
    expect(weekIsActive(p, week)).toBe(true);
    expect(weekActiveDayCount(p, week)).toBe(ACTIVE_WEEK_DAYS);
  });

  it("ignores progress from another week", () => {
    const stale: WeekProgress = {
      week: "2026-07-06",
      days: ["2026-07-06", "2026-07-07", "2026-07-08"],
    };
    expect(weekIsActive(stale, week)).toBe(false);
    expect(weekActiveDayCount(stale, week)).toBe(0);
  });
});

describe("rollWeek", () => {
  const active: WeekProgress = {
    week: "2026-07-06",
    days: ["2026-07-06", "2026-07-07", "2026-07-08"],
  };
  const inactive: WeekProgress = { week: "2026-07-06", days: ["2026-07-06"] };

  it("seeds a baseline on first ever load without touching freezes", () => {
    const r = rollWeek(null, STARTING_FREEZES, null, "2026-07-13");
    expect(r).toEqual({
      streak: { week: "2026-07-13", count: 0 },
      freezes: STARTING_FREEZES,
      outcome: "none",
    });
  });

  it("does nothing when still inside the evaluated week", () => {
    const streak: WeeklyStreak = { week: "2026-07-13", count: 2 };
    expect(rollWeek(streak, 1, active, "2026-07-13")).toEqual({
      streak,
      freezes: 1,
      outcome: "none",
    });
  });

  it("increments the streak when the finished week was active", () => {
    const streak: WeeklyStreak = { week: "2026-07-06", count: 2 };
    expect(rollWeek(streak, 3, active, "2026-07-13")).toEqual({
      streak: { week: "2026-07-13", count: 3 },
      freezes: 3,
      outcome: "increased",
    });
  });

  it("spends a freeze to hold the streak on an inactive week", () => {
    const streak: WeeklyStreak = { week: "2026-07-06", count: 4 };
    expect(rollWeek(streak, 3, inactive, "2026-07-13")).toEqual({
      streak: { week: "2026-07-13", count: 4 },
      freezes: 2,
      outcome: "frozen",
    });
  });

  it("resets the streak on an inactive week with no freezes left", () => {
    const streak: WeeklyStreak = { week: "2026-07-06", count: 4 };
    expect(rollWeek(streak, 0, inactive, "2026-07-13")).toEqual({
      streak: { week: "2026-07-13", count: 0 },
      freezes: 0,
      outcome: "reset",
    });
  });

  it("never spends a freeze or resets when there is no streak to protect", () => {
    const streak: WeeklyStreak = { week: "2026-07-06", count: 0 };
    expect(rollWeek(streak, 3, inactive, "2026-07-13")).toEqual({
      streak: { week: "2026-07-13", count: 0 },
      freezes: 3,
      outcome: "none",
    });
  });

  it("judges every skipped week, not just the last one", () => {
    // Active week credited (+1), then two idle weeks: one freeze, one reset.
    const streak: WeeklyStreak = { week: "2026-06-29", count: 5 };
    // progress only exists for the week right after the baseline (active).
    const prog: WeekProgress = {
      week: "2026-07-06",
      days: ["2026-07-06", "2026-07-07", "2026-07-08"],
    };
    const r = rollWeek(streak, 1, prog, "2026-07-27");
    // 07-06 active → 6; 07-13 idle → freeze (0 left); 07-20 idle → reset.
    expect(r.streak).toEqual({ week: "2026-07-27", count: 0 });
    expect(r.freezes).toBe(0);
    expect(r.outcome).toBe("reset");
  });

  it("exposes a positive freeze cost", () => {
    expect(FREEZE_COST).toBeGreaterThan(0);
  });
});
