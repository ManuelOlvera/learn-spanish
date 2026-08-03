import { appendAnswer } from "../domain/answer-log";
import type { AnswerLogStore } from "../domain/answer-log";
import type { ActivityId } from "../domain/album";
import { recordAnswer, recordReviewAnswer } from "../domain/word-stats";
import type { WordStats, WordStatsStore } from "../domain/word-stats";
import type { KidId } from "../domain/kid";

export interface RecordAnswerInput {
  readonly kid: KidId;
  readonly cardId: string;
  readonly correct: boolean;
  /** Which game the answer came from — the attribution the report needs. */
  readonly activity: ActivityId;
  /** El repaso: a correct answer also forgives a prior miss, so finishing a
   *  session can actually clear the word from the weak set. */
  readonly review?: boolean;
}

/**
 * Tally a first-try answer so future quizzes re-ask struggled words, and log
 * it with its game and the time (ADR 013) so the report can say *where* a kid
 * struggles and *when* they practise.
 *
 * Named arguments because there are now four of them and two are booleans —
 * `execute(kid, id, true, false)` was one transposition away from silently
 * recording the opposite of what happened.
 */
export class RecordAnswerUseCase {
  constructor(
    private readonly stats: WordStatsStore,
    private readonly log: AnswerLogStore,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(input: RecordAnswerInput): Promise<WordStats> {
    const { kid, cardId, correct, activity, review = false } = input;
    const current = await this.stats.load(kid);
    const next = review
      ? recordReviewAnswer(current, cardId, correct)
      : recordAnswer(current, cardId, correct);
    await this.stats.save(kid, next);

    const now = this.clock();
    this.log.save(
      kid,
      appendAnswer(
        this.log.load(kid),
        { at: now.getTime(), activity, cardId, correct },
        now,
      ),
    );
    return next;
  }
}
