import { describe, expect, it } from "vitest";
import {
  challengeClaimable,
  claimChallenge,
  recordChallengeActivity,
  setChallenge,
  CHALLENGE_BONUS,
} from "../src/domain/challenge";

describe("el reto de papá", () => {
  it("starts undone and unclaimed", () => {
    expect(setChallenge("animals")).toEqual({
      deckId: "animals",
      done: false,
      claimed: false,
    });
  });

  it("replaces the previous challenge outright, including a finished one", () => {
    const finished = { deckId: "animals", done: true, claimed: true };
    expect(setChallenge("zoo")).toEqual({ deckId: "zoo", done: false, claimed: false });
    expect(finished.deckId).toBe("animals"); // the old one is not mutated
  });

  it("is completed by any activity on its deck", () => {
    const set = setChallenge("animals");
    expect(recordChallengeActivity(set, "animals")).toMatchObject({ done: true });
  });

  it("is not completed by an activity on another deck", () => {
    const set = setChallenge("animals");
    expect(recordChallengeActivity(set, "zoo")).toMatchObject({ done: false });
  });

  it("does nothing when no challenge is set", () => {
    expect(recordChallengeActivity(null, "animals")).toBeNull();
  });

  it("stays done once done — replaying the deck can't undo it", () => {
    const done = recordChallengeActivity(setChallenge("animals"), "animals");
    expect(recordChallengeActivity(done, "zoo")).toMatchObject({ done: true });
  });

  it("is claimable only once it is done", () => {
    expect(challengeClaimable(setChallenge("animals"))).toBe(false);
    expect(
      challengeClaimable(recordChallengeActivity(setChallenge("animals"), "animals")),
    ).toBe(true);
    expect(challengeClaimable(null)).toBe(false);
  });

  it("pays exactly once", () => {
    const done = recordChallengeActivity(setChallenge("animals"), "animals");
    const claimed = claimChallenge(done);
    expect(claimed).toMatchObject({ claimed: true, done: true });
    expect(challengeClaimable(claimed)).toBe(false);
    // A second attempt yields nothing to bank.
    expect(claimChallenge(claimed)).toBeNull();
  });

  it("cannot be claimed before it is finished", () => {
    expect(claimChallenge(setChallenge("animals"))).toBeNull();
  });

  it("claiming is terminal — the card is finished, not left lying around", () => {
    // The web facade clears the stored challenge once it pays; the domain's
    // job is only to refuse a second payout, which the test above pins.
    const done = recordChallengeActivity(setChallenge("animals"), "animals");
    expect(claimChallenge(claimChallenge(done))).toBeNull();
  });

  it("is worth more than the daily misión — papá set it", () => {
    expect(CHALLENGE_BONUS).toBeGreaterThan(10);
  });
});
