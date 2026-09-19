import { beforeEach, describe, expect, it } from "vitest";
import { SitExamUseCase } from "../src/application/sit-exam";
import { StartExamUseCase } from "../src/application/start-exam";
import { EXAM_PASS_MARK, EXAM_QUESTIONS } from "../src/domain/exam";
import { EXAM_BONUS, walletBalance } from "../src/domain/stars";
import type { Deck } from "../src/domain/deck";
import type { DeckGroup } from "../src/domain/deck-group";
import type { KidId } from "../src/domain/kid";
import { card } from "./helpers";
import { FakeEconomyStore } from "./fakes";

const KID: KidId = "listener";

function testDeck(id: string, size = 12): Deck {
  return {
    id,
    nameSpanish: id,
    nameEnglish: id,
    emoji: "🧪",
    cards: Array.from({ length: size }, (_, i) => card(i + 1, `${id}-${i + 1}`)),
  };
}

const groups: readonly DeckGroup[] = [
  { id: "g1", nameSpanish: "g1", nameEnglish: "g1", emoji: "📦", deckIds: ["uno"] },
  { id: "g2", nameSpanish: "g2", nameEnglish: "g2", emoji: "📦", deckIds: ["dos"] },
];
const decks = [testDeck("uno"), testDeck("dos")];

const decksRepo = {
  listDecks: () => Promise.resolve(decks),
  getDeck: (id: string) => Promise.resolve(decks.find((d) => d.id === id) ?? null),
};
const groupsRepo = {
  listGroups: () => Promise.resolve(groups),
  listGroupsInTrailOrder: () => Promise.resolve(groups),
};
const statsStore = { load: () => Promise.resolve({}), save: () => Promise.resolve() };

let store: FakeEconomyStore;
let sit: SitExamUseCase;
let start: StartExamUseCase;

beforeEach(() => {
  store = new FakeEconomyStore();
  sit = new SitExamUseCase(store, decksRepo, groupsRepo, statsStore);
  start = new StartExamUseCase(decksRepo, groupsRepo, statsStore, () => Math.random());
});

describe("StartExamUseCase", () => {
  it("deals a full exam for a shelf", async () => {
    const exam = await start.execute(KID, "g1");
    expect(exam.rounds).toHaveLength(EXAM_QUESTIONS);
  });
});

describe("SitExamUseCase — passing", () => {
  it("pays EXAM_BONUS, the biggest prize in the app", async () => {
    const outcome = await sit.execute(KID, "g1", EXAM_PASS_MARK);
    expect(outcome.passed).toBe(true);
    expect(outcome.stars).toBe(EXAM_BONUS);
    expect(walletBalance(store.loadWallet(KID))).toBe(EXAM_BONUS);
  });

  it("records the score so the next shelf unlocks", async () => {
    await sit.execute(KID, "g1", EXAM_QUESTIONS);
    expect(store.loadExamRecords(KID).g1).toEqual({
      bestScore: EXAM_QUESTIONS,
      attempts: 1,
    });
  });

  it("clears any practice the kid was sitting under", async () => {
    await sit.execute(KID, "g1", 2);
    expect(store.loadExamPractice(KID)).not.toBeNull();
    await sit.execute(KID, "g1", EXAM_PASS_MARK);
    expect(store.loadExamPractice(KID)).toBeNull();
  });

  it("pays the bonus only the first time — a re-sit is not a second payday", async () => {
    await sit.execute(KID, "g1", EXAM_QUESTIONS);
    const second = await sit.execute(KID, "g1", EXAM_QUESTIONS);
    expect(second.stars).toBe(0);
    expect(walletBalance(store.loadWallet(KID))).toBe(EXAM_BONUS);
  });
});

describe("SitExamUseCase — failing", () => {
  it("pays nothing", async () => {
    const outcome = await sit.execute(KID, "g1", EXAM_PASS_MARK - 1);
    expect(outcome.passed).toBe(false);
    expect(outcome.stars).toBe(0);
    expect(walletBalance(store.loadWallet(KID))).toBe(0);
  });

  it("always names a deck to go and play", async () => {
    // ADR 021: the route may never say "no" without saying "do this instead".
    const outcome = await sit.execute(KID, "g1", 0);
    expect(outcome.practiceDeckId).toBe("uno");
  });

  it("puts the retry behind that deck being played again", async () => {
    await sit.execute(KID, "g1", 3);
    const practice = store.loadExamPractice(KID);
    expect(practice).toMatchObject({ groupId: "g1", deckId: "uno" });
  });

  it("still counts the attempt and keeps the best score", async () => {
    await sit.execute(KID, "g1", 5);
    await sit.execute(KID, "g1", 3);
    expect(store.loadExamRecords(KID).g1).toEqual({ bestScore: 5, attempts: 2 });
  });

  it("never lets a failed re-sit close a gate that is already open", async () => {
    await sit.execute(KID, "g1", EXAM_QUESTIONS);
    await sit.execute(KID, "g1", 0);
    expect(store.loadExamRecords(KID).g1?.bestScore).toBe(EXAM_QUESTIONS);
    expect(store.loadExamPractice(KID)).toBeNull();
  });
});
