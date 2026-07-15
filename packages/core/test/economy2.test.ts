import { describe, expect, it } from "vitest";
import {
  AVATAR_CATALOG,
  avatarCost,
  isAvatarOwned,
  STARTER_AVATARS,
} from "../src/domain/avatars";
import {
  computeReward,
  FIRST_TIME_BONUS,
  PERFECT_BONUS,
  WALLET_EPOCH,
  WALLET_SEED_BY_AVATAR,
  walletBalance,
} from "../src/domain/stars";
import {
  defaultCollection,
  petEmoji,
  petFormEmoji,
  petMaxForm,
  PET_SPECIES,
  STARTER_SPECIES,
} from "../src/domain/mascota";
import { drawSurprise, SURPRISE_COST } from "../src/domain/surprise";
import { ACCESSORIES } from "../src/domain/wardrobe";
import { decodeProgress, encodeProgress, mergeProgress } from "../src/domain/transfer";
import { seededRandom } from "./helpers";

describe("avatars as currency", () => {
  it("has unique emoji, free starters, and priced extras", () => {
    const emoji = AVATAR_CATALOG.map((a) => a.emoji);
    expect(new Set(emoji).size).toBe(emoji.length);
    expect(STARTER_AVATARS).toContain("🦖");
    expect(STARTER_AVATARS).toContain("🦄");
    expect(AVATAR_CATALOG.filter((a) => a.cost > 0).length).toBeGreaterThanOrEqual(15);
  });

  it("free avatars are always owned; paid ones need buying", () => {
    expect(avatarCost("🦖")).toBe(0);
    expect(isAvatarOwned("🦖", [])).toBe(true);
    expect(avatarCost("🐉")).toBeGreaterThan(0);
    expect(isAvatarOwned("🐉", [])).toBe(false);
    expect(isAvatarOwned("🐉", ["🐉"])).toBe(true);
  });
});

describe("computeReward", () => {
  it("pays one per first-try, minimum one", () => {
    expect(computeReward({ firstTryCorrect: 6 }).base).toBe(6);
    expect(computeReward({ firstTryCorrect: 0 }).base).toBe(1);
  });

  it("adds a perfect bonus only when no rounds were missed", () => {
    expect(computeReward({ firstTryCorrect: 8, totalRounds: 8 }).perfect).toBe(PERFECT_BONUS);
    expect(computeReward({ firstTryCorrect: 7, totalRounds: 8 }).perfect).toBe(0);
    // no round count → no perfect concept
    expect(computeReward({ firstTryCorrect: 8 }).perfect).toBe(0);
  });

  it("doubles the base for a week-long streak and adds a first-time bonus", () => {
    const r = computeReward({ firstTryCorrect: 4, totalRounds: 4, streakDays: 7, firstTime: true });
    expect(r.streak).toBe(4);
    expect(r.firstTime).toBe(FIRST_TIME_BONUS);
    expect(r.total).toBe(4 + PERFECT_BONUS + 4 + FIRST_TIME_BONUS);
    expect(computeReward({ firstTryCorrect: 4, streakDays: 6 }).streak).toBe(0);
  });

  it("docks a star per mistake so random tapping can't farm the chest", () => {
    // Six first-try answers, two wrong taps along the way → four stars.
    expect(computeReward({ firstTryCorrect: 6, mistakes: 2 }).base).toBe(4);
    // A run of nothing but wrong taps still floors at one — effort counts.
    expect(computeReward({ firstTryCorrect: 0, mistakes: 5 }).base).toBe(1);
    expect(computeReward({ firstTryCorrect: 3, mistakes: 9 }).base).toBe(1);
  });

  it("streak doubles the already-docked base, not the pre-penalty score", () => {
    const r = computeReward({ firstTryCorrect: 6, mistakes: 2, streakDays: 7 });
    expect(r.base).toBe(4);
    expect(r.streak).toBe(4);
  });

  it("a mistake forfeits the perfect bonus even when every round is eventually right", () => {
    expect(
      computeReward({ firstTryCorrect: 7, totalRounds: 8, mistakes: 1 }).perfect,
    ).toBe(0);
    expect(
      computeReward({ firstTryCorrect: 8, totalRounds: 8, mistakes: 0 }).perfect,
    ).toBe(PERFECT_BONUS);
  });
});

