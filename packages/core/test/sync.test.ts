import { describe, expect, it } from "vitest";
import {
  generatePairingCode,
  isPairingCode,
  normalizePairingCode,
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
