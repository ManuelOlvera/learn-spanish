import { describe, expect, it } from "vitest";
import {
  buildSyncLink,
  generatePairingCode,
  isPairingCode,
  normalizePairingCode,
  parseSyncLink,
} from "../src/domain/sync";
import { DeleteProgressUseCase } from "../src/application/delete-progress";
import { PullProgressUseCase } from "../src/application/pull-progress";
import { PushProgressUseCase } from "../src/application/push-progress";
import type { RemoteProgressStore } from "../src/domain/sync";
import type { ProgressSnapshot } from "../src/domain/transfer";

/** A sequential byte source for deterministic code generation in tests. */
function bytesFrom(values: readonly number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

class FakeRemoteStore implements RemoteProgressStore {
  saves = 0;
  constructor(private rows: Record<string, ProgressSnapshot> = {}) {}
  load(code: string): Promise<ProgressSnapshot | null> {
    return Promise.resolve(this.rows[code] ?? null);
  }
  save(code: string, snapshot: ProgressSnapshot): Promise<void> {
    this.saves += 1;
    this.rows[code] = snapshot;
    return Promise.resolve();
  }
  delete(code: string): Promise<void> {
    delete this.rows[code];
    return Promise.resolve();
  }
}

const empty: ProgressSnapshot = { stickers: [], streaks: {}, avatars: {} };

describe("generatePairingCode", () => {
  it("produces a normalized, well-formed capability code", () => {
    const code = generatePairingCode(bytesFrom([0, 1, 2, 3, 4]));
    expect(isPairingCode(code)).toBe(true);
    expect(normalizePairingCode(code)).toBe(code);
  });

  it("maps distinct byte streams to distinct codes", () => {
    const a = generatePairingCode(bytesFrom([1, 2, 3]));
    const b = generatePairingCode(bytesFrom([9, 8, 7]));
    expect(a).not.toBe(b);
  });
});

describe("isPairingCode / normalizePairingCode", () => {
  it("accepts a grouped, lower-cased code and canonicalizes it", () => {
    const code = generatePairingCode(bytesFrom([5, 10, 15, 20, 25]));
    const messy = `  ${code.toLowerCase().replace(/-/g, " ")}  `;
    expect(normalizePairingCode(messy)).toBe(code);
    expect(isPairingCode(messy)).toBe(true);
  });

  it("rejects too-short or malformed input", () => {
    expect(isPairingCode("ABC")).toBe(false);
    expect(isPairingCode("")).toBe(false);
    expect(isPairingCode("!!!!-!!!!-!!!!-!!!!")).toBe(false);
  });
});

describe("buildSyncLink / parseSyncLink", () => {
  const code = generatePairingCode(bytesFrom([3, 14, 15, 9, 26]));

  it("round-trips a code through a link", () => {
    expect(parseSyncLink(buildSyncLink("https://palabras.app", code))).toBe(code);
  });

  it("puts the code in the FRAGMENT, never the query", () => {
    // The code is a capability key. A fragment is never sent to the server,
    // so it stays out of hosting request logs — the reason for this shape.
    const link = buildSyncLink("https://palabras.app", code);
    expect(link).toBe(`https://palabras.app/#sync=${code}`);
    expect(link).not.toContain("?");
  });

  it("normalizes a messy origin to exactly one slash", () => {
    expect(buildSyncLink("https://palabras.app/", code)).toBe(
      `https://palabras.app/#sync=${code}`,
    );
    expect(buildSyncLink("https://palabras.app///", code)).toBe(
      `https://palabras.app/#sync=${code}`,
    );
  });

  it("refuses to build a link around a malformed code", () => {
    expect(buildSyncLink("https://palabras.app", "NOPE")).toBe("");
    expect(buildSyncLink("", code)).toBe("");
  });

  it("accepts a bare fragment, so a caller can pass location.hash", () => {
    expect(parseSyncLink(`#sync=${code}`)).toBe(code);
  });

  it("canonicalizes a lower-cased or space-separated code from the link", () => {
    expect(parseSyncLink(`#sync=${code.toLowerCase()}`)).toBe(code);
    expect(parseSyncLink(`#sync=${encodeURIComponent(code.replace(/-/g, " "))}`)).toBe(
      code,
    );
  });

  it("ignores a code in the query string", () => {
    // Deliberate: only the fragment form is honored, so a link that would
    // have leaked the key to a server log is not silently made to work.
    expect(parseSyncLink(`https://palabras.app/?sync=${code}`)).toBe("");
  });

  it("returns empty for links with no code, or a malformed one", () => {
    expect(parseSyncLink("https://palabras.app/")).toBe("");
    expect(parseSyncLink("#sync=ABC")).toBe("");
    expect(parseSyncLink("#other=1")).toBe("");
    expect(parseSyncLink("")).toBe("");
  });

  it("finds the code alongside other fragment params", () => {
    expect(parseSyncLink(`#a=1&sync=${code}&b=2`)).toBe(code);
  });
});

describe("PullProgressUseCase", () => {
  it("returns local unchanged when no remote row exists yet", async () => {
    const store = new FakeRemoteStore();
    const local: ProgressSnapshot = { stickers: ["a:b:c"], streaks: {}, avatars: {} };
    const result = await new PullProgressUseCase(store).execute("CODE", () => Promise.resolve(local));
    expect(result).toEqual(local);
  });

  it("merges the remote snapshot into local without writing", async () => {
    const store = new FakeRemoteStore({
      CODE: { stickers: ["x:y:z"], streaks: {}, avatars: {}, freezes: { listener: 4 } },
    });
    const local: ProgressSnapshot = {
      stickers: ["a:b:c"],
      streaks: {},
      avatars: {},
      freezes: { listener: 1 },
    };
    const result = await new PullProgressUseCase(store).execute("CODE", () => Promise.resolve(local));
    expect(result.stickers).toEqual(["a:b:c", "x:y:z"]);
    expect(result.freezes).toEqual({ listener: 4 });
    expect(store.saves).toBe(0); // pull is read-only
  });
});

describe("DeleteProgressUseCase", () => {
  it("removes the cloud row for a code", async () => {
    const store = new FakeRemoteStore({ CODE: empty });
    await new DeleteProgressUseCase(store).execute("CODE");
    expect(await store.load("CODE")).toBeNull();
  });

  it("is a safe no-op when the row is already gone", async () => {
    const store = new FakeRemoteStore();
    await expect(
      new DeleteProgressUseCase(store).execute("CODE"),
    ).resolves.toBeUndefined();
  });
});

describe("stale-snapshot race (bugs: simultaneous-play sync)", () => {
  it("reads the local snapshot only AFTER the remote row arrives", async () => {
    // The remote fetch is the window a concurrent local action (a chest
    // claim, a purchase) falls into. Taking local before the fetch meant the
    // later apply rolled that action back; the supplier closes the window.
    const order: string[] = [];
    const store = new (class extends FakeRemoteStore {
      override async load(code: string) {
        const row = await super.load(code);
        order.push("remote-loaded");
        return row;
      }
    })({ CODE: empty });
    const supplier = () => {
      order.push("local-read");
      return Promise.resolve(empty);
    };
    await new PullProgressUseCase(store).execute("CODE", supplier);
    await new PushProgressUseCase(store).execute("CODE", supplier);
    expect(order).toEqual([
      "remote-loaded",
      "local-read",
      "remote-loaded",
      "local-read",
    ]);
  });
});

describe("PushProgressUseCase", () => {
  it("seeds the remote row when it is empty", async () => {
    const store = new FakeRemoteStore();
    const local: ProgressSnapshot = { stickers: ["a:b:c"], streaks: {}, avatars: {} };
    await new PushProgressUseCase(store).execute("CODE", () => Promise.resolve(local));
    expect(await store.load("CODE")).toEqual(local);
  });

  it("merges local into the remote union and persists it", async () => {
    const store = new FakeRemoteStore({
      CODE: { stickers: ["x:y:z"], streaks: {}, avatars: {}, stars: { reader: 10 } },
    });
    const local: ProgressSnapshot = {
      stickers: ["a:b:c"],
      streaks: {},
      avatars: {},
      stars: { reader: 3 },
    };
    const merged = await new PushProgressUseCase(store).execute("CODE", () => Promise.resolve(local));
    expect(merged.stickers).toEqual(["x:y:z", "a:b:c"]);
    expect(merged.stars).toEqual({ reader: 10 }); // max wins, never lost
    expect(await store.load("CODE")).toEqual(merged);
  });
});
