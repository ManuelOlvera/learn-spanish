import { describe, expect, it } from "vitest";
import {
  decodeProgress,
  encodeProgress,
  InvalidTransferCodeError,
  mergeProgress,
  sanitizeSnapshot,
} from "../src/domain/transfer";
import type { ProgressSnapshot } from "../src/domain/transfer";
import type { FormOutfit } from "../src/domain/mascota";

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

  it("keeps the worn outfit when both devices already have the pet", () => {
    // The empty-tablet path skips mergePet; the real bug is a merge where BOTH
    // sides hold the pet. Ownership is kid-level now, so pets carry no legacy
    // per-pet `accessories` — worn must not be filtered away against it.
    const local: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      ownedAccessories: { listener: ["gorro"] },
      petCollections: {
        listener: {
          active: "pollito",
          owned: ["pollito"],
          pets: { pollito: { meals: 4, lastFed: "2026-07-13", worn: ["gorro"] } },
        },
      },
    };
    const remote: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      ownedAccessories: { listener: ["gorro"] },
      petCollections: {
        listener: {
          active: "pollito",
          owned: ["pollito"],
          pets: { pollito: { meals: 4, lastFed: "2026-07-13" } },
        },
      },
    };
    const merged = mergeProgress(local, remote);
    expect(merged.petCollections?.listener?.pets["pollito"]?.worn).toEqual([
      "gorro",
    ]);
  });

  it("keeps the receiving device's active pet — a merge never switches it", () => {
    // The reported symptom: "feeding animals quickly, the sad face reappears".
    // `active` is a per-device display choice (like `worn` and `form`), but it
    // was incoming-wins, so every pull adopted the OTHER device's active pet.
    // Feed the pollito here, and a pull from a tablet still parked on a long
    // unfed conejo swapped the screen back to the hungry one.
    const phone: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      petCollections: {
        listener: {
          active: "pollito",
          owned: ["pollito", "conejo"],
          pets: {
            pollito: { meals: 7, lastFed: "2026-08-04" },
            conejo: { meals: 2, lastFed: "2026-07-20" },
          },
        },
      },
    };
    const tablet: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      petCollections: {
        listener: {
          active: "conejo",
          owned: ["pollito", "conejo"],
          pets: {
            pollito: { meals: 4, lastFed: "2026-07-20" },
            conejo: { meals: 2, lastFed: "2026-07-20" },
          },
        },
      },
    };
    // Whichever side receives keeps the pet it is showing...
    expect(mergeProgress(phone, tablet).petCollections?.listener?.active).toBe(
      "pollito",
    );
    expect(mergeProgress(tablet, phone).petCollections?.listener?.active).toBe(
      "conejo",
    );
    // ...and the meals still converge both ways (only the display is per-device).
    expect(
      mergeProgress(tablet, phone).petCollections?.listener?.pets["pollito"]?.meals,
    ).toBe(7);
    // A device that has never seen this kid still adopts the incoming active,
    // so a freshly paired tablet opens on a real pet rather than nothing.
    const fresh: ProgressSnapshot = { stickers: [], streaks: {}, avatars: {} };
    expect(mergeProgress(fresh, phone).petCollections?.listener?.active).toBe(
      "pollito",
    );
  });

  it("keeps where the kid dragged each accessory, from both sides", () => {
    // `placements` was missing from mergePet's return, so every sync silently
    // reset each dragged accessory to its default spot.
    const col = (placements: Record<string, { x: number; y: number }>) => ({
      active: "pollito",
      owned: ["pollito"],
      pets: {
        pollito: {
          meals: 3,
          lastFed: "2026-08-04",
          worn: ["gorro", "corona"],
          placements,
        },
      },
    });
    const local: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      petCollections: { listener: col({ gorro: { x: 20, y: 30 } }) },
    };
    const remote: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      petCollections: { listener: col({ corona: { x: 70, y: 5 } }) },
    };
    const merged = mergeProgress(local, remote);
    // Both spots survive, and they survive the encode/sanitize round trip too.
    expect(merged.petCollections?.listener?.pets["pollito"]?.placements).toEqual({
      gorro: { x: 20, y: 30 },
      corona: { x: 70, y: 5 },
    });
    const roundTripped = sanitizeSnapshot(decodeProgress(encodeProgress(merged)));
    expect(
      roundTripped.petCollections?.listener?.pets["pollito"]?.placements,
    ).toEqual({ gorro: { x: 20, y: 30 }, corona: { x: 70, y: 5 } });

    // The receiving device wins a conflict on the same accessory (like worn).
    const clash = mergeProgress(local, {
      ...remote,
      petCollections: { listener: col({ gorro: { x: 99, y: 99 } }) },
    });
    expect(
      clash.petCollections?.listener?.pets["pollito"]?.placements?.["gorro"],
    ).toEqual({ x: 20, y: 30 });
  });

  it("syncs each form's outfit separately, so growing up doesn't cross the wire", () => {
    // Outfits are per form (an egg and a hen are different shapes). A merge
    // that flattened them would move the hen's hat onto the egg — or, worse,
    // drop the form the other device hasn't reached yet.
    const col = (outfits: Record<string, FormOutfit>) => ({
      active: "pollito",
      owned: ["pollito"],
      pets: { pollito: { meals: 15, lastFed: "2026-08-13", outfits } },
    });
    const local: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      petCollections: {
        listener: col({
          "3": { worn: ["gorro"], placements: { gorro: { x: 50, y: 8 } } },
        }),
      },
    };
    const remote: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      petCollections: {
        listener: col({
          "0": { worn: ["lazo"], placements: { lazo: { x: 50, y: 20 } } },
        }),
      },
    };
    const merged = mergeProgress(local, remote);
    const outfits = merged.petCollections?.listener?.pets["pollito"]?.outfits;
    // The form only the other device had is adopted whole, not dropped.
    expect(outfits?.["3"]).toEqual({
      worn: ["gorro"],
      placements: { gorro: { x: 50, y: 8 } },
    });
    expect(outfits?.["0"]).toEqual({
      worn: ["lazo"],
      placements: { lazo: { x: 50, y: 20 } },
    });
    // ...and both survive the encode/sanitize round trip.
    const roundTripped = sanitizeSnapshot(decodeProgress(encodeProgress(merged)));
    expect(
      roundTripped.petCollections?.listener?.pets["pollito"]?.outfits,
    ).toEqual(outfits);

    // Within a shared form the receiving device wins, like worn and placements.
    const clash = mergeProgress(local, {
      ...remote,
      petCollections: {
        listener: col({
          "3": { worn: ["corona"], placements: { gorro: { x: 99, y: 99 } } },
        }),
      },
    });
    expect(clash.petCollections?.listener?.pets["pollito"]?.outfits?.["3"]).toEqual({
      worn: ["gorro"],
      placements: { gorro: { x: 50, y: 8 } },
    });
  });

  it("preserves a pet's given name and never lets an unnamed side clobber it", () => {
    const named: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      petCollections: {
        listener: {
          active: "pollito",
          owned: ["pollito"],
          pets: { pollito: { meals: 2, lastFed: null, name: "Paco" } },
        },
      },
    };
    const unnamed: ProgressSnapshot = {
      stickers: [],
      streaks: {},
      avatars: {},
      petCollections: {
        listener: {
          active: "pollito",
          owned: ["pollito"],
          pets: { pollito: { meals: 5, lastFed: null } },
        },
      },
    };
    // The name survives whichever side carries it, and survives the sanitizer.
    const incomingNamed = sanitizeSnapshot(decodeProgress(encodeProgress(named)));
    expect(
      mergeProgress(unnamed, incomingNamed).petCollections?.listener?.pets["pollito"]
        ?.name,
    ).toBe("Paco");
    expect(
      mergeProgress(named, unnamed).petCollections?.listener?.pets["pollito"]?.name,
    ).toBe("Paco");
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

/**
 * Characterisation tests written *before* the merge-rule registry refactor, to
 * pin the rules that had no direct test of their own. They describe today's
 * behaviour exactly; if the refactor changes any of them, it is a bug in the
 * refactor, not a test to update.
 */
describe("mergeProgress — every field's rule, pinned", () => {
  const bare: ProgressSnapshot = { stickers: [], streaks: {}, avatars: {} };

  it("takes the per-word maximum of right and wrong counts", () => {
    const merged = mergeProgress(
      { ...bare, stats: { listener: { perro: { right: 5, wrong: 1 } } } },
      { ...bare, stats: { listener: { perro: { right: 2, wrong: 4 }, gato: { right: 1, wrong: 0 } } } },
    );
    expect(merged.stats?.listener).toEqual({
      perro: { right: 5, wrong: 4 },
      gato: { right: 1, wrong: 0 },
    });
  });

  it("unions owned avatars, so a bought avatar is never lost", () => {
    const merged = mergeProgress(
      { ...bare, ownedAvatars: { reader: ["🐼", "🦊"] } },
      { ...bare, ownedAvatars: { reader: ["🦊", "🐸"], listener: ["🦖"] } },
    );
    expect(merged.ownedAvatars?.reader).toEqual(["🐼", "🦊", "🐸"]);
    expect(merged.ownedAvatars?.listener).toEqual(["🦖"]);
  });

  it("unions unlocked secret decks", () => {
    const merged = mergeProgress(
      { ...bare, unlockedDecks: { listener: ["misterio"] } },
      { ...bare, unlockedDecks: { listener: ["misterio", "espacio"] } },
    );
    expect(merged.unlockedDecks?.listener).toEqual(["misterio", "espacio"]);
  });

  it("keeps the higher reto record per deck, from either side", () => {
    const merged = mergeProgress(
      { ...bare, retoBests: { reader: { animals: 12, casa: 3 } } },
      { ...bare, retoBests: { reader: { animals: 7, colors: 9 } } },
    );
    expect(merged.retoBests?.reader).toEqual({ animals: 12, casa: 3, colors: 9 });
  });

  it("max-merges sticker counts, so a tier never regresses on sync", () => {
    const merged = mergeProgress(
      { ...bare, stickerCounts: { "listener:animals:quiz": 5, "reader:casa:memory": 1 } },
      { ...bare, stickerCounts: { "listener:animals:quiz": 2, "reader:zoo:sopa": 3 } },
    );
    expect(merged.stickerCounts).toEqual({
      "listener:animals:quiz": 5,
      "reader:casa:memory": 1,
      "reader:zoo:sopa": 3,
    });
  });

  it("keeps a kid the incoming side has never heard of", () => {
    const merged = mergeProgress(
      { ...bare, freezes: { listener: 2 }, weekly: { listener: { week: "2026-W30", count: 4 } } },
      { ...bare, freezes: { reader: 1 } },
    );
    expect(merged.freezes).toEqual({ listener: 2, reader: 1 });
    expect(merged.weekly?.listener).toEqual({ week: "2026-W30", count: 4 });
  });

  it("ignores a week older than the one this device is already in", () => {
    // A stale device must not roll the week back. The old code expressed this
    // as a fall-through; the registry makes it an explicit branch, so it gets
    // an explicit test.
    const merged = mergeProgress(
      { ...bare, weekProgress: { listener: { week: "2026-W31", days: ["mon"] } } },
      { ...bare, weekProgress: { listener: { week: "2026-W30", days: ["tue", "wed"] } } },
    );
    expect(merged.weekProgress?.listener).toEqual({ week: "2026-W31", days: ["mon"] });
  });

  it("ignores a mission older than today's, claimed or not", () => {
    const merged = mergeProgress(
      { ...bare, missions: { listener: { day: "2026-07-12", done: ["quiz"], claimed: false } } },
      { ...bare, missions: { listener: { day: "2026-07-11", done: ["match"], claimed: true } } },
    );
    expect(merged.missions?.listener).toEqual({
      day: "2026-07-12",
      done: ["quiz"],
      claimed: false,
    });
  });

  it("adopts a wallet for a kid this device has never had one for", () => {
    const merged = mergeProgress(
      { ...bare, wallets: { listener: { earned: 10, spent: 2 } } },
      { ...bare, wallets: { reader: { earned: 30, spent: 5 } } },
    );
    expect(merged.wallets?.reader).toEqual({ earned: 30, spent: 5 });
    expect(merged.wallets?.listener).toEqual({ earned: 10, spent: 2 });
    // The legacy balance view follows the counters.
    expect(merged.stars?.reader).toBe(25);
  });

  it("is idempotent: merging the same pair twice changes nothing", () => {
    // The property the whole design rests on — every exchange re-merges, so a
    // rule that inflated on repeat would drift a little on every game complete.
    const a: ProgressSnapshot = {
      stickers: ["listener:animals:learn"],
      streaks: { listener: { day: "2026-07-11", count: 3 } },
      avatars: { listener: "🦖" },
      stats: { listener: { perro: { right: 2, wrong: 1 } } },
      wallets: { listener: { earned: 40, spent: 10 } },
      freezes: { listener: 2 },
      ownedAccessories: { listener: ["gorro"] },
      retoBests: { listener: { animals: 8 } },
      stickerCounts: { "listener:animals:learn": 3 },
    };
    const b: ProgressSnapshot = {
      ...bare,
      stickers: ["reader:casa:quiz"],
      stats: { listener: { perro: { right: 5, wrong: 0 } } },
      wallets: { listener: { earned: 55, spent: 5 } },
      freezes: { listener: 1 },
      ownedAccessories: { listener: ["gorro", "lazo"] },
      retoBests: { listener: { animals: 3, casa: 6 } },
      stickerCounts: { "listener:animals:learn": 7 },
    };
    const once = mergeProgress(a, b);
    expect(mergeProgress(once, b)).toEqual(once);
    expect(mergeProgress(once, a)).toEqual(once);
  });

  it("is order-independent for the commutative rules", () => {
    const a: ProgressSnapshot = {
      ...bare,
      freezes: { listener: 3 },
      ownedAvatars: { listener: ["🦖"] },
      retoBests: { listener: { animals: 9 } },
    };
    const b: ProgressSnapshot = {
      ...bare,
      freezes: { listener: 1 },
      ownedAvatars: { listener: ["🐸"] },
      retoBests: { listener: { animals: 4 } },
    };
    const ab = mergeProgress(a, b);
    const ba = mergeProgress(b, a);
    expect(ab.freezes).toEqual(ba.freezes);
    expect(ab.retoBests).toEqual(ba.retoBests);
    expect([...(ab.ownedAvatars?.listener ?? [])].sort()).toEqual(
      [...(ba.ownedAvatars?.listener ?? [])].sort(),
    );
  });
});
