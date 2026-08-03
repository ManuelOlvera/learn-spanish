import type { ActivityId } from "./album";
import { dayKey } from "./daily";
import type { KidId } from "./kid";

/**
 * A short, on-device history of answers — the only place the app records
 * *when* something happened and *which game* it happened in. Word stats
 * (`word-stats.ts`) can say a word is shaky; only this can say the kid gets it
 * right in la sopa and wrong in el globo, or that they played every evening
 * last week and nothing since.
 *
 * Two boundaries are deliberate and load-bearing (ADR 013):
 *  - **It never leaves the device.** It is not part of `ProgressSnapshot`, so
 *    no per-answer record of a child rides the sync row.
 *  - **It forgets.** Only the last `LOG_RETENTION_DAYS` are kept, pruned on
 *    every append, so the file cannot grow without bound on a family tablet.
 */
export interface AnswerEvent {
  /** Epoch milliseconds — local time is derived from it for day grouping. */
  readonly at: number;
  readonly activity: ActivityId;
  readonly cardId: string;
  readonly correct: boolean;
}

export type AnswerLog = readonly AnswerEvent[];

/** Roughly three months: long enough to see a habit, short enough to forget. */
export const LOG_RETENTION_DAYS = 90;

/** Backstop for a device that somehow outruns the date window; the window is
 *  the actual policy. ~20k answers is far more than three months of play. */
export const MAX_LOG_EVENTS = 20000;

/** A pause longer than this ends a sitting. Kids wander off mid-game; without
 *  a gap rule, one morning and one bedtime session read as a six-hour marathon. */
export const SESSION_GAP_MINUTES = 20;

const MINUTE = 60 * 1000;

/** Per-kid answer-log persistence (the web app keeps it on-device, and only
 *  there — see the note above). Synchronous, like the economy stores. */
export interface AnswerLogStore {
  load(kid: KidId): AnswerLog;
  save(kid: KidId, log: AnswerLog): void;
}

export function appendAnswer(
  log: AnswerLog,
  event: AnswerEvent,
  now: Date,
): AnswerLog {
  return capped(pruneLog([...log, event], now));
}

/** Drop everything outside the retention window. Events with an unusable
 *  timestamp go too: the log is read off storage, and one corrupt entry must
 *  not sort to the front of a calendar or stretch a session to infinity. */
export function pruneLog(log: AnswerLog, now: Date): AnswerLog {
  const cutoff = now.getTime() - LOG_RETENTION_DAYS * 24 * 60 * MINUTE;
  return log
    .filter((e) => Number.isFinite(e.at) && e.at >= cutoff)
    .sort((a, b) => a.at - b.at);
}

function capped(log: AnswerLog): AnswerLog {
  return log.length > MAX_LOG_EVENTS ? log.slice(-MAX_LOG_EVENTS) : log;
}

/** How a kid does in each game they have actually answered in. */
export interface GameAccuracy {
  readonly activity: ActivityId;
  readonly answers: number;
  readonly right: number;
  /** Hits ÷ answers, 0–1. */
  readonly accuracy: number;
}

/**
 * Accuracy per game, most-answered first. Games with no answers are **absent**
 * rather than zero: "never played" and "always wrong" look identical as 0% and
 * mean opposite things. The report lists never-played games separately, from
 * the play counts.
 */
export function accuracyByGame(log: AnswerLog): readonly GameAccuracy[] {
  const totals = new Map<ActivityId, { answers: number; right: number }>();
  for (const event of log) {
    const running = totals.get(event.activity) ?? { answers: 0, right: 0 };
    totals.set(event.activity, {
      answers: running.answers + 1,
      right: running.right + (event.correct ? 1 : 0),
    });
  }
  return [...totals]
    .map(([activity, { answers, right }]) => ({
      activity,
      answers,
      right,
      accuracy: right / answers,
    }))
    .sort((a, b) => b.answers - a.answers);
}

/** One day of practice. Days with no answers are absent from the map. */
export interface PracticeDay {
  readonly answers: number;
  readonly right: number;
  /** Minutes actually spent, summed over sittings — not the span of the day. */
  readonly minutes: number;
  readonly sittings: number;
  /** The longest single sitting that day. */
  readonly longestSittingMinutes: number;
}

export function practiceDays(log: AnswerLog): ReadonlyMap<string, PracticeDay> {
  const byDay = new Map<string, AnswerEvent[]>();
  for (const event of log) {
    if (!Number.isFinite(event.at)) {
      continue;
    }
    const day = dayKey(new Date(event.at));
    byDay.set(day, [...(byDay.get(day) ?? []), event]);
  }

  const days = new Map<string, PracticeDay>();
  for (const [day, events] of byDay) {
    const ordered = [...events].sort((a, b) => a.at - b.at);
    const sittings = splitSittings(ordered);
    days.set(day, {
      answers: ordered.length,
      right: ordered.filter((e) => e.correct).length,
      minutes: sittings.reduce((sum, s) => sum + s, 0),
      sittings: sittings.length,
      longestSittingMinutes: Math.max(0, ...sittings),
    });
  }
  return days;
}

/** Sitting lengths in minutes. A sitting ends after a gap of more than
 *  SESSION_GAP_MINUTES; a lone answer counts as one minute, never zero — they
 *  did open the app. */
function splitSittings(ordered: readonly AnswerEvent[]): readonly number[] {
  const lengths: number[] = [];
  let start = ordered[0]?.at ?? 0;
  let previous = start;
  for (const event of ordered.slice(1)) {
    if (event.at - previous > SESSION_GAP_MINUTES * MINUTE) {
      lengths.push(minutesBetween(start, previous));
      start = event.at;
    }
    previous = event.at;
  }
  if (ordered.length > 0) {
    lengths.push(minutesBetween(start, previous));
  }
  return lengths;
}

function minutesBetween(start: number, end: number): number {
  return Math.max(1, Math.round((end - start) / MINUTE));
}

/** The headline totals for the whole retained window. */
export interface PracticeSummary {
  readonly answers: number;
  readonly right: number;
  readonly activeDays: number;
  readonly minutes: number;
  readonly longestSittingMinutes: number;
}

export function practiceSummary(log: AnswerLog): PracticeSummary {
  const days = [...practiceDays(log).values()];
  return {
    answers: days.reduce((sum, d) => sum + d.answers, 0),
    right: days.reduce((sum, d) => sum + d.right, 0),
    activeDays: days.length,
    minutes: days.reduce((sum, d) => sum + d.minutes, 0),
    longestSittingMinutes: Math.max(0, ...days.map((d) => d.longestSittingMinutes)),
  };
}
