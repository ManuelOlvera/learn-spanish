/**
 * El reto de papá — a challenge a parent sets from `/informe`, aimed at a deck
 * the kid is actually struggling with, and shown on that kid's home screen.
 *
 * The point is not the mechanic: at 3–8 a parent's attention outweighs every
 * star in the app, and until now `/informe` was read-only — the report knew
 * exactly which decks were going badly and had no way to say so to the kid.
 *
 * Deliberately **device-local**. A challenge is mutable state with a lifecycle
 * (set → done → claimed → replaced), which is the one shape ADR 004's additive
 * merge cannot carry — the same reason ADR 014 kept the ⚡ boost off the
 * snapshot. Making it cross-device is a decision, not a field.
 */

/** Richer than the daily misión's bonus: this one was set by a person. */
export const CHALLENGE_BONUS = 15;

export interface ParentChallenge {
  readonly deckId: string;
  readonly done: boolean;
  readonly claimed: boolean;
}

/** Set (or replace) the challenge. One per kid at a time — a second one is a
 *  new instruction, not a queue, so the old one simply goes. */
export function setChallenge(deckId: string): ParentChallenge {
  return { deckId, done: false, claimed: false };
}

/**
 * Fold a finished activity into the challenge. *Any* activity on the deck
 * counts — the aim is to get the kid back into that deck at all, and a
 * pre-reader cannot be asked to find one particular game.
 */
export function recordChallengeActivity(
  challenge: ParentChallenge | null,
  deckId: string,
): ParentChallenge | null {
  if (challenge === null || challenge.done || challenge.deckId !== deckId) {
    return challenge;
  }
  return { ...challenge, done: true };
}

export function challengeClaimable(
  challenge: ParentChallenge | null,
): challenge is ParentChallenge {
  return challenge !== null && challenge.done && !challenge.claimed;
}

/** The claimed challenge, or null when there is nothing to pay. */
export function claimChallenge(
  challenge: ParentChallenge | null,
): ParentChallenge | null {
  return challengeClaimable(challenge) ? { ...challenge, claimed: true } : null;
}

export function isParentChallenge(value: unknown): value is ParentChallenge {
  const c = value as ParentChallenge | null;
  return (
    typeof c === "object" &&
    c !== null &&
    typeof c.deckId === "string" &&
    c.deckId !== "" &&
    typeof c.done === "boolean" &&
    typeof c.claimed === "boolean"
  );
}
