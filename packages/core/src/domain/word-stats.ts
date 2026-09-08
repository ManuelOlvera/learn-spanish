import type { KidId } from "./kid";
import type { VocabularyCard } from "./card";

/** Per-word right/wrong tallies — how the app notices what a kid finds hard. */
export interface WordStat {
  readonly right: number;
  readonly wrong: number;
  /** The local day (`dayIndex`) this word was last answered — what lets
   *  `domain/review.ts` tell a word going quiet from a word going wrong.
   *
   *  **Optional, and it must stay optional.** Every tally written before
   *  staleness shipped has no stamp, and an unstamped word is treated as
   *  never-timed rather than as last seen at the epoch: guessing would call
   *  the entire existing pack stale on the day this ships. */
  readonly seen?: number;
}

export type WordStats = Readonly<Record<string, WordStat>>;

/** Per-kid stats persistence (the web app keeps it on-device). */
export interface WordStatsStore {
  load(kid: KidId): Promise<WordStats>;
  save(kid: KidId, stats: WordStats): Promise<void>;
}

/** Tally an answer and stamp the word as seen `today` (a `dayIndex`). The
 *  stamp is not optional at the call site on purpose — a tally written without
 *  one is invisible to el repaso's staleness pass forever after. */
export function recordAnswer(
  stats: WordStats,
  cardId: string,
  correct: boolean,
  today: number,
): WordStats {
  const current = stats[cardId] ?? { right: 0, wrong: 0 };
  return {
    ...stats,
    [cardId]: {
      right: current.right + (correct ? 1 : 0),
      wrong: current.wrong + (correct ? 0 : 1),
      seen: today,
    },
  };
}

/** Like recordAnswer, but a correct review answer also forgives one prior miss.
 *  El repaso re-asks each weak word once, and a wrong weighs double (weakScore),
 *  so a single correct answer could never offset the miss that flagged the word
 *  — the badge would never clear. Healing a wrong lets one good pass clear a
 *  lightly-missed word. A fumbled review answer still counts as a miss. */
export function recordReviewAnswer(
  stats: WordStats,
  cardId: string,
  correct: boolean,
  today: number,
): WordStats {
  const current = stats[cardId] ?? { right: 0, wrong: 0 };
  return {
    ...stats,
    [cardId]: correct
      ? { right: current.right + 1, wrong: Math.max(0, current.wrong - 1), seen: today }
      : { right: current.right, wrong: current.wrong + 1, seen: today },
  };
}

/** Positive = struggling; wrongs weigh double so one slip doesn't linger. */
export function weakScore(stat: WordStat): number {
  return stat.wrong * 2 - stat.right;
}

/** How many words justify offering a repaso session. */
export const REVIEW_MIN = 3;

/** The words a kid is currently getting wrong, worst first.
 *
 *  This is one of the two halves of el repaso, not the whole of it — the other
 *  is the words going quiet (`domain/review.ts`). Keep this one shaky-only:
 *  the parent report calls it for "las difíciles", where a word that is merely
 *  unpractised would be a false accusation. */
export function pickShakyCards(
  cards: readonly VocabularyCard[],
  stats: WordStats,
  max: number,
): readonly VocabularyCard[] {
  return cards
    .filter((c) => {
      const stat = stats[c.id];
      return stat !== undefined && weakScore(stat) > 0;
    })
    .sort((a, b) => weakScore(stats[b.id]!) - weakScore(stats[a.id]!))
    .slice(0, max);
}
