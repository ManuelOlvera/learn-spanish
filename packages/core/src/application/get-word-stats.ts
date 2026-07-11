import type { WordStats, WordStatsStore } from "../domain/word-stats";
import type { KidId } from "../domain/kid";

export class GetWordStatsUseCase {
  constructor(private readonly stats: WordStatsStore) {}

  execute(kid: KidId): Promise<WordStats> {
    return this.stats.load(kid);
  }
}
