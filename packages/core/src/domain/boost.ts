import type { StarReward } from "./stars";

/* ⚡ La hora doble: a short wall-clock window in which every treasure chest
 * pays a multiple of its stars. It is always WON, never bought — the free 🎁
 * regalo del día rolls x2, la caja sorpresa can also roll the rarer x3.
 *
 * Deliberately NOT synced (see EconomyStore.loadBoost): an expiring timestamp
 * merges badly under ADR 004's additive max-merge — a stale peer would
 * resurrect a dead window, and a live one would end early — while the stars it
 * produces ride the wallet counters that do sync. Same call as the daily gift. */

/** How much a chest is multiplied by. Only these two exist. */
export type BoostTier = 2 | 3;

/** How long a won window lasts, in minutes. x3 is the rarer prize, so it runs
 *  shorter — a triple hour would dwarf everything else the economy pays out. */
export const BOOST_MINUTES: Readonly<Record<BoostTier, number>> = {
  2: 15,
  3: 10,
};

/** A won window: the multiplier, and the epoch-ms instant it stops paying. */
export interface Boost {
  readonly tier: BoostTier;
  /** Epoch milliseconds — the clock is always passed in, never read here. */
  readonly until: number;
}

function windowMs(tier: BoostTier): number {
  return BOOST_MINUTES[tier] * 60_000;
}

/** Open a fresh window of `tier`, starting now. */
export function startBoost(tier: BoostTier, now: Date): Boost {
  return { tier, until: now.getTime() + windowMs(tier) };
}

/** The boost that is actually paying right now — null once it has run out, so
 *  every caller reads "is there a boost" the same way and expiry needs no
 *  cleanup write. */
export function activeBoost(stored: Boost | null, now: Date): Boost | null {
  return stored !== null && stored.until > now.getTime() ? stored : null;
}

/** How full the window is, 0–1 — the whole state the home badge's draining bar
 *  needs (pre-readers can't read a countdown, but they can see a bar shrink).
 *  Clamped both ends: stacked windows show full, dead ones show empty. */
export function boostRemaining(stored: Boost | null, now: Date): number {
  const active = activeBoost(stored, now);
  if (active === null) {
    return 0;
  }
  const left = active.until - now.getTime();
  return Math.min(1, left / windowMs(active.tier));
}

/** Apply a win to whatever is already running. One rule, three cases — and a
 *  win is never a loss: the multiplier only ever goes up, the window only ever
 *  gets longer. */
export function stackBoost(
  current: Boost | null,
  tier: BoostTier,
  now: Date,
): Boost {
  const active = activeBoost(current, now);
  if (active === null) {
    return startBoost(tier, now);
  }
  if (tier > active.tier) {
    // Upgrade: the better multiplier takes over — but x3's window is shorter
    // than x2's, so it never cuts the running window short.
    return { tier, until: Math.max(active.until, now.getTime() + windowMs(tier)) };
  }
  // Same or weaker: the running multiplier stands, and the win shows up as
  // more time. Winning x2 during x3 buys minutes, never a downgrade.
  return { tier: active.tier, until: active.until + windowMs(tier) };
}

/** The chest under a boost: every part multiplies, bonuses included, so the
 *  breakdown on the done screen still adds up to the total the kid is paid. */
export function boostedReward(
  reward: StarReward,
  tier: BoostTier | null,
): StarReward {
  if (tier === null) {
    return reward;
  }
  return {
    base: reward.base * tier,
    perfect: reward.perfect * tier,
    streak: reward.streak * tier,
    firstTime: reward.firstTime * tier,
    total: reward.total * tier,
  };
}

export function isBoostTier(value: unknown): value is BoostTier {
  return value === 2 || value === 3;
}

/** Storage guard: a corrupt (or hand-edited) document must read as no boost,
 *  never as x10 until the heat death of the universe. */
export function isBoost(value: unknown): value is Boost {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<Boost>;
  return isBoostTier(candidate.tier) && typeof candidate.until === "number";
}
