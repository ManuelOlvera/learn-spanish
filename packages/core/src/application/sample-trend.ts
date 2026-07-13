import type { KidId } from "../domain/kid";
import { learnedCount, recordSample } from "../domain/trend";
import type { TrendHistory, TrendStore } from "../domain/trend";
import { weekKey } from "../domain/weekly";
import type { WordStatsStore } from "../domain/word-stats";

/**
 * Take (or refresh) this week's trend sample from the kid's current word
 * stats and return the whole history. Called when the parent opens the
 * informe — idempotent within a week, so opening it daily just keeps the
 * week's sample fresh.
 */
export class SampleTrendUseCase {
  constructor(
    private readonly trend: TrendStore,
    private readonly stats: WordStatsStore,
  ) {}

  async execute(kid: KidId, now: Date): Promise<TrendHistory> {
    const stats = await this.stats.load(kid);
    const history = recordSample(
      this.trend.load(kid),
      weekKey(now),
      learnedCount(stats),
    );
    this.trend.save(kid, history);
    return history;
  }
}
