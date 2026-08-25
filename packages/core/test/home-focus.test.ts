import { describe, expect, it } from "vitest";
import { pickHomeFocus, type HomeFocusInput } from "../src/domain/home-focus";

const quiet: HomeFocusInput = {
  giftReady: false,
  challengePending: false,
  challengeClaimable: false,
  missionClaimable: false,
  missionPending: false,
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
        missionClaimable: true,
        challengePending: true,
        repasoReady: true,
        missionPending: true,
      }),
    ).toBe("gift");
  });

  it("puts an unclaimed payout ahead of any suggestion", () => {
    expect(
      pickHomeFocus({ ...quiet, challengeClaimable: true, challengePending: true, repasoReady: true }),
    ).toBe("challenge-claim");
    expect(pickHomeFocus({ ...quiet, missionClaimable: true, repasoReady: true })).toBe(
      "mission-claim",
    );
  });

  it("ranks papá's challenge over the app's own suggestions", () => {
    expect(
      pickHomeFocus({ ...quiet, challengePending: true, repasoReady: true, missionPending: true }),
    ).toBe("challenge");
  });

  it("ranks stuck words over the daily misión", () => {
    expect(pickHomeFocus({ ...quiet, repasoReady: true, missionPending: true })).toBe("repaso");
  });

  it("falls back to the misión when nothing else is pending", () => {
    expect(pickHomeFocus({ ...quiet, missionPending: true })).toBe("mission");
  });

  it("prefers a claimable challenge to a claimable misión", () => {
    expect(
      pickHomeFocus({ ...quiet, challengeClaimable: true, missionClaimable: true }),
    ).toBe("challenge-claim");
  });

  it("only ever returns one thing", () => {
    // Every combination of the six flags resolves to a single focus, so the
    // screen can never stack two cards again by accident.
    for (let bits = 0; bits < 64; bits++) {
      const input: HomeFocusInput = {
        giftReady: Boolean(bits & 1),
        challengePending: Boolean(bits & 2),
        challengeClaimable: Boolean(bits & 4),
        missionClaimable: Boolean(bits & 8),
        missionPending: Boolean(bits & 16),
        repasoReady: Boolean(bits & 32),
      };
      const focus = pickHomeFocus(input);
      expect(typeof focus === "string" || focus === null).toBe(true);
    }
  });
});
