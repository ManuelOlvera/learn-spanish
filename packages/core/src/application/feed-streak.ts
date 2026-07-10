import { advanceStreak, dayKey } from "../domain/daily";
import type { Streak, StreakStore } from "../domain/daily";
import type { KidId } from "../domain/kid";

/** Record that a kid played today; returns the resulting streak. */
export class FeedStreakUseCase {
  constructor(private readonly streaks: StreakStore) {}

  async execute(kid: KidId, date: Date): Promise<Streak> {
    const today = dayKey(date);
    const previous = await this.streaks.load(kid);
    const next = advanceStreak(previous, today);
    if (next !== previous) {
      await this.streaks.save(kid, next);
    }
    return next;
  }
}
