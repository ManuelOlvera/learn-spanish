import { describe, expect, it } from "vitest";
import {
  decodeProgress,
  encodeProgress,
  InvalidTransferCodeError,
  mergeProgress,
  sanitizeSnapshot,
} from "../src/domain/transfer";
import type { ProgressSnapshot } from "../src/domain/transfer";

const snapshot: ProgressSnapshot = {
  stickers: ["listener:animals:learn", "reader:zoo:quiz-read"],
  streaks: { listener: { day: "2026-07-11", count: 3 } },
  avatars: { listener: "🦖", reader: "🐼" },
};

describe("encode/decode round trip", () => {
  it("survives a round trip, emoji included", () => {
    const code = encodeProgress(snapshot);
    expect(decodeProgress(code)).toEqual(snapshot);
  });

  it("produces a versioned, paste-safe code", () => {
    const code = encodeProgress(snapshot);
    expect(code.startsWith("PALABRAS1.")).toBe(true);
    expect(code).toMatch(/^PALABRAS1\.[A-Za-z0-9_-]+$/);
  });

  it("tolerates surrounding whitespace on import", () => {
    const code = `  ${encodeProgress(snapshot)}\n`;
    expect(decodeProgress(code)).toEqual(snapshot);
  });
});

describe("decodeProgress validation", () => {
  it("rejects garbage with a typed error", () => {
    expect(() => decodeProgress("not a code")).toThrow(
      InvalidTransferCodeError,
    );
    expect(() => decodeProgress("PALABRAS1.%%%")).toThrow(
      InvalidTransferCodeError,
    );
    expect(() => decodeProgress("PALABRAS9.abc")).toThrow(
      InvalidTransferCodeError,
    );
  });

  it("drops malformed sticker ids and unknown kid keys instead of importing them", () => {
    const dirty: ProgressSnapshot = {
      stickers: ["listener:animals:learn", "garbage", "a:b:c:d"],
      streaks: { listener: { day: "2026-07-11", count: 1 } },
      avatars: { listener: "🦖" },
    };
    const decoded = decodeProgress(encodeProgress(dirty));
    expect(decoded.stickers).toEqual(["listener:animals:learn"]);
  });
});

describe("sanitizeSnapshot (untrusted remote/paste payloads)", () => {
  it("returns an empty snapshot for non-objects", () => {
    expect(sanitizeSnapshot(null)).toEqual({ stickers: [], streaks: {}, avatars: {} });
    expect(sanitizeSnapshot("nope")).toEqual({ stickers: [], streaks: {}, avatars: {} });
  });

  it("strips malformed fields from a raw object", () => {
    const cleaned = sanitizeSnapshot({
      stickers: ["listener:animals:learn", "bad", 42],
      streaks: { hacker: { day: "x", count: 1 } },
      avatars: { listener: "🦖" },
      freezes: { listener: -5, reader: 3 },
    });
    expect(cleaned.stickers).toEqual(["listener:animals:learn"]);
    expect(cleaned.streaks).toEqual({});
    expect(cleaned.freezes).toEqual({ reader: 3 });
  });
});

