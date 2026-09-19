import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeStorage, type FakeStorage } from "./storage";

/**
 * The localStorage adapter for the EconomyStore port. Its contract is failure
 * tolerance: a corrupt document costs only the corrupt entries, and a refused
 * write never reaches a component as an exception.
 */

const COUNTS = "palabras.sticker-counts.v1";
const WALLET = "palabras.wallet.v1";
const MISSION = "palabras.mission.v1";

async function freshStore() {
  vi.resetModules(); // the migration gate is module state
  const mod = await import("@/lib/economy-store");
  return new mod.LocalStorageEconomyStore();
}

let fake: FakeStorage;
beforeEach(() => {
  fake = installFakeStorage();
});

describe("loadStickerCounts", () => {
  it("drops a count stored as a string, which the award would concatenate", async () => {
    // The 2026-08-31 defect: AwardStickerUseCase does `previous + 1`, so "3"
    // became "31" — gold on one play, and growing by concatenation after.
    fake.data.set(
      COUNTS,
      JSON.stringify({
        "listener:animals:quiz": "3",
        "reader:casa:memory": 2,
      }),
    );
    const store = await freshStore();
    const counts = store.loadStickerCounts();
    expect(counts).toEqual({ "reader:casa:memory": 2 });
    expect(typeof counts["listener:animals:quiz"]).toBe("undefined");
  });

  it("drops ids the album can never contain and counts out of range", async () => {
    fake.data.set(
      COUNTS,
      JSON.stringify({
        "listener:animals:quiz": 4,
        "animals:quiz": 9, // shared-era shape, never written to this key
        "nobody:casa:quiz": 5, // not a kid
        "reader:a:quiz": 0, // zero is an absent sticker
        "reader:b:quiz": -3,
        "reader:c:quiz": 2.5,
      }),
    );
    const store = await freshStore();
    expect(store.loadStickerCounts()).toEqual({ "listener:animals:quiz": 4 });
  });

  it("keeps an intact document whole", async () => {
    const good = { "listener:animals:quiz": 4, "reader:casa:memory": 1 };
    fake.data.set(COUNTS, JSON.stringify(good));
    const store = await freshStore();
    expect(store.loadStickerCounts()).toEqual(good);
  });

  it("reads an unparseable document as empty instead of throwing", async () => {
    fake.data.set(COUNTS, "{not json");
    const store = await freshStore();
    expect(store.loadStickerCounts()).toEqual({});
  });

  it("survives a storage that refuses reads", async () => {
    const store = await freshStore();
    fake.failReads();
    expect(store.loadStickerCounts()).toEqual({});
  });
});

describe("failure tolerance of the write path", () => {
  it("swallows a refused write rather than surfacing it mid-game", async () => {
    // Deliberate, and the known cost: a full quota loses the session silently.
    // Pinned here so the day that behaviour changes, it changes on purpose.
    const store = await freshStore();
    fake.failWrites();
    expect(() => store.saveWallet("listener", { earned: 5, spent: 0 })).not.toThrow();
    expect(() => store.saveStickerCounts({ "listener:a:quiz": 1 })).not.toThrow();
  });

  it("round-trips a wallet through storage", async () => {
    const store = await freshStore();
    store.saveWallet("listener", { earned: 12, spent: 5 });
    expect(store.loadWallet("listener")).toEqual({ earned: 12, spent: 5 });
    // The doc is kid-keyed and epoch 3 seeds a wallet for every kid, so assert
    // this kid's entry rather than the whole document.
    const doc = JSON.parse(fake.data.get(WALLET)!) as Record<string, unknown>;
    expect(doc.listener).toEqual({ earned: 12, spent: 5 });
    expect(Object.keys(doc)).toContain("reader");
  });

  it("falls back to an empty wallet on a malformed one", async () => {
    fake.data.set(WALLET, JSON.stringify({ listener: { earned: "lots" } }));
    const store = await freshStore();
    expect(store.loadWallet("listener")).toEqual({ earned: 0, spent: 0 });
  });

  it("reads a mission that fails its core guard as absent", async () => {
    fake.data.set(MISSION, JSON.stringify({ listener: { nonsense: true } }));
    const store = await freshStore();
    expect(store.loadMission("listener")).toBeNull();
  });
});

describe("the migration gate", () => {
  it("runs migrations on the first read", async () => {
    const store = await freshStore();
    store.loadWallet("listener");
    expect(fake.data.get("palabras.migrations.v1")).toBeDefined();
  });

  it("runs migrations on a write that lands before any read", async () => {
    const store = await freshStore();
    store.saveStickerCounts({ "listener:animals:quiz": 1 });
    expect(fake.data.get("palabras.migrations.v1")).toBeDefined();
  });
});

