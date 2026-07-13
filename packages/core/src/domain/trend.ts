import type { KidId } from "./kid";
import { weakScore } from "./word-stats";
import type { WordStat, WordStats } from "./word-stats";

/**
 * The parent report's trend line: one cumulative learned-words sample per
 * week, appended on-device. WordStats can only say "now"; this small append
 * log is what lets the informe say "esta semana". History is deliberately
 * device-local (not in ProgressSnapshot): stats sync, so every device can
 * grow its own equivalent history from them.
 */
export interface TrendSample {
  /** The weekKey (local Monday) the sample belongs to. */
  readonly week: string;
  /** Cumulative learned words as of the latest look in that week. */
  readonly learned: number;
}

export type TrendHistory = readonly TrendSample[];

/** ~ a season of history; enough for a trend, small enough to never matter. */
export const TREND_WEEKS_CAP = 12;

/** Per-kid trend persistence (the web app keeps it on-device, like the
 *  economy documents — synchronous storage, synchronous port). */
export interface TrendStore {
  load(kid: KidId): TrendHistory;
  save(kid: KidId, history: TrendHistory): void;
}

/** A word is "learned" when it has been answered right at least once and is
 *  not struggling — the same bar the informe's palabras fuertes uses. */
export function isLearnedStat(stat: WordStat): boolean {
  return stat.right > 0 && weakScore(stat) <= 0;
}

export function learnedCount(stats: WordStats): number {
  return Object.values(stats).filter(isLearnedStat).length;
}

/** Upsert this week's sample: a re-sample of the same week overwrites (each
 *  sample is "as of the latest look"), weeks stay sorted, and the history is
 *  capped at the newest TREND_WEEKS_CAP entries. */
export function recordSample(
  history: TrendHistory,
  week: string,
  learned: number,
): TrendHistory {
  const kept = history.filter((sample) => sample.week !== week);
  return [...kept, { week, learned }]
    .sort((a, b) => (a.week < b.week ? -1 : 1))
    .slice(-TREND_WEEKS_CAP);
}

/** Words learned in the newest sampled week — the delta between the two
 *  newest samples, floored at zero (a corrupt sample must not read as
 *  negative growth). Null with fewer than two samples: a first-ever week has
 *  nothing honest to compare against. */
export function learnedThisWeek(history: TrendHistory): number | null {
  if (history.length < 2) {
    return null;
  }
  const newest = history[history.length - 1]!;
  const previous = history[history.length - 2]!;
  return Math.max(0, newest.learned - previous.learned);
}
