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
