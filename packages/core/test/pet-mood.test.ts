import { describe, expect, it } from "vitest";
import { petMood, PET_MOODS, STREAK_PROUD_DAYS } from "../src/domain/mascota";
import type { PetState } from "../src/domain/mascota";

const TODAY = "2026-09-21";
const YESTERDAY = "2026-09-20";
const LAST_WEEK = "2026-09-14";

function pet(lastFed: string | null, meals = 4): PetState {
  return { meals, lastFed };
}

describe("how la mascota is feeling", () => {
  it("is hungry when it has not been fed for days — the state that already existed", () => {
    expect(petMood(pet(LAST_WEEK), TODAY, null)).toBe("hungry");
  });

  it("is happy the day it is fed", () => {
    expect(petMood(pet(TODAY), TODAY, null)).toBe("happy");
  });

  it("is content the day after — not hungry yet, not freshly fed", () => {
    expect(petMood(pet(YESTERDAY), TODAY, null)).toBe("content");
  });

  it("is proud when the kid is on a real streak", () => {
    // The streak is the kid's, not the pet's: a companion that reacts to how
    // the *kid* is doing is the whole point of the companion idea.
    expect(petMood(pet(TODAY), TODAY, { day: TODAY, count: STREAK_PROUD_DAYS })).toBe(
      "proud",
    );
  });

  it("needs the streak to be current, not a memory of one", () => {
    // A long streak that stopped days ago says nothing about today.
    expect(
      petMood(pet(TODAY), TODAY, { day: LAST_WEEK, count: 30 }),
    ).toBe("happy");
  });

  it("lets hunger outrank pride — a hungry pet is never proud", () => {
    // Hunger is the one mood that asks the kid to *do* something, so it must
    // never be masked by a good week.
    expect(
      petMood(pet(LAST_WEEK), TODAY, { day: TODAY, count: 30 }),
    ).toBe("hungry");
  });

  it("is content for an unhatched egg rather than hungry", () => {
    // `lastFed: null` is a pet that has never eaten, not one that has been
    // neglected — isPetHungry already draws that line and the mood follows it.
    expect(petMood(pet(null, 0), TODAY, null)).toBe("content");
  });

  it("handles no pet at all", () => {
    expect(petMood(null, TODAY, null)).toBe("content");
  });

  it("only ever returns a mood the app knows how to draw", () => {
    const cases = [
      petMood(pet(TODAY), TODAY, { day: TODAY, count: 99 }),
      petMood(pet(YESTERDAY), TODAY, null),
      petMood(pet(LAST_WEEK), TODAY, null),
      petMood(null, TODAY, null),
    ];
    for (const mood of cases) {
      expect(PET_MOODS).toContain(mood);
    }
  });
});
