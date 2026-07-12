/** La racha semanal: a longer-horizon habit loop on top of the daily streak.
 *  A week is "active" once the kid finishes the daily mission on
 *  ACTIVE_WEEK_DAYS distinct days; each active week bumps the weekly streak.
 *  Freezes (❄️) cover an idle week so one missed week can't wipe the streak. */

/** Monday (UTC) of the week `date` falls in, as a dayKey "YYYY-MM-DD". Weeks
 *  are Monday-based, so the key sorts chronologically like a dayKey does. */
export function weekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const sinceMonday = (d.getUTCDay() + 6) % 7; // 0 = Sun … 6 = Sat → days back
  d.setUTCDate(d.getUTCDate() - sinceMonday);
  return d.toISOString().slice(0, 10);
}

/** The Monday one week after `week` (a weekKey). */
function nextWeek(week: string): string {
  const d = new Date(`${week}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

/** Distinct active days needed for a week to count. */
export const ACTIVE_WEEK_DAYS = 3;

/** Every kid begins with three freezes in their profile. */
export const STARTING_FREEZES = 3;

/** What one freeze costs at the home store, in ⭐. */
export const FREEZE_COST = 30;

/** The days (dayKeys) a kid was active in one week. Scoped to a single week so
 *  it resets cleanly when the week rolls over. */
export interface WeekProgress {
  readonly week: string;
  readonly days: readonly string[];
}

/** Where the weekly streak stands: `week` is the week currently in progress
 *  (not yet judged), and `count` the run of consecutive active weeks earned
 *  before it. */
export interface WeeklyStreak {
  readonly week: string;
  readonly count: number;
}

/** What happened when a new week rolled over — drives which animation shows. */
export type RolloverOutcome = "increased" | "frozen" | "reset" | "none";

export interface RolloverResult {
  readonly streak: WeeklyStreak;
  readonly freezes: number;
  readonly outcome: RolloverOutcome;
}

/** Record that the kid completed the daily mission on `day`. Same day is
 *  idempotent; a new week starts the day set over. */
export function markActiveDay(
  progress: WeekProgress | null,
  week: string,
  day: string,
): WeekProgress {
  const current =
    progress !== null && progress.week === week
      ? progress
      : { week, days: [] as readonly string[] };
  if (current.days.includes(day)) {
    return current;
  }
  return { ...current, days: [...current.days, day] };
}

/** Active days recorded for `week` (0 if the progress belongs to another week). */
export function weekActiveDayCount(
  progress: WeekProgress | null,
  week: string,
): number {
  return progress !== null && progress.week === week ? progress.days.length : 0;
}

export function weekIsActive(
  progress: WeekProgress | null,
  week: string,
): boolean {
  return weekActiveDayCount(progress, week) >= ACTIVE_WEEK_DAYS;
}

/** Judge every week that has finished since we last evaluated — from the
 *  streak's in-progress `week` up to (but not including) `currentWeek`, which
 *  is now the one in progress.
 *
 *  Each finished week: active → +1; idle with a live streak and a freeze →
 *  spend one, hold; idle with a live streak and no freeze → reset to 0; idle
 *  with no streak → nothing (freezes only protect a live streak). Only
 *  `progress`'s own week can be active; any other skipped week was idle.
 *
 *  The reported `outcome` is the net effect on return, so a returning kid sees
 *  one clear message: grew, saved by a freeze, or start-again. */
export function rollWeek(
  streak: WeeklyStreak | null,
  freezes: number,
  progress: WeekProgress | null,
  currentWeek: string,
): RolloverResult {
  if (streak === null) {
    return { streak: { week: currentWeek, count: 0 }, freezes, outcome: "none" };
  }
  if (streak.week >= currentWeek) {
    return { streak, freezes, outcome: "none" };
  }
  let count = streak.count;
  let frozen = freezes;
  for (let week = streak.week; week < currentWeek; week = nextWeek(week)) {
    if (weekIsActive(progress, week)) {
      count += 1;
    } else if (count > 0 && frozen > 0) {
      frozen -= 1;
    } else if (count > 0) {
      count = 0;
    }
  }
  const outcome: RolloverOutcome =
    count > streak.count
      ? "increased"
      : count < streak.count
        ? "reset"
        : frozen < freezes
          ? "frozen"
          : "none";
  return { streak: { week: currentWeek, count }, freezes: frozen, outcome };
}
