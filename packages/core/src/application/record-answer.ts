import { recordAnswer, recordReviewAnswer } from "../domain/word-stats";
import type { WordStats, WordStatsStore } from "../domain/word-stats";
import type { KidId } from "../domain/kid";

/** Tally a first-try answer so future quizzes re-ask struggled words. In review
 *  mode (El repaso) a correct answer also forgives a prior miss, so finishing a
 *  session can actually clear the word from the weak set. */
export class RecordAnswerUseCase {
  constructor(private readonly stats: WordStatsStore) {}

  async execute(
    kid: KidId,
    cardId: string,
    correct: boolean,
    review = false,
  ): Promise<WordStats> {
    const current = await this.stats.load(kid);
    const next = review
      ? recordReviewAnswer(current, cardId, correct)
      : recordAnswer(current, cardId, correct);
    await this.stats.save(kid, next);
    return next;
  }
}
