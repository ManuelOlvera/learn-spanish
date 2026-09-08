import { describe, expect, it } from "vitest";
import {
  daysUnseen,
  isStaleStat,
  pickReviewCards,
  pickStaleCards,
  reviewCount,
  STALE_AFTER_DAYS,
} from "../src/domain/review";
import { dayIndex } from "../src/domain/daily";
import { recordAnswer } from "../src/domain/word-stats";
import { deckOf } from "./helpers";

const TODAY = dayIndex(new Date("2026-09-08T19:00:00"));
const learned = (seen: number) => ({ right: 4, wrong: 0, seen });
const shaky = (seen: number) => ({ right: 0, wrong: 3, seen });

describe("dayIndex", () => {
  it("counts whole local days, so a difference is a number of days", () => {
    const monday = dayIndex(new Date("2026-09-07T23:30:00"));
    const tuesday = dayIndex(new Date("2026-09-08T00:30:00"));
    expect(tuesday - monday).toBe(1);
  });

  it("uses the local calendar day, like dayKey — an evening answer is today's", () => {
    // Late evening west of Greenwich is already tomorrow in UTC. The kids
    // play in the evening, so a UTC day would age every word a day early.
    const evening = new Date(2026, 8, 8, 22, 0, 0);
    const nextMorning = new Date(2026, 8, 9, 8, 0, 0);
    expect(dayIndex(nextMorning) - dayIndex(evening)).toBe(1);
  });
});

describe("daysUnseen", () => {
  it("is null for a word the app never timed", () => {
    // Every tally written before staleness shipped has no stamp, and a word
    // with no stamp must not be guessed at — null, never zero.
    expect(daysUnseen({ right: 4, wrong: 0 }, TODAY)).toBeNull();
  });

  it("counts days since the word was last answered", () => {
    expect(daysUnseen(learned(TODAY - 20), TODAY)).toBe(20);
    expect(daysUnseen(learned(TODAY), TODAY)).toBe(0);
  });

  it("floors a stamp from the future at zero rather than going negative", () => {
    // Two paired devices, one with a wrong clock: a future stamp must read as
    // "just seen", not as a word that is -5 days stale.
    expect(daysUnseen(learned(TODAY + 5), TODAY)).toBe(0);
  });
});

describe("isStaleStat", () => {
  it("flags a learned word left unpractised past the window", () => {
    expect(isStaleStat(learned(TODAY - STALE_AFTER_DAYS), TODAY)).toBe(true);
    expect(isStaleStat(learned(TODAY - STALE_AFTER_DAYS + 1), TODAY)).toBe(false);
  });

  it("never flags a word that is currently struggling", () => {
    // A shaky word is already in the review set on its own merit. Calling it
    // stale too would rank it twice and blur two different problems.
    expect(isStaleStat(shaky(TODAY - 90), TODAY)).toBe(false);
  });

  it("never flags a word the app never claimed was learned", () => {
    // ADR 012's bar is right >= 2. One correct answer is a ~33% guess, so a
    // word at right:1 was never known and cannot have decayed.
    expect(isStaleStat({ right: 1, wrong: 0, seen: TODAY - 90 }, TODAY)).toBe(false);
  });

  it("never flags an unstamped word, however old the tally", () => {
    expect(isStaleStat({ right: 9, wrong: 0 }, TODAY)).toBe(false);
  });
});

describe("pickReviewCards", () => {
  const cards = deckOf(6).cards;

  it("puts struggling words ahead of stale ones", () => {
    // El repaso has room for a handful of words. A word being missed today is
    // a live problem; a word going quiet is a slow one, so shaky fills first
    // and stale takes whatever is left.
    const stats = {
      [cards[0]!.id]: learned(TODAY - 40),
      [cards[1]!.id]: shaky(TODAY - 1),
      [cards[2]!.id]: learned(TODAY - 20),
      [cards[3]!.id]: learned(TODAY),
    };
    expect(pickReviewCards(cards, stats, TODAY, 5).map((c) => c.id)).toEqual([
      cards[1]!.id, // shaky
      cards[0]!.id, // stale longest
      cards[2]!.id,
    ]);
  });

  it("caps the session, dropping stale words before struggling ones", () => {
    const stats = {
      [cards[0]!.id]: learned(TODAY - 40),
      [cards[1]!.id]: shaky(TODAY - 1),
    };
    expect(pickReviewCards(cards, stats, TODAY, 1).map((c) => c.id)).toEqual([
      cards[1]!.id,
    ]);
  });

  it("finds nothing in a pack that has only ever been answered right, today", () => {
    const stats = { [cards[0]!.id]: learned(TODAY) };
    expect(pickReviewCards(cards, stats, TODAY, 5)).toEqual([]);
  });

  it("behaves exactly as before on stats written without stamps", () => {
    // The upgrade path: every existing device has unstamped tallies, and the
    // day staleness ships el repaso must not suddenly offer the whole pack.
    const stats = {
      [cards[0]!.id]: { right: 9, wrong: 0 },
      [cards[1]!.id]: { right: 0, wrong: 3 },
    };
    expect(pickReviewCards(cards, stats, TODAY, 5).map((c) => c.id)).toEqual([
      cards[1]!.id,
    ]);
  });
});

describe("pickStaleCards", () => {
  it("lists only the quiet words, longest-quiet first — the parent's own view", () => {
    const cards = deckOf(6).cards;
    const stats = {
      [cards[0]!.id]: learned(TODAY - 20),
      [cards[1]!.id]: shaky(TODAY - 60),
      [cards[2]!.id]: learned(TODAY - 40),
    };
    expect(pickStaleCards(cards, stats, TODAY, 5).map((c) => c.id)).toEqual([
      cards[2]!.id,
      cards[0]!.id,
    ]);
  });
});

describe("reviewCount", () => {
  it("counts what a repaso session would actually offer", () => {
    const cards = deckOf(6).cards;
    const stats = {
      [cards[0]!.id]: learned(TODAY - 40),
      [cards[1]!.id]: shaky(TODAY),
    };
    expect(reviewCount(cards, stats, TODAY)).toBe(2);
  });
});

describe("stamping happens where the answer is recorded", () => {
  it("marks the word seen today on every answer, right or wrong", () => {
    const first = recordAnswer({}, "gato", true, TODAY);
    expect(first.gato).toEqual({ right: 1, wrong: 0, seen: TODAY });
    const later = recordAnswer(first, "gato", false, TODAY + 30);
    expect(later.gato).toEqual({ right: 1, wrong: 1, seen: TODAY + 30 });
  });

  it("clears staleness the moment the word is practised again", () => {
    const stale = { gato: learned(TODAY - 40) };
    expect(isStaleStat(stale.gato, TODAY)).toBe(true);
    const practised = recordAnswer(stale, "gato", true, TODAY);
    expect(isStaleStat(practised.gato!, TODAY)).toBe(false);
  });
});
