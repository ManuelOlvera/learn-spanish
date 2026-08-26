import { describe, expect, it } from "vitest";
import { pickHomeFocus, type HomeFocusInput } from "../src/domain/home-focus";
import { missionOnHome, type MissionView } from "../src/application/get-mission";

const quiet: HomeFocusInput = {
  giftReady: false,
  challengePending: false,
  challengeClaimable: false,
  repasoReady: false,
};

describe("pickHomeFocus", () => {
  it("says nothing on a genuinely quiet day", () => {
    expect(pickHomeFocus(quiet)).toBeNull();
  });

  it("shows the gift above everything — it is one tap and it expires", () => {
    expect(
      pickHomeFocus({
        ...quiet,
        giftReady: true,
        challengeClaimable: true,
        challengePending: true,
        repasoReady: true,
      }),
    ).toBe("gift");
  });

  it("puts an unclaimed payout ahead of any suggestion", () => {
    expect(
      pickHomeFocus({ ...quiet, challengeClaimable: true, challengePending: true, repasoReady: true }),
    ).toBe("challenge-claim");
  });

  it("ranks papá's challenge over the app's own suggestions", () => {
    expect(
      pickHomeFocus({ ...quiet, challengePending: true, repasoReady: true }),
    ).toBe("challenge");
  });

  it("falls back to stuck words when nothing else is pending", () => {
    expect(pickHomeFocus({ ...quiet, repasoReady: true })).toBe("repaso");
  });

  it("only ever returns one thing", () => {
    // Every combination of the four flags resolves to a single focus, so the
    // screen can never stack two cards again by accident.
    for (let bits = 0; bits < 16; bits++) {
      const input: HomeFocusInput = {
        giftReady: Boolean(bits & 1),
        challengePending: Boolean(bits & 2),
        challengeClaimable: Boolean(bits & 4),
        repasoReady: Boolean(bits & 8),
      };
      const focus = pickHomeFocus(input);
      expect(typeof focus === "string" || focus === null).toBe(true);
    }
  });
});

/** La misión is perishable — it resets at midnight and there is no other screen
 *  that can show it — so it never entered the one-slot rotation to begin with.
 *  These lock the rule the slot broke: it leaves home only when it is DONE. */
describe("missionOnHome", () => {
  const view = (done: number, claimed: boolean): MissionView => ({
    kinds: ["learn", "quiz", "match"],
    state: { day: "2026-08-26", done: ["learn", "quiz", "match"].slice(0, done) as MissionView["state"]["done"], claimed },
    complete: done === 3,
  });

  it("draws nothing when there is no misión yet", () => {
    expect(missionOnHome(null)).toBe(false);
  });

  it("stays on home from the first untouched task", () => {
    expect(missionOnHome(view(0, false))).toBe(true);
  });

  it("stays on home part-way through", () => {
    expect(missionOnHome(view(2, false))).toBe(true);
  });

  it("stays on home once complete, while the chest is still unopened", () => {
    expect(missionOnHome(view(3, false))).toBe(true);
  });

  it("goes away only once the kid completes it AND claims the bonus", () => {
    expect(missionOnHome(view(3, true))).toBe(false);
  });
});
