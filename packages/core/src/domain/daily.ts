import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import type { KidId } from "./kid";

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

/** The featured card of the day: deterministic for a date, varies day to day. */
export function dailyCard(decks: readonly Deck[], date: Date): VocabularyCard {
  const cards = decks.flatMap((deck) => deck.cards);
  if (cards.length === 0) {
    throw new Error("dailyCard needs at least one card in the pack");
  }
  // FNV-1a over the day key — stable across sessions and platforms.
  let hash = 0x811c9dc5;
  for (const char of dayKey(date)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return cards[(hash >>> 0) % cards.length]!;
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
