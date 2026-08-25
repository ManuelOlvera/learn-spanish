/**
 * What home says today.
 *
 * The screen used to render every card it could at once — gift, papá's
 * challenge, misión, weekly streak, repaso — which stacked up to eight bands
 * and pushed the first shelf tile below the fold on a phone. Eight things
 * shouting is the same as none to a pre-reader: she scrolls past all of it.
 *
 * So home shows exactly **one** of them, the most urgent, and the rest wait
 * their turn. The order is a claim-first rule: anything with stars sitting in
 * it outranks anything that is merely a suggestion, because an unclaimed
 * payout is the one thing a kid loses by not seeing.
 *
 * Deliberately NOT in here: la carta del día (it is Spanish content, not
 * chrome, and it feeds the ☀️ streak — hiding it on a busy day would break the
 * streak) and el camino (a route, always drawn).
 */
export type HomeFocus =
  | "gift"
  | "challenge-claim"
  | "mission-claim"
  | "challenge"
  | "repaso"
  | "mission"
  | null;

export interface HomeFocusInput {
  /** Today's free 🎁 is still unopened. */
  readonly giftReady: boolean;
  /** Papá set a challenge that is not finished yet. */
  readonly challengePending: boolean;
  /** …or one that is finished and still owes its chest. */
  readonly challengeClaimable: boolean;
  /** The daily misión's three tasks are all done, bonus unclaimed. */
  readonly missionClaimable: boolean;
  /** The misión exists and is still in progress. */
  readonly missionPending: boolean;
  /** Enough words are stuck to be worth a 🔁 pass. */
  readonly repasoReady: boolean;
}

/**
 * The single thing home should show, or null when there is nothing pending —
 * a genuinely quiet day, where the carta del día and the route are the screen.
 */
export function pickHomeFocus(input: HomeFocusInput): HomeFocus {
  // Claims first: stars already earned and not yet in the wallet.
  if (input.giftReady) {
    return "gift";
  }
  if (input.challengeClaimable) {
    return "challenge-claim";
  }
  if (input.missionClaimable) {
    return "mission-claim";
  }
  // Then the pointers, a person's ahead of the app's.
  if (input.challengePending) {
    return "challenge";
  }
  if (input.repasoReady) {
    return "repaso";
  }
  return input.missionPending ? "mission" : null;
}