describe("pet species", () => {
  it("starts with the free chick and grows through its stages", () => {
    expect(PET_SPECIES[0]!.id).toBe(STARTER_SPECIES);
    expect(PET_SPECIES[0]!.cost).toBe(0);
    expect(petEmoji("pollito", 0)).toBe("🥚");
    expect(petEmoji("pollito", 15)).toBe("🐔");
    expect(petEmoji("dragon", 15)).toBe("🐉");
    // a deep adoptable roster so the star sink lasts many sessions
    expect(PET_SPECIES.filter((s) => s.cost > 0).length).toBeGreaterThanOrEqual(27);
    expect(new Set(PET_SPECIES.map((s) => s.id)).size).toBe(PET_SPECIES.length);
  });

  it("prices adoption as a long game: no cheap pets, big top-tier goals", () => {
    const paid = PET_SPECIES.filter((s) => s.cost > 0).map((s) => s.cost);
    expect(Math.min(...paid)).toBeGreaterThanOrEqual(100);
    expect(Math.max(...paid)).toBeGreaterThanOrEqual(4000);
  });

  it("grows each animal as its own kind — only the chick is a chick", () => {
    // The chick keeps its full four-stage life.
    expect(["🥚", "🐣", "🐥", "🐔"]).toEqual([
      petEmoji("pollito", 0),
      petEmoji("pollito", 3),
      petEmoji("pollito", 8),
      petEmoji("pollito", 15),
    ]);
    // Mammals are born as babies (no egg) and grow into the adult once.
    expect(petEmoji("conejo", 0)).toBe("🐰");
    expect(petEmoji("conejo", 15)).toBe("🐇");
    expect(petEmoji("gato", 0)).toBe("🐱");
    expect(petEmoji("gato", 15)).toBe("🐈");
    // The dragon hatches: egg → hatchling → dragon.
    expect(petEmoji("dragon", 0)).toBe("🥚");
    expect(petEmoji("dragon", 3)).toBe("🐲");
    // The butterfly metamorphoses: egg → caterpillar → chrysalis → butterfly.
    expect(petEmoji("mariposa", 0)).toBe("🥚");
    expect(petEmoji("mariposa", 3)).toBe("🐛");
    expect(petEmoji("mariposa", 8)).toBe("🫛");
    expect(petEmoji("mariposa", 15)).toBe("🦋");
    // No non-chicken ever passes through the chick 🐣, at any meal count.
    for (let meals = 0; meals <= 20; meals++) {
      for (const id of ["conejo", "gato", "dragon"]) {
        expect(petEmoji(id, meals)).not.toBe("🐣");
      }
    }
  });

  it("tracks the highest form reached, so kids can pick any earlier one", () => {
    // The chick unlocks a new form at each growth beat.
    expect(petMaxForm("pollito", 0)).toBe(0);
    expect(petMaxForm("pollito", 3)).toBe(1);
    expect(petMaxForm("pollito", 8)).toBe(2);
    expect(petMaxForm("pollito", 15)).toBe(3);
    // Two-form animals reach their top form once.
    expect(petMaxForm("conejo", 0)).toBe(0);
    expect(petMaxForm("conejo", 15)).toBe(1);
  });

  it("renders any chosen form, clamped to the species' real forms", () => {
    expect(petFormEmoji("pollito", 1)).toBe("🐣"); // the cracked-egg chick
    expect(petFormEmoji("pollito", 0)).toBe("🥚");
    expect(petFormEmoji("pollito", 3)).toBe("🐔");
    // out-of-range choices clamp instead of crashing
    expect(petFormEmoji("pollito", 9)).toBe("🐔");
    expect(petFormEmoji("pollito", -1)).toBe("🥚");
    expect(petFormEmoji("conejo", 5)).toBe("🐇");
  });

  it("defaultCollection owns only the starter, active and unhatched", () => {
    const c = defaultCollection();
    expect(c.owned).toEqual([STARTER_SPECIES]);
    expect(c.active).toBe(STARTER_SPECIES);
    expect(c.pets[STARTER_SPECIES]).toEqual({ meals: 0, lastFed: null });
  });
});

describe("drawSurprise", () => {
  it("has a cost and returns a valid reward", () => {
    // Balance floor: the lottery is a real save-up treat, not pocket change.
    expect(SURPRISE_COST).toBeGreaterThanOrEqual(100);
    const r = drawSurprise(seededRandom(1), []);
    if (r.type === "accessory") {
      expect(ACCESSORIES.some((a) => a.id === r.id)).toBe(true);
    } else if (r.type === "stars") {
      expect(r.amount).toBeGreaterThan(0);
    } else {
      expect(r.type).toBe("freeze");
    }
  });

  it("never awards an accessory once every accessory is owned", () => {
    const allOwned = ACCESSORIES.map((a) => a.id);
    for (let seed = 0; seed < 10; seed++) {
      expect(drawSurprise(seededRandom(seed), allOwned).type).not.toBe(
        "accessory",
      );
    }
  });

  it("can award a freeze as the consolation prize", () => {
    const allOwned = ACCESSORIES.map((a) => a.id);
    const results = Array.from({ length: 60 }, (_, s) =>
      drawSurprise(seededRandom(s), allOwned),
    );
    expect(results.some((r) => r.type === "freeze")).toBe(true);
  });

  it("can award an unowned accessory when some remain", () => {
    const results = Array.from({ length: 20 }, (_, s) => drawSurprise(seededRandom(s), []));
    expect(results.some((r) => r.type === "accessory")).toBe(true);
  });
});

