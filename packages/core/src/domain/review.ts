import type { VocabularyCard } from "./card";
import { isLearnedStat } from "./trend";
import { pickShakyCards, weakScore } from "./word-stats";
import type { WordStat, WordStats } from "./word-stats";

/**
 * What el repaso should ask about — the words going *wrong*, and the words
 * going *quiet*.
 *
 * Until this module existed the app had no time dimension at all: review
 * selection was `weakScore` alone, so a word answered right twice in July was
 * never asked again, whatever the date. Everything else the app measures —
 * medals, counts, el camino, the tiers — measures how much has been *played*.
 * Nothing measured what was slipping away.
 *
 * **Staleness is deliberately a second signal, not a change to the first.**
 * ADR 012 defines "learned" as `right >= 2 && weakScore <= 0`, and folding
 * decay into `weakScore` would have made words silently un-learn: every count
 * on `/informe` would drop and the trend chart would show a cliff on the
 * deploy date that no child ever experienced — the exact misreading ("my kid
 * forgot 50 words") that ADR 012 restarted the series to avoid. So the learned
 * bar is untouched here, and nothing in this file feeds a count or a chart.
 * It re-ranks one screen and adds one list to the parent's report.
 *
 * It reads `isLearnedStat` rather than restating the bar, for ADR 016's
 * reason: two rules over one ledger drift, and this is the same ledger.
 */

/**
 * How long a learned word may go unpractised before el repaso asks again.
 *
 * Two weeks, chosen against how this family plays rather than against a
 * forgetting curve — the kids play most days, so a fortnight of silence on one
 * word means the pack has genuinely moved on past it, while a week would flag
 * words they simply have not cycled back to yet. It is a suggestion on one
 * screen, so the cost of being a few days out either way is small.
 */
export const STALE_AFTER_DAYS = 14;

/**
 * Days since this word was last answered, or `null` if it was never timed.
 *
 * `null`, never `0` and never "very old": an unstamped tally is the normal
 * shape of every word on every device that played before staleness shipped,
 * and treating it as ancient would have offered the entire pack for review on
 * upgrade day. Absence of evidence is not evidence of decay.
 */
export function daysUnseen(stat: WordStat, today: number): number | null {
  if (stat.seen === undefined) {
    return null;
  }
  // A stamp from the future means a paired device has a wrong clock. Read it
  // as "just seen" rather than letting a negative age sort to the front.
  return Math.max(0, today - stat.seen);
}

/**
 * A word the app once called learned and has not asked about in a while.
 *
 * Excludes anything currently shaky: a missed word is already in the review
 * set on its own merit, and counting it twice would blur "getting this wrong"
 * with "hasn't seen this lately" — two different problems with two different
 * answers for the parent reading them.
 */
export function isStaleStat(stat: WordStat, today: number): boolean {
  const unseen = daysUnseen(stat, today);
  return (
    unseen !== null && unseen >= STALE_AFTER_DAYS && isLearnedStat(stat)
  );
}

/** The quiet words, longest-quiet first. The parent's own view of decay. */
export function pickStaleCards(
  cards: readonly VocabularyCard[],
  stats: WordStats,
  today: number,
  max: number,
): readonly VocabularyCard[] {
  return cards
    .filter((c) => {
      const stat = stats[c.id];
      return stat !== undefined && isStaleStat(stat, today);
    })
    .sort((a, b) => daysUnseen(stats[b.id]!, today)! - daysUnseen(stats[a.id]!, today)!)
    .slice(0, max);
}

/**
 * The words a repaso session should ask about: the struggling ones first, then
 * the quiet ones.
 *
 * The order is the whole design. A session holds a handful of words, and a
 * word being missed *today* is a live problem where a word going quiet is a
 * slow one — so shaky words fill the session and stale words take whatever
 * room is left. A kid drowning in missed words never has their session diluted
 * by decay; a kid with nothing wrong gets a session of the things they are
 * quietly losing, which is the case that had no screen at all before.
 */
export function pickReviewCards(
  cards: readonly VocabularyCard[],
  stats: WordStats,
  today: number,
  max: number,
): readonly VocabularyCard[] {
  const shaky = pickShakyCards(cards, stats, max);
  if (shaky.length >= max) {
    return shaky;
  }
  const shakyIds = new Set(shaky.map((c) => c.id));
  const stale = pickStaleCards(
    cards.filter((c) => !shakyIds.has(c.id)),
    stats,
    today,
    max - shaky.length,
  );
  return [...shaky, ...stale];
}

/**
 * How many words a repaso session would offer — what home's 🔁 chip counts.
 *
 * Uncapped on purpose: the chip asks "is there anything to review?", and
 * capping the count would make it lie once the session was full.
 */
export function reviewCount(
  cards: readonly VocabularyCard[],
  stats: WordStats,
  today: number,
): number {
  return cards.filter((c) => {
    const stat = stats[c.id];
    return (
      stat !== undefined && (weakScore(stat) > 0 || isStaleStat(stat, today))
    );
  }).length;
}
