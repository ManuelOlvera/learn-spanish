import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import type { KidId } from "./kid";
import {
  attributeText,
  attributedCards,
  cardAttributes,
  type CardAttribute,
} from "./attribute";

/** The device's LOCAL calendar day, e.g. "2026-07-10" — the unit of all
 *  daily time (carta del día, streaks, misión). Local, not UTC: the kids
 *  play in the evening, and a UTC day would flip the card and the misión
 *  mid-evening anywhere west of Greenwich. Paired devices share a household
 *  timezone, so sync merges compare like with like. */
export function dayKey(date: Date): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  )
    .toISOString()
    .slice(0, 10);
}

/**
 * The same local calendar day as `dayKey`, as a whole number of days since the
 * epoch — the shape arithmetic wants. `dayKey` is an identity ("which day is
 * it?"); this is a measure ("how many days ago?"), and deriving one from the
 * other means parsing a string back into a date on every comparison.
 *
 * Local, for `dayKey`'s reason: the kids play in the evening, and a UTC day
 * would age every word a day early anywhere west of Greenwich.
 */
export function dayIndex(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

/** FNV-1a over the day key — stable across sessions and platforms, so every
 *  device shows the same card on the same day with nothing stored. */
function dayHash(date: Date): number {
  let hash = 0x811c9dc5;
  for (const char of dayKey(date)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** The featured card of the day: deterministic for a date, varies day to day. */
export function dailyCard(decks: readonly Deck[], date: Date): VocabularyCard {
  const cards = decks.flatMap((deck) => deck.cards);
  if (cards.length === 0) {
    throw new Error("dailyCard needs at least one card in the pack");
  }
  return cards[dayHash(date) % cards.length]!;
}

/**
 * The carta del día, at the level the kid plays (roadmap 10).
 *
 * The listener gets the word, as they always have. The reader gets a
 * **sentence** about it — the rung up from single nouns that item 10 deferred
 * until there was attribute content to build one from.
 *
 * The reader's card is drawn from the *attributed* cards rather than the whole
 * pack. Picking the day's card first and adding a sentence if it happened to
 * have attributes would leave the reader a bare word on most days, since 94
 * of 598 words carry any.
 */
export interface DailyFeature {
  readonly card: VocabularyCard;
  /** Present only when the card is being described rather than named. */
  readonly attribute?: CardAttribute;
  /** What to show and speak: the word, or the whole sentence. */
  readonly text: string;
}

export function dailyFeature(
  decks: readonly Deck[],
  date: Date,
  kid: KidId,
): DailyFeature {
  if (kid === "reader") {
    const describable = attributedCards(decks);
    if (describable.length > 0) {
      const hash = dayHash(date);
      const card = describable[hash % describable.length]!;
      const attributes = cardAttributes(card);
      // A second, independent draw off the same hash, so a card with two
      // attributes does not always show the same one.
      const attribute = attributes[(hash >>> 8) % attributes.length]!;
      return { card, attribute, text: attributeText(card, attribute) };
    }
  }
  const card = dailyCard(decks, date);
  return { card, text: card.spanish };
}

export interface Streak {
  /** Day the streak was last fed, as a dayKey. */
  readonly day: string;
  readonly count: number;
}

/** Per-kid streak persistence (the web app keeps it on-device). */
export interface StreakStore {
  load(kid: KidId): Promise<Streak | null>;
  save(kid: KidId, streak: Streak): Promise<void>;
}

/** Feed the streak for `today`: same day is idempotent, the next calendar
 *  day grows it, any gap restarts at 1. */
export function advanceStreak(previous: Streak | null, today: string): Streak {
  if (previous === null) {
    return { day: today, count: 1 };
  }
  if (previous.day === today) {
    return previous;
  }
  const next = new Date(`${previous.day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const isConsecutive = dayKey(next) === today;
  return { day: today, count: isConsecutive ? previous.count + 1 : 1 };
}