describe("wallet epoch: a reset must beat max-merge", () => {
  const base = { stickers: [], streaks: {}, avatars: {} };

  it("an older-epoch snapshot contributes no stars (cloud rows, old codes)", () => {
    const reset = { ...base, stars: { listener: 0 }, walletEpoch: 1 };
    const stale = { ...base, stars: { listener: 500, reader: 300 } }; // epoch 0
    const merged = mergeProgress(reset, stale);
    expect(merged.stars).toEqual({ listener: 0 });
    expect(merged.walletEpoch).toBe(1);
    // symmetric: the newer epoch wins regardless of argument order
    const flipped = mergeProgress(stale, reset);
    expect(flipped.stars).toEqual({ listener: 0 });
    expect(flipped.walletEpoch).toBe(1);
  });

  it("equal epochs keep the idempotent max-merge", () => {
    const a = { ...base, stars: { listener: 40 }, walletEpoch: 1 };
    const b = { ...base, stars: { listener: 25, reader: 60 }, walletEpoch: 1 };
    expect(mergeProgress(a, b).stars).toEqual({ listener: 40, reader: 60 });
  });

  it("epoch-less snapshots merge exactly as before", () => {
    const a = { ...base, stars: { listener: 40 } };
    const b = { ...base, stars: { listener: 70 } };
    const merged = mergeProgress(a, b);
    expect(merged.stars).toEqual({ listener: 70 });
    expect(merged.walletEpoch).toBeUndefined();
  });

  it("epoch 2 restore: seeded balances beat the epoch-1 zeros (ADR 007)", () => {
    // The restore only works if the live epoch outranks the deployed reset.
    expect(WALLET_EPOCH).toBeGreaterThanOrEqual(2);
    expect(WALLET_SEED_BY_AVATAR["🐸"]).toBe(1000);
    expect(WALLET_SEED_BY_AVATAR["🐯"]).toBe(300);
    const restored = {
      ...base,
      stars: { listener: 1000, reader: 300 },
      walletEpoch: 2,
    };
    const zeroed = { ...base, stars: { listener: 0, reader: 0 }, walletEpoch: 1 };
    for (const merged of [
      mergeProgress(restored, zeroed),
      mergeProgress(zeroed, restored),
    ]) {
      expect(merged.stars).toEqual({ listener: 1000, reader: 300 });
      expect(merged.walletEpoch).toBe(2);
    }
  });

  it("round-trips and sanitizes the epoch", () => {
    const snap = { ...base, stars: { listener: 5 }, walletEpoch: 1 };
    expect(decodeProgress(encodeProgress(snap))).toEqual(snap);
    const hostile = { ...base, walletEpoch: Number.POSITIVE_INFINITY };
    expect(decodeProgress(encodeProgress(hostile)).walletEpoch).toBeUndefined();
  });
});

