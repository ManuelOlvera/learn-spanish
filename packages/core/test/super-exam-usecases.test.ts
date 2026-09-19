import { beforeEach, describe, expect, it } from "vitest";
import { SitExamUseCase } from "../src/application/sit-exam";
import { UnlockShelfUseCase } from "../src/application/unlock-shelf";
import {
  EXAM_PASS_MARK,
  SUPER_EXAM_PASS_MARK,
  SUPER_EXAM_QUESTIONS,
} from "../src/domain/exam";
import { EXAM_BONUS, SUPER_EXAM_BONUS, walletBalance } from "../src/domain/stars";
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

const LADDER: readonly DeckGroup[] = Array.from({ length: 12 }, (_, i) => ({
  id: `g${i + 1}`,
  nameSpanish: `g${i + 1}`,
  nameEnglish: `g${i + 1}`,
  emoji: "📦",
  deckIds: [`d${i + 1}`],
}));
const DECKS = Array.from({ length: 12 }, (_, i) => testDeck(`d${i + 1}`));

const decksRepo = {
  listDecks: () => Promise.resolve(DECKS),
  getDeck: (id: string) => Promise.resolve(DECKS.find((d) => d.id === id) ?? null),
};
const groupsRepo = {
  listGroups: () => Promise.resolve(LADDER),
  listGroupsInTrailOrder: () => Promise.resolve(LADDER),
};
const statsStore = { load: () => Promise.resolve({}), save: () => Promise.resolve() };

let store: FakeEconomyStore;
let sit: SitExamUseCase;

beforeEach(() => {
  store = new FakeEconomyStore();
  sit = new SitExamUseCase(store, decksRepo, groupsRepo, statsStore);
});

describe("sitting a súper examen", () => {
  it("pays SUPER_EXAM_BONUS, not the regular one", async () => {
    const outcome = await sit.execute(KID, "g4", SUPER_EXAM_PASS_MARK);
    expect(outcome.passed).toBe(true);
    expect(outcome.stars).toBe(SUPER_EXAM_BONUS);
    expect(walletBalance(store.loadWallet(KID))).toBe(SUPER_EXAM_BONUS);
  });

  it("still pays the regular bonus on a regular shelf", async () => {
    const outcome = await sit.execute(KID, "g3", EXAM_PASS_MARK);
    expect(outcome.stars).toBe(EXAM_BONUS);
  });

  it("refuses a score that would have passed a regular exam", async () => {
    const outcome = await sit.execute(KID, "g4", EXAM_PASS_MARK);
    expect(outcome.passed).toBe(false);
    expect(outcome.stars).toBe(0);
  });

  it("passes at the súper mark exactly", async () => {
    expect((await sit.execute(KID, "g4", SUPER_EXAM_PASS_MARK - 1)).passed).toBe(false);
    expect((await sit.execute(KID, "g4", SUPER_EXAM_PASS_MARK)).passed).toBe(true);
  });

  it("pays the big bonus only once", async () => {
    await sit.execute(KID, "g8", SUPER_EXAM_QUESTIONS);
    const again = await sit.execute(KID, "g8", SUPER_EXAM_QUESTIONS);
    expect(again.stars).toBe(0);
    expect(walletBalance(store.loadWallet(KID))).toBe(SUPER_EXAM_BONUS);
  });

  it("nominates practice from ALL prior shelves, not just the one behind it", async () => {
    // A cumulative exam that sent a kid back to one shelf would be pointing at
    // a fraction of what it just tested (ADR 021 addendum).
    const weak = {
      load: () => Promise.resolve({ "d1-1": { right: 0, wrong: 9 } }),
      save: () => Promise.resolve(),
    };
    const sitWeak = new SitExamUseCase(store, decksRepo, groupsRepo, weak);
    const outcome = await sitWeak.execute(KID, "g4", 2);
    expect(outcome.practiceDeckId).toBe("d1");
  });

  it("still nominates from the shelf itself on a regular exam", async () => {
    const weak = {
      load: () => Promise.resolve({ "d1-1": { right: 0, wrong: 9 } }),
      save: () => Promise.resolve(),
    };
    const sitWeak = new SitExamUseCase(store, decksRepo, groupsRepo, weak);
    const outcome = await sitWeak.execute(KID, "g3", 0);
    expect(outcome.practiceDeckId).toBe("d3");
  });
});

describe("UnlockShelfUseCase — la llave de papá", () => {
  it("opens the shelf a grown-up named", () => {
    const unlock = new UnlockShelfUseCase(store);
    expect(unlock.execute(KID, "g7")).toEqual(["g7"]);
    expect(store.loadUnlockedShelves(KID)).toEqual(["g7"]);
  });

  it("accumulates rather than replacing", () => {
    const unlock = new UnlockShelfUseCase(store);
    unlock.execute(KID, "g7");
    expect([...unlock.execute(KID, "g9")].sort()).toEqual(["g7", "g9"]);
  });

  it("is idempotent — opening twice is opening once", () => {
    const unlock = new UnlockShelfUseCase(store);
    unlock.execute(KID, "g7");
    expect(unlock.execute(KID, "g7")).toEqual(["g7"]);
  });

  it("keeps each kid's keys apart", () => {
    const unlock = new UnlockShelfUseCase(store);
    unlock.execute("listener", "g7");
    unlock.execute("reader", "g2");
    expect(store.loadUnlockedShelves("listener")).toEqual(["g7"]);
    expect(store.loadUnlockedShelves("reader")).toEqual(["g2"]);
  });
});
