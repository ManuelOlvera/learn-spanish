import { recordAnswer } from "../domain/word-stats";
import type { WordStats, WordStatsStore } from "../domain/word-stats";
import type { KidId } from "../domain/kid";

/** Tally a first-try answer so future quizzes re-ask struggled words. */
export class RecordAnswerUseCase {
  constructor(private readonly stats: WordStatsStore) {}

  async execute(
    kid: KidId,
    cardId: string,
    correct: boolean,
  ): Promise<WordStats> {
    const current = await this.stats.load(kid);
    const next = recordAnswer(current, cardId, correct);
    await this.stats.save(kid, next);
    return next;
  }
}
