import { describe, expect, it } from "vitest";
import {
  pickReviewCards,
  recordAnswer,
  recordReviewAnswer,
  REVIEW_MIN,
  weakScore,
} from "../src/domain/word-stats";
import { createQuiz } from "../src/domain/quiz";
import { decodeProgress, encodeProgress, mergeProgress } from "../src/domain/transfer";
import { deckOf, seededRandom } from "./helpers";

describe("recordAnswer", () => {
  it("accumulates rights and wrongs per word without mutating", () => {
    const empty = {};
    const once = recordAnswer(empty, "gato", false);
    const twice = recordAnswer(once, "gato", true);
    expect(empty).toEqual({});
    expect(twice.gato).toEqual({ right: 1, wrong: 1 });
  });
});

describe("recordReviewAnswer", () => {
  it("forgives one prior miss on a correct review answer, so a lightly-missed word clears", () => {
    // A word flagged by a single miss (weakScore 2) must leave the weak set
    // after one correct repaso answer — one right can't offset a double-weighted
    // wrong under recordAnswer, so review heals the wrong instead.
    const flagged = { gato: { right: 0, wrong: 1 } };
    const healed = recordReviewAnswer(flagged, "gato", true);
    expect(healed.gato).toEqual({ right: 1, wrong: 0 });
    expect(weakScore(healed.gato!)).toBeLessThanOrEqual(0);
  });

  it("never drives the wrong tally below zero", () => {
    const healed = recordReviewAnswer({ gato: { right: 2, wrong: 0 } }, "gato", true);
    expect(healed.gato).toEqual({ right: 3, wrong: 0 });
  });

  it("still counts a fumbled review answer as a miss", () => {
    const worse = recordReviewAnswer({ gato: { right: 0, wrong: 1 } }, "gato", false);
    expect(worse.gato).toEqual({ right: 0, wrong: 2 });
  });

  it("does not mutate the input stats", () => {
    const before = { gato: { right: 0, wrong: 1 } };
    recordReviewAnswer(before, "gato", true);
    expect(before.gato).toEqual({ right: 0, wrong: 1 });
  });
});

describe("weakScore and pickReviewCards", () => {
  it("ranks words by how much they struggle", () => {
    expect(weakScore({ right: 0, wrong: 2 })).toBeGreaterThan(
      weakScore({ right: 3, wrong: 2 }),
    );
    expect(weakScore({ right: 5, wrong: 1 })).toBeLessThanOrEqual(0);
  });

  it("picks only struggling words, worst first, capped", () => {
    const cards = deckOf(6).cards;
    const stats = {
      [cards[0]!.id]: { right: 0, wrong: 3 },
      [cards[1]!.id]: { right: 5, wrong: 0 },
      [cards[2]!.id]: { right: 0, wrong: 1 },
    };
    const picked = pickReviewCards(cards, stats, 5);
    expect(picked.map((c) => c.id)).toEqual([cards[0]!.id, cards[2]!.id]);
    expect(pickReviewCards(cards, stats, 1)).toHaveLength(1);
    expect(REVIEW_MIN).toBeGreaterThan(0);
  });
});

describe("createQuiz with stats", () => {
  it("keeps historical behavior when no stats are given", () => {
    const a = createQuiz(deckOf(12), "listen", seededRandom(7));
    const b = createQuiz(deckOf(12), "listen", seededRandom(7));
    expect(a.rounds.map((r) => r.answer.id)).toEqual(
      b.rounds.map((r) => r.answer.id),
    );
  });

  it("pulls heavily-missed words into the quiz", () => {
    const deck = deckOf(15); // 8 of 15 make a quiz; weight the last card hard
    const struggling = deck.cards[14]!.id;
    const stats = { [struggling]: { right: 0, wrong: 8 } };
    let appearances = 0;
    for (let seed = 0; seed < 20; seed++) {
      const quiz = createQuiz(deck, "listen", seededRandom(seed), stats);
      if (quiz.rounds.some((r) => r.answer.id === struggling)) appearances++;
    }
    // ~53% by chance; weighting should make it near-certain.
    expect(appearances).toBeGreaterThanOrEqual(18);
  });
});

describe("stats travel in transfer codes", () => {
  it("round-trips and merges with per-word maxima", () => {
    const a = {
      stickers: [],
      streaks: {},
      avatars: {},
      stats: { listener: { gato: { right: 2, wrong: 5 } } },
    };
    const b = {
      stickers: [],
      streaks: {},
      avatars: {},
      stats: { listener: { gato: { right: 4, wrong: 1 }, perro: { right: 1, wrong: 0 } } },
    };
    const decoded = decodeProgress(encodeProgress(a));
    expect(decoded.stats).toEqual(a.stats);
    const merged = mergeProgress(a, b);
    expect(merged.stats?.listener).toEqual({
      gato: { right: 4, wrong: 5 },
      perro: { right: 1, wrong: 0 },
    });
  });

  it("still decodes codes without stats (older app versions)", () => {
    const decoded = decodeProgress(
      encodeProgress({ stickers: [], streaks: {}, avatars: {} }),
    );
    expect(decoded.stats ?? {}).toEqual({});
  });
});
