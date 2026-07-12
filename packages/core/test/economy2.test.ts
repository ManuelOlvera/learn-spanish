import { describe, expect, it } from "vitest";
import {
  AVATAR_CATALOG,
  avatarCost,
  isAvatarOwned,
  STARTER_AVATARS,
} from "../src/domain/avatars";
import { computeReward, FIRST_TIME_BONUS, PERFECT_BONUS } from "../src/domain/stars";
import {
  defaultCollection,
  petEmoji,
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
});

describe("pet species", () => {
  it("starts with the free chick and grows through its stages", () => {
    expect(PET_SPECIES[0]!.id).toBe(STARTER_SPECIES);
    expect(PET_SPECIES[0]!.cost).toBe(0);
    expect(petEmoji("pollito", 0)).toBe("🥚");
    expect(petEmoji("pollito", 15)).toBe("🐔");
    expect(petEmoji("dragon", 15)).toBe("🐉");
    // adoptable species cost stars
    expect(PET_SPECIES.filter((s) => s.cost > 0).length).toBeGreaterThanOrEqual(2);
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

  it("defaultCollection owns only the starter, active and unhatched", () => {
    const c = defaultCollection();
    expect(c.owned).toEqual([STARTER_SPECIES]);
    expect(c.active).toBe(STARTER_SPECIES);
    expect(c.pets[STARTER_SPECIES]).toEqual({ meals: 0, lastFed: null });
  });
});

describe("drawSurprise", () => {
  it("has a cost and returns a valid reward", () => {
    expect(SURPRISE_COST).toBeGreaterThan(0);
    const r = drawSurprise(seededRandom(1), []);
    if (r.type === "accessory") {
      expect(ACCESSORIES.some((a) => a.id === r.id)).toBe(true);
    } else {
      expect(r.amount).toBeGreaterThan(0);
    }
  });

  it("only gives stars once every accessory is owned", () => {
    const allOwned = ACCESSORIES.map((a) => a.id);
    for (let seed = 0; seed < 10; seed++) {
      expect(drawSurprise(seededRandom(seed), allOwned).type).toBe("stars");
    }
  });

  it("can award an unowned accessory when some remain", () => {
    const results = Array.from({ length: 20 }, (_, s) => drawSurprise(seededRandom(s), []));
    expect(results.some((r) => r.type === "accessory")).toBe(true);
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