describe("mergeProgress", () => {
  it("unions stickers without duplicates", () => {
    const merged = mergeProgress(
      { stickers: ["a:b:c", "x:y:z"], streaks: {}, avatars: {} },
      { stickers: ["x:y:z", "n:e:w"], streaks: {}, avatars: {} },
    );
    expect(merged.stickers).toEqual(["a:b:c", "x:y:z", "n:e:w"]);
  });

  it("keeps the streak with the later day", () => {
    const merged = mergeProgress(
      { stickers: [], streaks: { listener: { day: "2026-07-10", count: 9 } }, avatars: {} },
      { stickers: [], streaks: { listener: { day: "2026-07-11", count: 2 } }, avatars: {} },
    );
    expect(merged.streaks.listener).toEqual({ day: "2026-07-11", count: 2 });
  });

  it("keeps the higher count when days tie", () => {
    const merged = mergeProgress(
      { stickers: [], streaks: { reader: { day: "2026-07-11", count: 2 } }, avatars: {} },
      { stickers: [], streaks: { reader: { day: "2026-07-11", count: 5 } }, avatars: {} },
    );
    expect(merged.streaks.reader).toEqual({ day: "2026-07-11", count: 5 });
  });

  it("lets incoming avatars win, but keeps current ones it does not mention", () => {
    const merged = mergeProgress(
      { stickers: [], streaks: {}, avatars: { listener: "🦖", reader: "🦄" } },
      { stickers: [], streaks: {}, avatars: { reader: "🐼" } },
    );
    expect(merged.avatars).toEqual({ listener: "🦖", reader: "🐼" });
  });

  it("merges today's mission across devices (union done, sticky claimed)", () => {
    const merged = mergeProgress(
      {
        stickers: [],
        streaks: {},
        avatars: {},
        missions: {
          reader: { day: "2026-07-14", done: ["quiz"], claimed: false },
        },
      },
      {
        stickers: [],
        streaks: {},
        avatars: {},
        missions: {
          reader: { day: "2026-07-14", done: ["match", "quiz"], claimed: true },
        },
      },
    );
    expect(merged.missions?.reader).toEqual({
      day: "2026-07-14",
      done: ["quiz", "match"], // union, no duplicates
      claimed: true, // claimed on either device stays claimed
    });
  });

  it("lets a later mission day supersede an earlier one", () => {
    const merged = mergeProgress(
      {
        stickers: [],
        streaks: {},
        avatars: {},
        missions: {
          listener: { day: "2026-07-13", done: ["learn", "duel"], claimed: true },
        },
      },
      {
        stickers: [],
        streaks: {},
        avatars: {},
        missions: {
          listener: { day: "2026-07-14", done: ["scene"], claimed: false },
        },
      },
    );
    expect(merged.missions?.listener).toEqual({
      day: "2026-07-14",
      done: ["scene"],
      claimed: false,
    });
  });

  it("keeps the higher category-award tier per deck (never re-pays a chest)", () => {
    const merged = mergeProgress(
      {
        stickers: [],
        streaks: {},
        avatars: {},
        categoryAwards: { listener: { animals: "gold", colors: "earned" } },
      },
      {
        stickers: [],
        streaks: {},
        avatars: {},
        categoryAwards: { listener: { animals: "silver", numbers: "earned" } },
      },
    );
    expect(merged.categoryAwards?.listener).toEqual({
      animals: "gold", // gold beats incoming silver
      colors: "earned", // kept though incoming never mentions it
      numbers: "earned", // gained from incoming
    });
  });

  it("max-merges freezes per kid (never loses a bought freeze)", () => {
    const merged = mergeProgress(
      { stickers: [], streaks: {}, avatars: {}, freezes: { listener: 3, reader: 0 } },
      { stickers: [], streaks: {}, avatars: {}, freezes: { listener: 1, reader: 5 } },
    );
    expect(merged.freezes).toEqual({ listener: 3, reader: 5 });
  });

  it("keeps the weekly streak with the higher count, later week on ties", () => {
    const higherCount = mergeProgress(
      { stickers: [], streaks: {}, avatars: {}, weekly: { listener: { week: "2026-07-06", count: 4 } } },
      { stickers: [], streaks: {}, avatars: {}, weekly: { listener: { week: "2026-07-13", count: 2 } } },
    );
    expect(higherCount.weekly?.listener).toEqual({ week: "2026-07-06", count: 4 });

    const tieLaterWeek = mergeProgress(
      { stickers: [], streaks: {}, avatars: {}, weekly: { reader: { week: "2026-07-06", count: 3 } } },
      { stickers: [], streaks: {}, avatars: {}, weekly: { reader: { week: "2026-07-13", count: 3 } } },
    );
    expect(tieLaterWeek.weekly?.reader).toEqual({ week: "2026-07-13", count: 3 });
  });

  it("unions week-progress days in the same week, later week otherwise", () => {
    const sameWeek = mergeProgress(
      { stickers: [], streaks: {}, avatars: {}, weekProgress: { listener: { week: "2026-07-13", days: ["2026-07-13"] } } },
      { stickers: [], streaks: {}, avatars: {}, weekProgress: { listener: { week: "2026-07-13", days: ["2026-07-13", "2026-07-14"] } } },
    );
    expect(sameWeek.weekProgress?.listener).toEqual({
      week: "2026-07-13",
      days: ["2026-07-13", "2026-07-14"],
    });

    const newerWeek = mergeProgress(
      { stickers: [], streaks: {}, avatars: {}, weekProgress: { reader: { week: "2026-07-06", days: ["2026-07-08", "2026-07-09"] } } },
      { stickers: [], streaks: {}, avatars: {}, weekProgress: { reader: { week: "2026-07-13", days: ["2026-07-13"] } } },
    );
    expect(newerWeek.weekProgress?.reader).toEqual({
      week: "2026-07-13",
      days: ["2026-07-13"],
    });
  });

  it("carries a full phone wardrobe to an empty tablet (bugs.md #5 repro)", () => {
    // The reported symptom: accessories bought on the phone not all showing
    // on the tablet. This pins the snapshot pipeline itself — a pushed
    // phone snapshot merged into a stale tablet must surface every owned
    // accessory (union, sanitizer included).
    const phone: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      ownedAccessories: {
        listener: ["gorro", "lazo", "corona", "varita", "gafas"],
      },
      petCollections: {
        listener: {
          active: "pollito",
          owned: ["pollito"],
          pets: { pollito: { meals: 4, lastFed: "2026-07-13", worn: ["gorro"] } },
        },
      },
    };
    const tablet: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      ownedAccessories: { listener: ["flor"] },
    };
    const pushed = sanitizeSnapshot(decodeProgress(encodeProgress(phone)));
    const merged = mergeProgress(tablet, pushed);
    expect(merged.ownedAccessories?.listener).toEqual(
      expect.arrayContaining(["flor", "gorro", "lazo", "corona", "varita", "gafas"]),
    );
    expect(merged.petCollections?.listener?.pets["pollito"]?.worn).toEqual(["gorro"]);
  });

  it("round-trips the new fields through encode/decode", () => {
    const full: ProgressSnapshot = {
      stickers: ["listener:animals:learn"],
      streaks: {},
      avatars: {},
      freezes: { listener: 2 },
      weekly: { listener: { week: "2026-07-13", count: 5 } },
      weekProgress: { listener: { week: "2026-07-13", days: ["2026-07-13"] } },
    };
    expect(decodeProgress(encodeProgress(full))).toEqual(full);
  });
});
