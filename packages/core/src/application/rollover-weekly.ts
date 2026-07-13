import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import {
  freezesOrStarting,
  rollWeek,
  weekActiveDayCount,
  weekKey,
} from "../domain/weekly";
import type { RolloverOutcome } from "../domain/weekly";

/** The weekly streak as home shows it. */
export interface WeeklyView {
  /** Active weeks earned so far. */
  readonly count: number;
  readonly freezes: number;
  /** Active days recorded this week (0…ACTIVE_WEEK_DAYS). */
  readonly activeDays: number;
  /** What the week rollover did — drives the once-per-week animation. */
  readonly outcome: RolloverOutcome;
}

/**
 * Read the weekly streak, rolling finished weeks over first. State is only
 * persisted when the rollover changed it, so the celebration `outcome` fires
 * exactly once per new week. Call on app open.
 */
export class RolloverWeeklyUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, now: Date): WeeklyView {
    const currentWeek = weekKey(now);
    const stored = this.store.loadWeekly(kid);
    const freezes = freezesOrStarting(this.store.loadFreezes(kid));
    const progress = this.store.loadWeekProgress(kid);
    const result = rollWeek(stored, freezes, progress, currentWeek);
    if (
      stored === null ||
      stored.week !== result.streak.week ||
      stored.count !== result.streak.count
    ) {
      this.store.saveWeekly(kid, result.streak);
    }
    if (result.freezes !== freezes) {
      this.store.saveFreezes(kid, result.freezes);
    }
    return {
      count: result.streak.count,
      freezes: result.freezes,
      activeDays: weekActiveDayCount(progress, currentWeek),
      outcome: result.outcome,
    };
  }
}
