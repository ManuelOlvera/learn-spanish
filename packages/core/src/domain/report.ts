import { ALL_ACTIVITIES, SENTENCE_ACTIVITIES, STORY_ACTIVITIES } from "./album";
import type { ActivityId } from "./album";
import type { VocabularyCard } from "./card";
import type { Deck } from "./deck";
import type { KidId } from "./kid";
import { isLearnedStat } from "./trend";
import { weakScore } from "./word-stats";
import type { WordStats } from "./word-stats";

/**
 * The parent report's rollups (`/informe/[kid]`).
 *
 * Everything here is derived from data the app already keeps — per-word
 * right/wrong tallies and the per-completion sticker counts — so the report
 * needs no tracking of its own. Deliberately pure: no dates, no storage, no
 * presentation. Deck names, emoji and colours are joined in by the view.
 */

/** Every activity that increments a play count. The album only shows slots for
 *  some of them, but `AwardStickerUseCase` counts a completion for all — so
 *  the report can show the sticker-less games (sopa, globo, adivina…) too. */
const COUNTED_ACTIVITIES: readonly ActivityId[] = [
  ...ALL_ACTIVITIES,
  ...SENTENCE_ACTIVITIES,
  ...STORY_ACTIVITIES,
  "counting-listen",
  "counting-read",
  "spelling",
  "sopa",
  "globo",
  "adivina",
];

/** How one deck stands for one kid. `mastered + shaky` never exceeds `total`;
 *  the remainder is the meter's empty track ("not yet"), which is not the same
 *  claim as "struggling". */
export interface DeckMastery {
  readonly deckId: string;
  readonly total: number;
  /** Words answered right enough times and not currently struggling. */
  readonly mastered: number;
  /** Words whose misses outweigh their hits (`weakScore > 0`). */
  readonly shaky: number;
  /** Words with any answer recorded at all. */
  readonly seen: number;
  /** Words never answered — `total - seen`. */
  readonly untouched: number;
  /** Completions of any activity on this deck, by this kid. */
  readonly plays: number;
  /** False only when the kid has neither answered nor played anything here —
   *  the difference between "0% mastered" and "never opened", which is the
   *  single most actionable thing on the screen. */
  readonly everOpened: boolean;
}

export function deckMastery(
  deck: Deck,
  stats: WordStats,
  counts: Readonly<Record<string, number>>,
  kid: KidId,
): DeckMastery {
  let mastered = 0;
  let shaky = 0;
  let seen = 0;
  for (const card of deck.cards) {
    const stat = stats[card.id];
    if (stat === undefined) {
      continue;
    }
    seen += 1;
    if (isLearnedStat(stat)) {
      mastered += 1;
    } else if (weakScore(stat) > 0) {
      shaky += 1;
    }
  }
  const plays = playsFor(counts, kid, (deckId) => deckId === deck.id);
  return {
    deckId: deck.id,
    total: deck.cards.length,
    mastered,
    shaky,
    seen,
    untouched: deck.cards.length - seen,
    plays,
    everOpened: seen > 0 || plays > 0,
  };
}

/** One game and how often this kid has finished it, across every deck. */
export interface GamePlays {
  readonly activity: ActivityId;
  readonly plays: number;
}

/** Play counts per game, most-played first. Games at zero are included on
 *  purpose: "nobody has ever opened Adivina" is a finding, and a list that
 *  silently omits it can't show one. */
export function gamesPlayed(
  counts: Readonly<Record<string, number>>,
  kid: KidId,
): readonly GamePlays[] {
  const totals = new Map<ActivityId, number>(
    COUNTED_ACTIVITIES.map((activity) => [activity, 0]),
  );
  for (const [key, count] of Object.entries(counts)) {
    const parsed = parseKey(key);
    if (parsed === null || parsed.kid !== kid) {
      continue;
    }
    const running = totals.get(parsed.activity);
    if (running !== undefined) {
      totals.set(parsed.activity, running + count);
    }
  }
  return [...totals]
    .map(([activity, plays]) => ({ activity, plays }))
    .sort((a, b) =>
      b.plays !== a.plays
        ? b.plays - a.plays
        : COUNTED_ACTIVITIES.indexOf(a.activity) -
          COUNTED_ACTIVITIES.indexOf(b.activity),
    );
}

/** Every completion this kid has to their name. */
export function totalPlays(
  counts: Readonly<Record<string, number>>,
  kid: KidId,
): number {
  return playsFor(counts, kid, () => true);
}

/** Struggling words grouped under their deck, worst deck first and worst word
 *  first inside it — the "five minutes at dinner" list, uncapped. */
export interface StruggleGroup {
  readonly deckId: string;
  readonly cards: readonly VocabularyCard[];
}

export function strugglingByDeck(
  decks: readonly Deck[],
  stats: WordStats,
): readonly StruggleGroup[] {
  return decks
    .filter((deck) => deck.secret !== true)
    .map((deck) => ({
      deckId: deck.id,
      cards: deck.cards
        .filter((card) => {
          const stat = stats[card.id];
          return stat !== undefined && weakScore(stat) > 0;
        })
        .sort((a, b) => weakScore(stats[b.id]!) - weakScore(stats[a.id]!)),
    }))
    .filter((group) => group.cards.length > 0)
    .sort((a, b) => groupWeight(b, stats) - groupWeight(a, stats));
}

function groupWeight(group: StruggleGroup, stats: WordStats): number {
  return group.cards.reduce((sum, card) => sum + weakScore(stats[card.id]!), 0);
}

function playsFor(
  counts: Readonly<Record<string, number>>,
  kid: KidId,
  matchesDeck: (deckId: string) => boolean,
): number {
  let total = 0;
  for (const [key, count] of Object.entries(counts)) {
    const parsed = parseKey(key);
    if (parsed !== null && parsed.kid === kid && matchesDeck(parsed.deckId)) {
      total += count;
    }
  }
  return total;
}

/** Sticker count keys are `kid:deckId:activity` (see `stickerId`). Anything
 *  else is pre-kid-era or corrupt and is skipped, never guessed at. */
function parseKey(
  key: string,
): { kid: string; deckId: string; activity: ActivityId } | null {
  const parts = key.split(":");
  if (parts.length !== 3) {
    return null;
  }
  const [kid, deckId, activity] = parts as [string, string, string];
  return COUNTED_ACTIVITIES.includes(activity as ActivityId)
    ? { kid, deckId, activity: activity as ActivityId }
    : null;
}
