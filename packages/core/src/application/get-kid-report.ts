import type { StickerCountsStore } from "../domain/album";
import type { Deck } from "../domain/deck";
import type { KidId } from "../domain/kid";
import {
  deckMastery,
  gamesPlayed,
  strugglingByDeck,
  totalPlays,
} from "../domain/report";
import type { DeckMastery, GamePlays, StruggleGroup } from "../domain/report";
import type { WordStatsStore } from "../domain/word-stats";

/** Everything the per-kid report screen draws, in one read. */
export interface KidReport {
  readonly kid: KidId;
  /** One entry per deck, in the order the decks were given (album order). */
  readonly decks: readonly DeckMastery[];
  /** Every game, most-played first, zeroes included. */
  readonly games: readonly GamePlays[];
  readonly struggling: readonly StruggleGroup[];
  readonly totalPlays: number;
  /** Mastered and total across every deck shown — the headline pair. */
  readonly mastered: number;
  readonly totalWords: number;
  /** Decks with no answers and no plays at all. */
  readonly untouchedDecks: number;
}

/**
 * Build the parent report for one kid from data already on the device
 * (per-word tallies + per-completion sticker counts). Read-only: opening the
 * report must never change what it is reporting on.
 *
 * Decks come from the caller rather than a repository because the screen has
 * already resolved which ones this kid can see — secret decks stay hidden
 * until unlocked, and the report must not leak their existence.
 */
export class GetKidReportUseCase {
  constructor(
    private readonly stats: WordStatsStore,
    private readonly counts: StickerCountsStore,
  ) {}

  async execute(kid: KidId, decks: readonly Deck[]): Promise<KidReport> {
    const [stats, counts] = await Promise.all([
      this.stats.load(kid),
      this.counts.load(),
    ]);
    const masteries = decks.map((deck) =>
      deckMastery(deck, stats, counts, kid),
    );
    return {
      kid,
      decks: masteries,
      games: gamesPlayed(counts, kid),
      struggling: strugglingByDeck(decks, stats),
      totalPlays: totalPlays(counts, kid),
      mastered: masteries.reduce((sum, d) => sum + d.mastered, 0),
      totalWords: masteries.reduce((sum, d) => sum + d.total, 0),
      untouchedDecks: masteries.filter((d) => !d.everOpened).length,
    };
  }
}
