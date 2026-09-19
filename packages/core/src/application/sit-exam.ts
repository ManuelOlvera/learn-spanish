import type { DeckGroupRepository } from "../domain/deck-group";
import type { DeckRepository } from "../domain/deck-repository";
import type { EconomyStore } from "../domain/economy";
import {
  examPassed,
  isExamPass,
  nominatePracticeDeck,
  recordExamScore,
} from "../domain/exam";
import type { KidId } from "../domain/kid";
import { EXAM_BONUS } from "../domain/stars";
import type { WordStatsStore } from "../domain/word-stats";
import { bankStars } from "./earn-stars";

export interface ExamOutcome {
  readonly passed: boolean;
  /** Stars banked for this sitting — `EXAM_BONUS` on the first pass, else 0. */
  readonly stars: number;
  /** On a failure, the deck to go and play before re-sitting. Never null for
   *  a shelf with anything playable on it (ADR 021). */
  readonly practiceDeckId: string | null;
}

/**
 * Sit one shelf's exam and record the result.
 *
 * Passing pays `EXAM_BONUS` — the largest single payout in the app — **once**.
 * A re-sit records the attempt and may raise the best score, but the chest is
 * already open, exactly as a category's completion chest never re-pays
 * (ClaimCategoryRewardUseCase). "Already passed" is read from the record
 * *before* this sitting is written, which is what makes that check honest.
 */
export class SitExamUseCase {
  constructor(
    private readonly store: EconomyStore,
    private readonly decks: DeckRepository,
    private readonly groups: DeckGroupRepository,
    private readonly stats: WordStatsStore,
  ) {}

  async execute(
    kid: KidId,
    groupId: string,
    score: number,
  ): Promise<ExamOutcome> {
    const records = this.store.loadExamRecords(kid);
    const alreadyPassed = examPassed(records[groupId]);
    this.store.saveExamRecords(kid, recordExamScore(records, groupId, score));

    if (isExamPass(score)) {
      // The gate is open, so whatever practice was outstanding is moot.
      this.store.saveExamPractice(kid, null);
      const stars = alreadyPassed ? 0 : EXAM_BONUS;
      if (stars > 0) {
        bankStars(this.store, kid, stars);
      }
      return { passed: true, stars, practiceDeckId: null };
    }

    // A failure must always hand back something to do. Re-passing is not at
    // risk here: a kid who has already passed keeps their open gate, because
    // `locked` reads the best score, never this practice record.
    const [decks, groups, stats] = await Promise.all([
      this.decks.listDecks(),
      this.groups.listGroupsInTrailOrder(),
      this.stats.load(kid),
    ]);
    const practiceDeckId = nominatePracticeDeck({ groupId, groups, decks, stats });
    if (practiceDeckId !== null && !alreadyPassed) {
      this.store.saveExamPractice(kid, {
        groupId,
        deckId: practiceDeckId,
        mark: this.deckPlayCount(kid, practiceDeckId),
      });
    }
    return { passed: false, stars: 0, practiceDeckId };
  }

  /**
   * How many activity completions this deck holds for this kid — the mark that
   * "played it again" has to beat.
   *
   * Raw counts, deliberately: this is compared against a later read of the same
   * ledger, so ADR 016's orphaned-count rule is irrelevant here. An orphan
   * inflates both the mark and the comparison identically and cancels out,
   * which is why this does not need the album to verify against.
   */
  private deckPlayCount(kid: KidId, deckId: string): number {
    const prefix = `${kid}:${deckId}:`;
    return Object.entries(this.store.loadStickerCounts()).reduce(
      (total, [id, count]) => (id.startsWith(prefix) ? total + count : total),
      0,
    );
  }
}
