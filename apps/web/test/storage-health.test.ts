import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeStorage, type FakeStorage } from "./storage";

/**
 * The parent-visible side of a refused write.
 *
 * Every local store swallows a failed `setItem` on purpose — one bad write
 * must never take a game down — which leaves a permanently failing device
 * indistinguishable from a healthy one. These pin the part that closes that
 * gap: a genuine quota failure is remembered, and nothing else is mistaken
 * for one.
 */

async function fresh() {
  vi.resetModules(); // the record is module state, which is the point of it
  return await import("@/lib/storage-health");
}

let fake: FakeStorage;
beforeEach(() => {
  fake = installFakeStorage();
});

describe("isQuotaError", () => {
  it("recognises the quota exception browsers actually throw", async () => {
    const { isQuotaError } = await fresh();
    expect(isQuotaError(new DOMException("full", "QuotaExceededError"))).toBe(true);
    expect(isQuotaError(new DOMException("full", "NS_ERROR_DOM_QUOTA_REACHED"))).toBe(true);
  });

  it("does not mistake a disabled store for a full one", async () => {
    // "Your device is full" is the wrong thing to tell a parent whose storage
    // is merely switched off, and it points them at the wrong fix.
    const { isQuotaError } = await fresh();
    expect(isQuotaError(new DOMException("denied", "SecurityError"))).toBe(false);
    expect(isQuotaError(new SyntaxError("bad json"))).toBe(false);
    expect(isQuotaError("quota exceeded")).toBe(false);
    expect(isQuotaError(null)).toBe(false);
  });
});

describe("noteStorageRefused", () => {
  it("starts clean, so a healthy device says nothing", async () => {
    const { getStorageHealth } = await fresh();
    expect(getStorageHealth().full).toBe(false);
  });

  it("remembers a quota failure, with which store hit it", async () => {
    const { getStorageHealth, noteStorageRefused } = await fresh();
    noteStorageRefused("album", new DOMException("full", "QuotaExceededError"));
    const health = getStorageHealth();
    expect(health.full).toBe(true);
    expect(health.tag).toBe("album");
    expect(health.since).toBeTypeOf("number");
  });

  it("ignores a failure that is not about space", async () => {
    const { getStorageHealth, noteStorageRefused } = await fresh();
    noteStorageRefused("album", new DOMException("denied", "SecurityError"));
    expect(getStorageHealth().full).toBe(false);
  });

  it("survives the very condition it reports — it needs no write of its own", async () => {
    // The whole reason the record is in memory: if it needed storage to
    // persist, the one case it exists for is the case it could not record.
    const { getStorageHealth, noteStorageRefused } = await fresh();
    fake.failWrites();
    noteStorageRefused("album", new DOMException("full", "QuotaExceededError"));
    expect(getStorageHealth().full).toBe(true);
  });
});

describe("subscribeStorageHealth", () => {
  it("tells a watcher that mounted BEFORE the write failed", async () => {
    // The defect this pins, caught by /verify against a refusing storage: the
    // parent's report mounts and only THEN loads the data whose write fails,
    // so a component that read the flag once on mount asked before there was
    // anything to know and stayed silent for the rest of the session.
    const { noteStorageRefused, subscribeStorageHealth } = await fresh();
    let told = 0;
    subscribeStorageHealth(() => (told += 1));
    expect(told).toBe(0);
    noteStorageRefused("trend", new DOMException("full", "QuotaExceededError"));
    expect(told).toBe(1);
  });

  it("fires once, not on every subsequent refused write", async () => {
    // Once it is full every write fails; re-rendering per failure would be a
    // storm for a state that cannot change back.
    const { noteStorageRefused, subscribeStorageHealth } = await fresh();
    let told = 0;
    subscribeStorageHealth(() => (told += 1));
    const full = () => new DOMException("full", "QuotaExceededError");
    noteStorageRefused("album", full());
    noteStorageRefused("economy", full());
    noteStorageRefused("word-stats", full());
    expect(told).toBe(1);
  });

  it("stops telling an unsubscribed watcher", async () => {
    const { noteStorageRefused, subscribeStorageHealth } = await fresh();
    let told = 0;
    subscribeStorageHealth(() => (told += 1))();
    noteStorageRefused("album", new DOMException("full", "QuotaExceededError"));
    expect(told).toBe(0);
  });
});

describe("the stores report it", () => {
  it("raises the flag when the album cannot persist a sticker", async () => {
    // The concrete loss this exists for: a sticker the kid earned is gone,
    // and before this nothing anywhere said so (docs/bugs.md).
    vi.resetModules();
    const { getStorageHealth } = await import("@/lib/storage-health");
    const { LocalStorageAlbumStore } = await import("@/lib/album-store");
    fake.failWrites();
    await new LocalStorageAlbumStore().save(["listener:animales:learn"]);
    expect(getStorageHealth().full).toBe(true);
  });

  it("still resolves rather than throwing, so a game never dies on a full disk", async () => {
    vi.resetModules();
    const { LocalStorageAlbumStore } = await import("@/lib/album-store");
    fake.failWrites();
    await expect(
      new LocalStorageAlbumStore().save(["listener:animales:learn"]),
    ).resolves.toBeUndefined();
  });
});