describe("counter wallets: spending survives the merge", () => {
  const base = { stickers: [], streaks: {}, avatars: {} };
  const epoch = WALLET_EPOCH;

  it("a stale peer can no longer resurrect a spend", () => {
    // Device spent 40; the cloud row still holds the pre-spend counters.
    const spent = { ...base, wallets: { listener: { earned: 100, spent: 40 } }, walletEpoch: epoch };
    const stale = { ...base, wallets: { listener: { earned: 100, spent: 0 } }, walletEpoch: epoch };
    for (const merged of [mergeProgress(spent, stale), mergeProgress(stale, spent)]) {
      expect(merged.wallets).toEqual({ listener: { earned: 100, spent: 40 } });
      // stars (the legacy balance) is derived from the counters
      expect(merged.stars).toEqual({ listener: 60 });
    }
  });

  it("earning elsewhere and spending here both survive one merge", () => {
    const here = { ...base, wallets: { listener: { earned: 100, spent: 40 } }, walletEpoch: epoch };
    const there = { ...base, wallets: { listener: { earned: 120, spent: 0 } }, walletEpoch: epoch };
    expect(mergeProgress(here, there).wallets).toEqual({
      listener: { earned: 120, spent: 40 },
    });
    expect(mergeProgress(here, there).stars).toEqual({ listener: 80 });
  });

  it("older-epoch wallets are discarded like older-epoch stars", () => {
    const fresh = { ...base, wallets: { listener: { earned: 10, spent: 0 } }, walletEpoch: epoch };
    const old = { ...base, wallets: { listener: { earned: 900, spent: 0 } }, walletEpoch: epoch - 1 };
    expect(mergeProgress(fresh, old).wallets).toEqual({
      listener: { earned: 10, spent: 0 },
    });
  });

  it("round-trips wallets and drops hostile counters", () => {
    const snap = {
      ...base,
      wallets: { listener: { earned: 9, spent: 4 } },
      walletEpoch: epoch,
    };
    expect(decodeProgress(encodeProgress(snap))).toEqual(snap);
    const hostile = {
      ...base,
      wallets: { listener: { earned: Number.POSITIVE_INFINITY, spent: 0 } },
    };
    expect(decodeProgress(encodeProgress(hostile)).wallets).toBeUndefined();
  });

  it("walletBalance never goes negative on corrupt counters", () => {
    expect(walletBalance({ earned: 10, spent: 4 })).toBe(6);
    expect(walletBalance({ earned: 4, spent: 10 })).toBe(0);
  });

  it("a same-epoch peer with only a balance keeps its stars (kid with no counters)", () => {
    // Not every kid on a snapshot need have counters — merging must not drop
    // a bare balance just because the other side speaks counters.
    const counters = { ...base, wallets: { listener: { earned: 50, spent: 10 } }, walletEpoch: epoch };
    const balanceOnly = { ...base, stars: { reader: 75 }, walletEpoch: epoch };
    const merged = mergeProgress(counters, balanceOnly);
    expect(merged.stars).toEqual({ listener: 40, reader: 75 });
    expect(merged.wallets).toEqual({ listener: { earned: 50, spent: 10 } });
  });
});

describe("transfer: owned avatars and pet collections", () => {
  const snap = {
    stickers: [], streaks: {}, avatars: {},
    ownedAvatars: { listener: ["🐉", "🦸"] },
    petCollections: {
      listener: {
        active: "conejo",
        owned: ["pollito", "conejo"],
        pets: {
          pollito: { meals: 15, lastFed: "2026-07-11" },
          conejo: { meals: 2, lastFed: "2026-07-12", accessories: ["corona"] },
        },
      },
    },
  };

  it("round-trips avatars and collections", () => {
    expect(decodeProgress(encodeProgress(snap))).toEqual(snap);
  });

  it("unions owned avatars and species, max-merges each pet", () => {
    const other = {
      stickers: [], streaks: {}, avatars: {},
      ownedAvatars: { listener: ["🐉", "🐲"] },
      petCollections: {
        listener: {
          active: "gato",
          owned: ["pollito", "gato"],
          pets: {
            pollito: { meals: 8, lastFed: "2026-07-13" },
            gato: { meals: 1, lastFed: "2026-07-13" },
          },
        },
      },
    };
    const merged = mergeProgress(snap, other);
    expect([...merged.ownedAvatars!.listener!].sort()).toEqual(["🐉", "🐲", "🦸"]);
    expect([...merged.petCollections!.listener!.owned].sort()).toEqual([
      "conejo", "gato", "pollito",
    ]);
    // pollito: max meals (15) and later day (2026-07-13)
    expect(merged.petCollections!.listener!.pets.pollito).toEqual({
      meals: 15,
      lastFed: "2026-07-13",
    });
    // conejo kept from current, gato added from incoming
    expect(merged.petCollections!.listener!.pets.conejo!.accessories).toEqual(["corona"]);
    expect(merged.petCollections!.listener!.pets.gato!.meals).toBe(1);
    // active follows the incoming import
    expect(merged.petCollections!.listener!.active).toBe("gato");
  });

  it("still decodes old codes without the new fields", () => {
    const decoded = decodeProgress(encodeProgress({ stickers: [], streaks: {}, avatars: {} }));
    expect(decoded.ownedAvatars).toBeUndefined();
    expect(decoded.petCollections).toBeUndefined();
    expect(decoded.unlockedDecks).toBeUndefined();
  });

  it("round-trips and unions secret-deck unlocks", () => {
    const a = { stickers: [], streaks: {}, avatars: {}, unlockedDecks: { listener: ["mystery"] } };
    const b = { stickers: [], streaks: {}, avatars: {}, unlockedDecks: { reader: ["mystery"] } };
    expect(decodeProgress(encodeProgress(a))).toEqual(a);
    const merged = mergeProgress(a, b);
    expect(merged.unlockedDecks).toEqual({ listener: ["mystery"], reader: ["mystery"] });
  });
});
