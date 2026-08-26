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
 * streak), el camino (a route, always drawn), and **la misión del día**.
 *
 * La misión is the same shape of mistake la carta would have been. It was in
 * the rotation once, ranked last, and that made it unreachable: every card
 * above it except the 🎁 gift *keeps* — stuck words stay stuck until they are
 * reviewed, and papá's challenge stays pending until that one deck is played —
 * while la misión resets at midnight and is gone. A kid with three stuck words
 * simply never saw it. It is also the only one of the six with nowhere else to
 * live (el repaso is reachable from el camino, the challenge from its deck),
 * so being hidden meant being lost. It is drawn on its own now, and leaves the
 * screen only when it is finished — see `missionOnHome`.
 */
export type HomeFocus =
  | "gift"
  | "challenge-claim"
  | "challenge"
  | "repaso"
  | null;

export interface HomeFocusInput {
  /** Today's free 🎁 is still unopened. */
  readonly giftReady: boolean;
  /** Papá set a challenge that is not finished yet. */
  readonly challengePending: boolean;
  /** …or one that is finished and still owes its chest. */
  readonly challengeClaimable: boolean;
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
  // Then the pointers, a person's ahead of the app's.
  if (input.challengePending) {
    return "challenge";
  }
  return input.repasoReady ? "repaso" : null;
}
