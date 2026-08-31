import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeStorage, readDocRaw, type FakeStorage } from "./storage";

/**
 * The run-once migration registry (`src/lib/storage-migrations.ts`).
 *
 * These exist because the 2026-08-31 review found a defect here that no
 * click-through can reach: a migration only misbehaves when an *earlier* one
 * fails, and on a healthy device none of them ever do.
 */

const APPLIED = "palabras.migrations.v1";
const PET_V1 = "palabras.pet.v1";
const PETS_V2 = "palabras.pets.v2";
const STARS = "palabras.stars.v1";
const WALLET = "palabras.wallet.v1";
const WARDROBE = "palabras.owned-accessories.v1";
const AVATARS = "palabras.avatars.v1";
/** The 🐸 seed from core's WALLET_SEED_BY_AVATAR (ADR 007). */
const FROG_SEED = 1000;

/** Fresh module each time — the applied-set gate is module state. */
async function loadMigrations() {
  vi.resetModules();
  return (await import("@/lib/storage-migrations")).runStorageMigrations;
}

const applied = (fake: FakeStorage): string[] =>
  JSON.parse(fake.data.get(APPLIED) ?? "[]") as string[];

let fake: FakeStorage;
beforeEach(() => {
  fake = installFakeStorage();
  vi.restoreAllMocks();
});

describe("runStorageMigrations", () => {
  it("applies every migration once, in order, on a fresh device", async () => {
    const run = await loadMigrations();
    run();
    expect(applied(fake)).toEqual([
      "pet-v1-to-collection",
      "accessories-to-wardrobe",
      "wallet-epoch-1",
      "wallet-epoch-2",
      "wallet-epoch-3",
      "outfits-per-form",
    ]);
  });

  it("does not re-run an already-applied migration", async () => {
    const run = await loadMigrations();
    run();
    // A wallet earned after the epochs must survive the next session.
    fake.data.set(WALLET, JSON.stringify({ listener: { earned: 42, spent: 7 } }));
    const runAgain = await loadMigrations();
    runAgain();
    expect(readDocRaw<{ earned: number }>(fake, WALLET).listener).toEqual({
      earned: 42,
      spent: 7,
    });
  });

  it("carries a legacy pet into the collection, wardrobe and outfit", async () => {
    fake.data.set(
      PET_V1,
      JSON.stringify({
        listener: { meals: 7, lastFed: null, accessories: ["gorro"] },
      }),
    );
    const run = await loadMigrations();
    run();

    const pets = readDocRaw<{ active: string; pets: Record<string, unknown> }>(
      fake,
      PETS_V2,
    );
    const collection = pets.listener!;
    const seated = collection.pets[collection.active] as {
      meals: number;
      outfits?: Record<string, { worn: string[] }>;
    };
    expect(seated.meals).toBe(7);
    expect(Object.values(seated.outfits ?? {})[0]?.worn).toEqual(["gorro"]);
    expect(readDocRaw<string[]>(fake, WARDROBE).listener).toEqual(["gorro"]);
  });

  /**
   * The regression the review found. `wallet-epoch-3` converts the balance in
   * `stars.v1` into the counter wallet and is idempotent by the presence of
   * `wallet.v1` — so if it runs before `wallet-epoch-2` has seeded that
   * balance, it locks in a zero and can never run again. Epoch 2 then retries
   * successfully, writes the seed nobody will ever convert, and the kid's
   * restored balance (ADR 007) is gone for good.
   */
  it("holds a migration back when the one it reads has not succeeded", async () => {
    // Only 🐸 and 🐯 carry an ADR 007 seed, so the kid must wear one for
    // epoch 2 to write anything at all.
    fake.data.set(AVATARS, JSON.stringify({ listener: "🐸" }));
    const run = await loadMigrations();

    // Fail only epoch 2's write. Epoch 1 also writes stars.v1, but it writes
    // zeroes; the seed value is written by epoch 2 and nothing else.
    const realSet = fake.setItem.bind(fake);
    let blockSeed = true;
    vi.spyOn(fake, "setItem").mockImplementation((k: string, v: string) => {
      if (blockSeed && k === STARS && v.includes(String(FROG_SEED))) {
        throw new DOMException("quota exceeded", "QuotaExceededError");
      }
      realSet(k, v);
    });

    run();

    // Epoch 2 failed, so epoch 3 must NOT have claimed itself as done.
    expect(applied(fake)).not.toContain("wallet-epoch-2");
    expect(applied(fake)).not.toContain("wallet-epoch-3");
    // Independent migrations still ran — one bad key blocks only its dependents.
    expect(applied(fake)).toContain("pet-v1-to-collection");
    expect(applied(fake)).toContain("outfits-per-form");

    // Next session, storage is healthy again: both run, in order.
    blockSeed = false;
    const runAgain = await loadMigrations();
    runAgain();
    expect(applied(fake)).toContain("wallet-epoch-2");
    expect(applied(fake)).toContain("wallet-epoch-3");
    // And the seeded balance actually made it into the counter wallet, which
    // is the whole point: converting a zero here is silent, permanent loss.
    expect(readDocRaw<number>(fake, STARS).listener).toBe(FROG_SEED);
    const wallet = readDocRaw<{ earned: number; spent: number }>(fake, WALLET);
    expect(wallet.listener).toEqual({ earned: FROG_SEED, spent: 0 });
  });

  it("records nothing and survives when storage refuses every write", async () => {
    fake.failWrites();
    const run = await loadMigrations();
    expect(() => run()).not.toThrow();
    expect(fake.data.get(APPLIED)).toBeUndefined();
  });

  it("treats an unreadable applied set as 'none applied' rather than crashing", async () => {
    fake.data.set(APPLIED, "{not json");
    const run = await loadMigrations();
    expect(() => run()).not.toThrow();
    expect(applied(fake).length).toBeGreaterThan(0);
  });

  it("ignores non-string junk inside the applied set", async () => {
    fake.data.set(APPLIED, JSON.stringify([42, null, "wallet-epoch-1"]));
    const run = await loadMigrations();
    run();
    expect(applied(fake)).toContain("wallet-epoch-1");
    expect(applied(fake).every((id) => typeof id === "string")).toBe(true);
  });
});
