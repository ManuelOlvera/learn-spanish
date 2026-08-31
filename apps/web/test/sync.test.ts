import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeStorage, type FakeStorage } from "./storage";

/**
 * Pairing-code persistence in `src/lib/sync.ts`.
 *
 * Persisting the code is what actually pairs the device, so it is the one
 * write in that file which must NOT be swallowed — the 2026-08-31 review's
 * finding 5. Everything here runs with sync configured via env, and `fetch`
 * stubbed, so no request ever leaves the test.
 */

const SYNC_KEY = "palabras.sync.v1";
const CODE = "A1B2C-3D4E5-F6G7H-8J9K0";

/** Load sync.ts with a configured backend and a stubbed transport. */
async function loadSync(rpc: (fn: string) => unknown = () => null) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-for-tests");
  vi.stubGlobal("fetch", (url: string) =>
    Promise.resolve(
      new Response(JSON.stringify(rpc(String(url).split("/").pop() ?? "")), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  return import("@/lib/sync");
}

let fake: FakeStorage;
beforeEach(() => {
  fake = installFakeStorage();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getSyncCode", () => {
  it("returns a stored code, canonicalized", async () => {
    fake.data.set(SYNC_KEY, CODE.toLowerCase());
    const sync = await loadSync();
    expect(sync.getSyncCode()).toBe(CODE);
    expect(sync.isPaired()).toBe(true);
  });

  it("treats a malformed stored code as unpaired", async () => {
    fake.data.set(SYNC_KEY, "not-a-code");
    const sync = await loadSync();
    expect(sync.getSyncCode()).toBeNull();
    expect(sync.isPaired()).toBe(false);
  });

  it("survives a storage that refuses reads", async () => {
    const sync = await loadSync();
    fake.failReads();
    expect(sync.getSyncCode()).toBeNull();
  });
});

describe("unpair", () => {
  it("clears the code", async () => {
    fake.data.set(SYNC_KEY, CODE);
    const sync = await loadSync();
    sync.unpair();
    expect(fake.data.has(SYNC_KEY)).toBe(false);
  });

  it("swallows a refused removal — the device is no worse off", async () => {
    fake.data.set(SYNC_KEY, CODE);
    const sync = await loadSync();
    fake.failWrites();
    expect(() => sync.unpair()).not.toThrow();
  });
});

describe("startHosting", () => {
  it("persists the code only after the seed push succeeds", async () => {
    const sync = await loadSync();
    const code = await sync.startHosting();
    expect(fake.data.get(SYNC_KEY)).toBe(code);
    expect(sync.isPaired()).toBe(true);
  });

  it("leaves the device unpaired when the seed push fails", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-for-tests");
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("Failed to fetch")));
    const sync = await import("@/lib/sync");
    await expect(sync.startHosting()).rejects.toThrow();
    // Nothing stored: a network failure must not leave a device "paired" to a
    // row that was never created.
    expect(fake.data.has(SYNC_KEY)).toBe(false);
  });

  /**
   * Finding 5. The push succeeded, so the cloud row exists — but the code
   * could not be written here, which means this device is NOT paired. Reporting
   * that as a network failure sent the parent to check an internet connection
   * that had just worked.
   */
  it("raises PairingNotStoredError when the code cannot be written", async () => {
    const sync = await loadSync();
    // Imported *after* loadSync: it calls vi.resetModules(), so importing core
    // first would hand this test a different class identity than the one
    // sync.ts throws. The real app has a single module graph and no such split.
    const { PairingNotStoredError } = await import("@learn-spanish/core");
    fake.failWrites();
    await expect(sync.startHosting()).rejects.toBeInstanceOf(PairingNotStoredError);
    expect(sync.isPaired()).toBe(false);
  });
});

describe("joinWithCode", () => {
  it("rejects a malformed code without touching the network", async () => {
    let called = false;
    const sync = await loadSync(() => {
      called = true;
      return null;
    });
    expect(await sync.joinWithCode("nope")).toBe("malformed");
    expect(called).toBe(false);
  });

  it("reports not-found when the row does not exist, and stays unpaired", async () => {
    const sync = await loadSync(() => null);
    expect(await sync.joinWithCode(CODE)).toBe("not-found");
    expect(fake.data.has(SYNC_KEY)).toBe(false);
  });

  it("accepts a code a parent misread, per the Crockford fold", async () => {
    // O for 0 and I for 1: the substitutions the alphabet exists to absorb.
    // Reaching "not-found" (not "malformed") is the proof it was accepted.
    const sync = await loadSync(() => null);
    expect(await sync.joinWithCode("AIB2C-3D4E5-F6G7H-8J9KO")).toBe("not-found");
  });

  it("stores the code after a successful join", async () => {
    const sync = await loadSync((fn) =>
      fn === "get_progress" ? { stickers: [], streaks: {}, avatars: {} } : null,
    );
    expect(await sync.joinWithCode(CODE)).toBe("joined");
    expect(fake.data.get(SYNC_KEY)).toBe(CODE);
  });
});