const EXAMS = "palabras.exams.v1";
const PRACTICE = "palabras.exam-practice.v1";

describe("exam records (ADR 022)", () => {
  it("round-trips a shelf's record", async () => {
    const store = await freshStore();
    store.saveExamRecords("listener", { animales: { bestScore: 8, attempts: 2 } });
    expect(store.loadExamRecords("listener")).toEqual({
      animales: { bestScore: 8, attempts: 2 },
    });
  });

  it("reads an absent document as no exams ever sat", async () => {
    const store = await freshStore();
    expect(store.loadExamRecords("listener")).toEqual({});
  });

  it("salvages per shelf, so one bad entry does not cost every other pass", async () => {
    fake.data.set(
      EXAMS,
      JSON.stringify({
        listener: {
          animales: { bestScore: 9, attempts: 1 },
          casa: { bestScore: "lots", attempts: 1 },
          comida: { bestScore: -3, attempts: 1 },
        },
      }),
    );
    const store = await freshStore();
    expect(store.loadExamRecords("listener")).toEqual({
      animales: { bestScore: 9, attempts: 1 },
    });
  });

  it("drops a corrupt document rather than throwing at a component", async () => {
    fake.data.set(EXAMS, "{not json");
    const store = await freshStore();
    expect(() => store.loadExamRecords("listener")).not.toThrow();
    expect(store.loadExamRecords("listener")).toEqual({});
  });

  it("keeps each kid's exams apart", async () => {
    const store = await freshStore();
    store.saveExamRecords("listener", { animales: { bestScore: 7, attempts: 1 } });
    store.saveExamRecords("reader", { animales: { bestScore: 10, attempts: 1 } });
    expect(store.loadExamRecords("listener").animales?.bestScore).toBe(7);
    expect(store.loadExamRecords("reader").animales?.bestScore).toBe(10);
  });
});

describe("the retry gate (device-local, ADR 022)", () => {
  it("round-trips and clears", async () => {
    const store = await freshStore();
    store.saveExamPractice("listener", {
      groupId: "animales",
      deckId: "zoo",
      mark: 12,
    });
    expect(store.loadExamPractice("listener")).toEqual({
      groupId: "animales",
      deckId: "zoo",
      mark: 12,
    });
    store.saveExamPractice("listener", null);
    expect(store.loadExamPractice("listener")).toBeNull();
  });

  it("rejects a malformed gate rather than locking a kid out on garbage", async () => {
    fake.data.set(PRACTICE, JSON.stringify({ listener: { deckId: "zoo" } }));
    const store = await freshStore();
    expect(store.loadExamPractice("listener")).toBeNull();
  });
});

const UNLOCKED_SHELVES = "palabras.unlocked-shelves.v1";

describe("la llave de papá (ADR 022 addendum)", () => {
  it("round-trips the shelves a grown-up opened", async () => {
    const store = await freshStore();
    store.saveUnlockedShelves("listener", ["comida", "transporte"]);
    expect(store.loadUnlockedShelves("listener")).toEqual(["comida", "transporte"]);
  });

  it("reads an absent document as no keys used", async () => {
    const store = await freshStore();
    expect(store.loadUnlockedShelves("listener")).toEqual([]);
  });

  it("drops non-string entries rather than trusting the document", async () => {
    fake.data.set(
      UNLOCKED_SHELVES,
      JSON.stringify({ listener: ["comida", 7, null, "", "verbos"] }),
    );
    const store = await freshStore();
    expect(store.loadUnlockedShelves("listener")).toEqual(["comida", "verbos"]);
  });

  it("survives a corrupt document without throwing at a component", async () => {
    fake.data.set(UNLOCKED_SHELVES, "{not json");
    const store = await freshStore();
    expect(() => store.loadUnlockedShelves("listener")).not.toThrow();
    expect(store.loadUnlockedShelves("listener")).toEqual([]);
  });

  it("keeps each kid's keys apart", async () => {
    const store = await freshStore();
    store.saveUnlockedShelves("listener", ["comida"]);
    store.saveUnlockedShelves("reader", ["verbos"]);
    expect(store.loadUnlockedShelves("listener")).toEqual(["comida"]);
    expect(store.loadUnlockedShelves("reader")).toEqual(["verbos"]);
  });
});
