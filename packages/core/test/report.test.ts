import { describe, expect, it } from "vitest";
import {
  deckMastery,
  gamesPlayed,
  strugglingByDeck,
  totalPlays,
} from "../src/domain/report";
import type { WordStats, WordStatsStore } from "../src/domain/word-stats";
import { card, deckOf } from "./helpers";
import type { Deck } from "../src/domain/deck";
import type { StickerCountsStore } from "../src/domain/album";
import { GetKidReportUseCase } from "../src/application/get-kid-report";

/** Word 0 mastered, word 1 struggling, word 2 seen but not there yet. */
const stats: WordStats = {
  "word-0": { right: 4, wrong: 0 },
  "word-1": { right: 1, wrong: 3 },
  "word-2": { right: 1, wrong: 0 },
};

const deck = deckOf(5); // word-0 … word-4

describe("deckMastery", () => {
  it("splits a deck into mastered, shaky, and never-answered", () => {
    const m = deckMastery(deck, stats, {}, "listener");
    expect(m).toMatchObject({
      deckId: "test-deck",
      total: 5,
      mastered: 1, // word-0
      shaky: 1, // word-1
      seen: 3, // words 0–2 have stats
    });
    expect(m.untouched).toBe(2); // words 3–4
  });

  it("counts a deck nobody has opened as untouched, not as 0% mastered", () => {
    const m = deckMastery(deck, {}, {}, "listener");
    expect(m.seen).toBe(0);
    expect(m.untouched).toBe(5);
    expect(m.everOpened).toBe(false);
  });

  it("treats a deck with plays but no answers as opened", () => {
    // Las tarjetas records no answers; playing it still means they were there.
    const m = deckMastery(deck, {}, { "listener:test-deck:learn": 3 }, "listener");
    expect(m.everOpened).toBe(true);
    expect(m.plays).toBe(3);
  });

  it("sums plays across every activity of that deck, for that kid only", () => {
    const counts = {
      "listener:test-deck:learn": 4,
      "listener:test-deck:quiz-listen": 6,
      "reader:test-deck:quiz-read": 9, // the other kid
      "listener:other-deck:learn": 7, // another deck
    };
    expect(deckMastery(deck, stats, counts, "listener").plays).toBe(10);
  });

  it("never counts a word twice — mastered, shaky and untouched fill the deck", () => {
    const m = deckMastery(deck, stats, {}, "listener");
    expect(m.mastered + m.shaky + m.untouched).toBeLessThanOrEqual(m.total);
    expect(m.seen + m.untouched).toBe(m.total);
  });
});

describe("gamesPlayed", () => {
  const counts = {
    "listener:animals:quiz-listen": 5,
    "listener:food:quiz-listen": 3,
    "listener:animals:learn": 9,
    "listener:animals:globo": 1,
    "reader:animals:quiz-read": 40, // the other kid never leaks in
  };

  it("sums each game across decks and sorts by most played", () => {
    const played = gamesPlayed(counts, "listener");
    expect(played.slice(0, 3)).toEqual([
      { activity: "learn", plays: 9 },
      { activity: "quiz-listen", plays: 8 },
      { activity: "globo", plays: 1 },
    ]);
  });

  it("includes never-played games at zero, so the gaps are visible", () => {
    const played = gamesPlayed(counts, "listener");
    const adivina = played.find((p) => p.activity === "adivina");
    expect(adivina).toEqual({ activity: "adivina", plays: 0 });
    // Every activity the app can record shows up exactly once.
    expect(new Set(played.map((p) => p.activity)).size).toBe(played.length);
  });

  it("reports nothing played as all zeroes rather than an empty list", () => {
    const played = gamesPlayed({}, "reader");
    expect(played.length).toBeGreaterThan(0);
    expect(played.every((p) => p.plays === 0)).toBe(true);
  });

  it("ignores malformed keys instead of throwing", () => {
    expect(() => gamesPlayed({ nonsense: 3, "a:b": 1 }, "listener")).not.toThrow();
    expect(totalPlays({ nonsense: 3 }, "listener")).toBe(0);
  });
});

describe("GetKidReportUseCase", () => {
  class FakeStats implements WordStatsStore {
    constructor(private readonly value: WordStats) {}
    load() {
      return Promise.resolve(this.value);
    }
    save() {
      return Promise.resolve();
    }
  }
  class FakeCounts implements StickerCountsStore {
    saves = 0;
    constructor(private readonly value: Readonly<Record<string, number>>) {}
    load() {
      return Promise.resolve(this.value);
    }
    save() {
      this.saves += 1;
      return Promise.resolve();
    }
  }

  it("composes the whole screen from one read, and writes nothing", async () => {
    const counts = new FakeCounts({ "listener:test-deck:quiz-listen": 4 });
    const report = await new GetKidReportUseCase(
      new FakeStats(stats),
      counts,
    ).execute("listener", [deck]);

    expect(report.kid).toBe("listener");
    expect(report.decks).toHaveLength(1);
    expect(report.mastered).toBe(1);
    expect(report.totalWords).toBe(5);
    expect(report.totalPlays).toBe(4);
    expect(report.untouchedDecks).toBe(0);
    expect(report.struggling[0]?.cards.map((c) => c.id)).toEqual(["word-1"]);
    expect(counts.saves).toBe(0); // reading the report must not change it
  });

  it("reports an untouched pack honestly rather than as zero progress", async () => {
    const report = await new GetKidReportUseCase(
      new FakeStats({}),
      new FakeCounts({}),
    ).execute("reader", [deck]);
    expect(report.mastered).toBe(0);
    expect(report.untouchedDecks).toBe(1);
    expect(report.struggling).toEqual([]);
    expect(report.games.every((g) => g.plays === 0)).toBe(true);
  });
});

describe("strugglingByDeck", () => {
  const other: Deck = {
    id: "other-deck",
    nameSpanish: "Otra",
    nameEnglish: "Other",
    emoji: "🧫",
    cards: [card(10), card(11)],
  };
  const wide: WordStats = {
    ...stats,
    "word-10": { right: 0, wrong: 5 }, // worst of all
    "word-11": { right: 2, wrong: 2 },
  };

  it("groups struggling words under their deck, worst deck first", () => {
    const groups = strugglingByDeck([deck, other], wide);
    expect(groups.map((g) => g.deckId)).toEqual(["other-deck", "test-deck"]);
    expect(groups[0]!.cards.map((c) => c.id)).toEqual(["word-10", "word-11"]);
    expect(groups[1]!.cards.map((c) => c.id)).toEqual(["word-1"]);
  });

  it("omits decks with nothing struggling", () => {
    expect(strugglingByDeck([deck, other], stats).map((g) => g.deckId)).toEqual([
      "test-deck",
    ]);
  });

  it("is empty when nothing is struggling at all", () => {
    expect(strugglingByDeck([deck, other], {})).toEqual([]);
  });

  it("skips secret decks the kid has not unlocked, like the informe does", () => {
    const secret: Deck = { ...other, id: "secret-deck", secret: true };
    const groups = strugglingByDeck([deck, secret], wide);
    expect(groups.map((g) => g.deckId)).toEqual(["test-deck"]);
  });
});
