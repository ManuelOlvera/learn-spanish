import type { KidId } from "./kid";
import type { VocabularyCard } from "./card";

/** Per-word right/wrong tallies — how the app notices what a kid finds hard. */
export interface WordStat {
  readonly right: number;
  readonly wrong: number;
}

export type WordStats = Readonly<Record<string, WordStat>>;

/** Per-kid stats persistence (the web app keeps it on-device). */
export interface WordStatsStore {
  load(kid: KidId): Promise<WordStats>;
  save(kid: KidId, stats: WordStats): Promise<void>;
}

export function recordAnswer(
  stats: WordStats,
  cardId: string,
  correct: boolean,
): WordStats {
  const current = stats[cardId] ?? { right: 0, wrong: 0 };
  return {
    ...stats,
    [cardId]: {
      right: current.right + (correct ? 1 : 0),
      wrong: current.wrong + (correct ? 0 : 1),
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
): WordStats {
  const current = stats[cardId] ?? { right: 0, wrong: 0 };
  return {
    ...stats,
    [cardId]: correct
      ? { right: current.right + 1, wrong: Math.max(0, current.wrong - 1) }
      : { right: current.right, wrong: current.wrong + 1 },
  };
}

/** Positive = struggling; wrongs weigh double so one slip doesn't linger. */
export function weakScore(stat: WordStat): number {
  return stat.wrong * 2 - stat.right;
}

/** How many struggling words justify offering a repaso session. */
export const REVIEW_MIN = 3;

export function pickReviewCards(
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
