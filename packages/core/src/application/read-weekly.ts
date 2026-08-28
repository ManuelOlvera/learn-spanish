import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import {
  freezesOrStarting,
  rollWeek,
  weekActiveDayCount,
  weekKey,
} from "../domain/weekly";

/** Where the weekly streak stands, with no claim on the celebration: the
 *  numbers a screen needs to *show* la racha semanal, and nothing about
 *  whether the week just turned. */
export interface WeeklySnapshot {
  /** Active weeks earned so far. */
  readonly count: number;
  readonly freezes: number;
  /** Active days recorded this week (0…ACTIVE_WEEK_DAYS). */
  readonly activeDays: number;
}

/**
 * Read the weekly streak **without** rolling it over.
 *
 * Rolling is a write, and the write is what makes `outcome` fire exactly once
 * per new week — so any second screen that rolled would silently steal home's
 * ¡Semana N! celebration (the parent report did, 2026-08-28). This projects
 * the same domain rule over the stored state and persists nothing, so the
 * numbers are already current on a Monday morning nobody has opened home yet,
 * and home still gets its one moment.
 *
 * Use this anywhere the streak is merely displayed; use RolloverWeeklyUseCase
 * only on app open, on the screen that celebrates.
 */
export class ReadWeeklyUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, now: Date): WeeklySnapshot {
    const currentWeek = weekKey(now);
    const progress = this.store.loadWeekProgress(kid);
    const result = rollWeek(
      this.store.loadWeekly(kid),
      freezesOrStarting(this.store.loadFreezes(kid)),
      progress,
      currentWeek,
    );
    return {
      count: result.streak.count,
      freezes: result.freezes,
      activeDays: weekActiveDayCount(progress, currentWeek),
    };
  }
}
