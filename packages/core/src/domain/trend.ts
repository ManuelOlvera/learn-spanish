import type { KidId } from "./kid";
import { nextWeek } from "./weekly";
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

/**
 * Correct answers a word needs before it counts as learned.
 *
 * It used to be one. A quiz round offers three pictures, so a single lucky tap
 * — 33% by guessing, and higher once a kid recognises the wrong options —
 * marked a word learned for good. That inflated both the informe's headline
 * count and every bar of this trend. Two consecutive-ish rights is ~11% by
 * chance; three would be stricter but takes so long to earn that the chart
 * stops moving, which is its own kind of lie.
 */
export const LEARNED_MIN_RIGHT = 2;

/** A word is "learned" when it has been answered right enough times to rule
 *  out a lucky guess and is not currently struggling. */
export function isLearnedStat(stat: WordStat): boolean {
  return stat.right >= LEARNED_MIN_RIGHT && weakScore(stat) <= 0;
}

export function learnedCount(stats: WordStats): number {
  return Object.values(stats).filter(isLearnedStat).length;
}

/**
 * Upsert this week's sample: a re-sample of the same week overwrites (each
 * sample is "as of the latest look"), weeks stay sorted, and the history is
 * capped at the newest TREND_WEEKS_CAP entries.
 *
 * Weeks with no sample are **backfilled flat** at the previous cumulative
 * count. Without that, a gap collapsed: two samples a month apart were drawn
 * as adjacent bars and their delta was labelled "esta semana", so a parent who
 * checked in irregularly read a month of progress as a week of it. A flat bar
 * for a week nobody played is the honest picture.
 */
export function recordSample(
  history: TrendHistory,
  week: string,
  learned: number,
): TrendHistory {
  // Unparseable weeks are dropped, not carried: a sample that can't be placed
  // on a timeline sorts after every real one (digits < letters), which would
  // make garbage the newest sample and the "esta semana" delta meaningless.
  const kept = history
    .filter((sample) => sample.week !== week && isWeekKey(sample.week))
    .sort(byWeek);
  const previous = kept[kept.length - 1];
  const filler =
    previous === undefined
      ? []
      : weeksBetween(previous.week, week).map((gap) => ({
          week: gap,
          learned: previous.learned,
        }));
  return [...kept, ...filler, { week, learned }]
    .sort(byWeek)
    .slice(-TREND_WEEKS_CAP);
}

function byWeek(a: TrendSample, b: TrendSample): number {
  return a.week < b.week ? -1 : 1;
}

function isWeekKey(value: string): boolean {
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** The week keys strictly between two samples. Bounded by the history cap, so
 *  a device whose clock jumped years can't spin here — and skipped entirely
 *  for an unparseable key, since this history comes off a storage the app does
 *  not fully control. A missing filler is a cosmetic gap; a throw here would
 *  take the whole report down. */
function weeksBetween(from: string, to: string): readonly string[] {
  if (!isWeekKey(from) || !isWeekKey(to)) {
    return [];
  }
  const gaps: string[] = [];
  let week = nextWeek(from);
  while (week < to && gaps.length < TREND_WEEKS_CAP) {
    gaps.push(week);
    week = nextWeek(week);
  }
  return gaps;
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
