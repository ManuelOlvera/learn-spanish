import type { DeckGroupRepository } from "../domain/deck-group";
import type { DeckRepository } from "../domain/deck-repository";
import { buildExam, type Exam } from "../domain/exam";
import type { KidId } from "../domain/kid";
import type { RandomSource } from "../domain/random";
import type { WordStatsStore } from "../domain/word-stats";

/**
 * Deal one shelf's exam. The shelves are put in trail order first, because
 * "everything earlier on the ladder" is what the review questions are drawn
 * from — home's browsing order would pick the wrong words.
 */
export class StartExamUseCase {
  constructor(
    private readonly decks: DeckRepository,
    private readonly groups: DeckGroupRepository,
    private readonly stats: WordStatsStore,
    private readonly random: RandomSource,
  ) {}

  async execute(kid: KidId, groupId: string): Promise<Exam> {
    const [decks, groups, stats] = await Promise.all([
      this.decks.listDecks(),
      this.groups.listGroupsInTrailOrder(),
      this.stats.load(kid),
    ]);
    return buildExam({
      groupId,
      groups,
      decks,
      kid,
      random: this.random,
      stats,
    });
  }
}
