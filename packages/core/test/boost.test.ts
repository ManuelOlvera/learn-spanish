import { describe, expect, it } from "vitest";
import {
  activeBoost,
  boostRemaining,
  boostedReward,
  BOOST_MINUTES,
  isBoost,
  stackBoost,
  startBoost,
  type Boost,
} from "../src/domain/boost";
import { computeReward } from "../src/domain/stars";

const NOW = new Date("2026-08-11T10:00:00");
const minutes = (n: number) => new Date(NOW.getTime() + n * 60_000);

describe("boost — the window", () => {
  it("starts a window of the tier's own length", () => {
    expect(startBoost(2, NOW)).toEqual({
      tier: 2,
      until: NOW.getTime() + BOOST_MINUTES[2] * 60_000,
    });
    // x3 is the rarer, shorter window.
    expect(BOOST_MINUTES[3]).toBeLessThan(BOOST_MINUTES[2]);
  });

  it("is active inside the window and gone after it", () => {
    const boost = startBoost(2, NOW);
    expect(activeBoost(boost, NOW)).toEqual(boost);
    expect(activeBoost(boost, minutes(BOOST_MINUTES[2] - 1))).toEqual(boost);
    expect(activeBoost(boost, minutes(BOOST_MINUTES[2] + 1))).toBeNull();
  });

  it("has no boost when nothing was ever won", () => {
    expect(activeBoost(null, NOW)).toBeNull();
  });

  it("drains from full to empty across the window, then stays empty", () => {
    const boost = startBoost(2, NOW);
    expect(boostRemaining(boost, NOW)).toBe(1);
    expect(boostRemaining(boost, minutes(BOOST_MINUTES[2] / 2))).toBeCloseTo(0.5);
    // Clamped: an expired (or absent) boost never draws a negative bar.
    expect(boostRemaining(boost, minutes(BOOST_MINUTES[2] * 2))).toBe(0);
    expect(boostRemaining(null, NOW)).toBe(0);
  });

  it("clamps a stacked window at a full bar", () => {
    const stacked = stackBoost(startBoost(2, NOW), 2, NOW);
    expect(boostRemaining(stacked, NOW)).toBe(1);
  });
});

describe("boost — winning one while another runs", () => {
  it("winning with nothing active simply starts the window", () => {
    expect(stackBoost(null, 3, NOW)).toEqual(startBoost(3, NOW));
  });

  it("winning the same tier again adds its minutes to what is left", () => {
    const running = startBoost(2, NOW);
    const next = stackBoost(running, 2, minutes(5));
    expect(next.tier).toBe(2);
    expect(next.until).toBe(running.until + BOOST_MINUTES[2] * 60_000);
  });

  it("a better tier takes over, and never for less time than it replaced", () => {
    const running = startBoost(2, NOW); // 15 minutes of x2, just started
    const next = stackBoost(running, 3, NOW); // x3 is only a 10-minute window
    expect(next.tier).toBe(3);
    expect(next.until).toBe(running.until);
  });

  it("never downgrades: a weaker win only adds time", () => {
    const running = startBoost(3, NOW);
    const next = stackBoost(running, 2, minutes(2));
    expect(next.tier).toBe(3);
    expect(next.until).toBe(running.until + BOOST_MINUTES[2] * 60_000);
  });

  it("winning after the window closed starts fresh, not from the old end", () => {
    const expired = startBoost(3, NOW);
    const later = minutes(BOOST_MINUTES[3] + 30);
    expect(stackBoost(expired, 2, later)).toEqual(startBoost(2, later));
  });
});

describe("boost — what it pays", () => {
  const reward = computeReward({
    firstTryCorrect: 4,
    totalRounds: 4,
    streakDays: 7,
    firstTime: true,
  });

  it("multiplies the whole chest, bonuses included", () => {
    const doubled = boostedReward(reward, 2);
    expect(doubled.base).toBe(reward.base * 2);
    expect(doubled.perfect).toBe(reward.perfect * 2);
    expect(doubled.streak).toBe(reward.streak * 2);
    expect(doubled.firstTime).toBe(reward.firstTime * 2);
    expect(doubled.total).toBe(reward.total * 2);
    expect(boostedReward(reward, 3).total).toBe(reward.total * 3);
  });

  it("pays the plain chest with no boost", () => {
    expect(boostedReward(reward, null)).toEqual(reward);
  });
});

describe("boost — stored shape", () => {
  it("accepts a well-formed boost", () => {
    expect(isBoost({ tier: 2, until: NOW.getTime() } satisfies Boost)).toBe(true);
    expect(isBoost({ tier: 3, until: NOW.getTime() })).toBe(true);
  });

  it("rejects anything else — a corrupt document reads as no boost", () => {
    // x10 forever is exactly what a hand-edited localStorage would try.
    expect(isBoost({ tier: 10, until: NOW.getTime() })).toBe(false);
    expect(isBoost({ tier: 2, until: "soon" })).toBe(false);
    expect(isBoost({ tier: 2 })).toBe(false);
    expect(isBoost(null)).toBe(false);
    expect(isBoost("x2")).toBe(false);
  });
});
