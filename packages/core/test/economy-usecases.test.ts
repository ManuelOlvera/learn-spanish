import { describe, expect, it } from "vitest";
import type { EconomyStore } from "../src/domain/economy";
import type { KidId } from "../src/domain/kid";
import type { MissionState } from "../src/domain/mission";
import type { PetCollection } from "../src/domain/mascota";
import type { StickerTier } from "../src/domain/sticker-tiers";
import type { WeekProgress, WeeklyStreak } from "../src/domain/weekly";
import { ACCESSORIES } from "../src/domain/wardrobe";
import { PET_SPECIES, STARTER_SPECIES } from "../src/domain/mascota";
import { AVATAR_CATALOG } from "../src/domain/avatars";
import {
  FREEZE_COST,
  STARTING_FREEZES,
} from "../src/domain/weekly";
import { MEAL_COST, MISSION_BONUS } from "../src/domain/stars";
import { SURPRISE_COST } from "../src/domain/surprise";
import { dayKey } from "../src/domain/daily";
import { EarnStarsUseCase } from "../src/application/earn-stars";
import { SpendStarsUseCase } from "../src/application/spend-stars";
import { GetMissionUseCase } from "../src/application/get-mission";
import { MarkActivityDoneUseCase } from "../src/application/mark-activity-done";
import { ClaimMissionBonusUseCase } from "../src/application/claim-mission-bonus";
import { RolloverWeeklyUseCase } from "../src/application/rollover-weekly";
import { BuyFreezeUseCase } from "../src/application/buy-freeze";
import { FeedPetUseCase } from "../src/application/feed-pet";
import { AdoptSpeciesUseCase } from "../src/application/adopt-species";
import { SetActiveSpeciesUseCase } from "../src/application/set-active-species";
import { BuyAccessoryUseCase } from "../src/application/buy-accessory";
import { ToggleAccessoryUseCase } from "../src/application/toggle-accessory";
import { PlaceAccessoryUseCase } from "../src/application/place-accessory";
import { OpenSurpriseUseCase } from "../src/application/open-surprise";
import { BuyAvatarUseCase } from "../src/application/buy-avatar";
import { UnlockDeckUseCase } from "../src/application/unlock-deck";
import { ClaimCategoryRewardUseCase } from "../src/application/claim-category-reward";
import { SaveRetoBestUseCase } from "../src/application/save-reto-best";

/** In-memory EconomyStore: the port contract with none of the storage. */
class FakeEconomyStore implements EconomyStore {
  starsByKid: Partial<Record<KidId, number>> = {};
  freezesByKid: Partial<Record<KidId, number>> = {};
  missions: Partial<Record<KidId, MissionState>> = {};
  weeklyByKid: Partial<Record<KidId, WeeklyStreak>> = {};
  progressByKid: Partial<Record<KidId, WeekProgress>> = {};
  collections: Partial<Record<KidId, PetCollection>> = {};
  accessoriesByKid: Partial<Record<KidId, readonly string[]>> = {};
  avatarsByKid: Partial<Record<KidId, readonly string[]>> = {};
  decksByKid: Partial<Record<KidId, readonly string[]>> = {};
  counts: Readonly<Record<string, number>> = {};
  awardsByKid: Partial<Record<KidId, Readonly<Record<string, StickerTier>>>> = {};
  retoByKid: Partial<Record<KidId, Readonly<Record<string, number>>>> = {};

  loadStars(kid: KidId) { return this.starsByKid[kid] ?? 0; }
  saveStars(kid: KidId, stars: number) { this.starsByKid[kid] = stars; }
  loadFreezes(kid: KidId) { return this.freezesByKid[kid] ?? null; }
  saveFreezes(kid: KidId, count: number) { this.freezesByKid[kid] = count; }
  loadMission(kid: KidId) { return this.missions[kid] ?? null; }
  saveMission(kid: KidId, state: MissionState) { this.missions[kid] = state; }
  loadWeekly(kid: KidId) { return this.weeklyByKid[kid] ?? null; }
  saveWeekly(kid: KidId, streak: WeeklyStreak) { this.weeklyByKid[kid] = streak; }
  loadWeekProgress(kid: KidId) { return this.progressByKid[kid] ?? null; }
  saveWeekProgress(kid: KidId, progress: WeekProgress) { this.progressByKid[kid] = progress; }
  loadPetCollection(kid: KidId) { return this.collections[kid] ?? null; }
  savePetCollection(kid: KidId, collection: PetCollection) { this.collections[kid] = collection; }
  loadOwnedAccessories(kid: KidId) { return this.accessoriesByKid[kid] ?? []; }
  saveOwnedAccessories(kid: KidId, owned: readonly string[]) { this.accessoriesByKid[kid] = owned; }
  loadOwnedAvatars(kid: KidId) { return this.avatarsByKid[kid] ?? []; }
  saveOwnedAvatars(kid: KidId, owned: readonly string[]) { this.avatarsByKid[kid] = owned; }
  loadUnlockedDecks(kid: KidId) { return this.decksByKid[kid] ?? []; }
  saveUnlockedDecks(kid: KidId, decks: readonly string[]) { this.decksByKid[kid] = decks; }
  loadStickerCounts() { return this.counts; }
  saveStickerCounts(counts: Readonly<Record<string, number>>) { this.counts = counts; }
  loadCategoryAwards(kid: KidId) { return this.awardsByKid[kid] ?? {}; }
  saveCategoryAwards(kid: KidId, awards: Readonly<Record<string, StickerTier>>) { this.awardsByKid[kid] = awards; }
  loadRetoBest(kid: KidId) { return this.retoByKid[kid] ?? {}; }
  saveRetoBest(kid: KidId, best: Readonly<Record<string, number>>) { this.retoByKid[kid] = best; }
}

const KID: KidId = "listener";
const NOW = new Date("2026-07-15T10:00:00"); // a Wednesday, local time

describe("EarnStarsUseCase / SpendStarsUseCase", () => {
  it("earning adds to the balance and returns it", () => {
    const store = new FakeEconomyStore();
    expect(new EarnStarsUseCase(store).execute(KID, 7)).toBe(7);
    expect(new EarnStarsUseCase(store).execute(KID, 3)).toBe(10);
    expect(store.loadStars(KID)).toBe(10);
  });

  it("spending checks the balance before writing", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, 10);
    const spend = new SpendStarsUseCase(store);
    expect(spend.execute(KID, 11)).toBeNull();
    expect(store.loadStars(KID)).toBe(10); // nothing deducted on a refusal
    expect(spend.execute(KID, 10)).toBe(0);
    expect(store.loadStars(KID)).toBe(0);
  });
});

describe("GetMissionUseCase", () => {
  it("starts a fresh state when the stored one is from another day", () => {
    const store = new FakeEconomyStore();
    store.saveMission(KID, { day: "2026-07-14", done: ["learn"], claimed: true });
    const view = new GetMissionUseCase(store).execute(KID, NOW);
    expect(view.state).toEqual({ day: dayKey(NOW), done: [], claimed: false });
    expect(view.complete).toBe(false);
    expect(view.kinds.length).toBeGreaterThan(0);
  });
});

describe("MarkActivityDoneUseCase", () => {
  it("marks kinds and cascades a weekly active day when the misión completes", () => {
    const store = new FakeEconomyStore();
    const mark = new MarkActivityDoneUseCase(store);
    const view = new GetMissionUseCase(store).execute(KID, NOW);
    let last = view;
    for (const kind of view.kinds) {
      expect(last.complete).toBe(false);
      expect(store.loadWeekProgress(KID)).toBeNull(); // no cascade before complete
      last = mark.execute(KID, kind, NOW);
    }
    expect(last.complete).toBe(true);
    expect(store.loadWeekProgress(KID)?.days).toEqual([dayKey(NOW)]);
  });

  it("is idempotent per kind and per day", () => {
    const store = new FakeEconomyStore();
    const mark = new MarkActivityDoneUseCase(store);
    const kind = new GetMissionUseCase(store).execute(KID, NOW).kinds[0]!;
    mark.execute(KID, kind, NOW);
    const again = mark.execute(KID, kind, NOW);
    expect(again.state.done).toEqual([kind]);
  });
});

describe("ClaimMissionBonusUseCase", () => {
  function completeMission(store: FakeEconomyStore) {
    const mark = new MarkActivityDoneUseCase(store);
    for (const kind of new GetMissionUseCase(store).execute(KID, NOW).kinds) {
      mark.execute(KID, kind, NOW);
    }
  }

  it("pays the bonus exactly once", () => {
    const store = new FakeEconomyStore();
    completeMission(store);
    const claim = new ClaimMissionBonusUseCase(store);
    expect(claim.execute(KID, NOW)).toBe(MISSION_BONUS);
    expect(claim.execute(KID, NOW)).toBeNull(); // claim-once
    expect(store.loadStars(KID)).toBe(MISSION_BONUS);
  });

  it("refuses while the misión is incomplete", () => {
    const store = new FakeEconomyStore();
    expect(new ClaimMissionBonusUseCase(store).execute(KID, NOW)).toBeNull();
  });
});

describe("RolloverWeeklyUseCase", () => {
  it("defaults freezes to the starting grant and reports activeDays", () => {
    const store = new FakeEconomyStore();
    const view = new RolloverWeeklyUseCase(store).execute(KID, NOW);
    expect(view.freezes).toBe(STARTING_FREEZES);
    expect(view.count).toBe(0);
    expect(view.outcome).toBe("none");
    expect(view.activeDays).toBe(0);
  });

  it("spends a freeze to hold a live streak over an idle week", () => {
    const store = new FakeEconomyStore();
    store.saveWeekly(KID, { week: "2026-07-06", count: 2 }); // week before NOW's
    const view = new RolloverWeeklyUseCase(store).execute(KID, NOW);
    expect(view.outcome).toBe("frozen");
    expect(view.count).toBe(2);
    expect(view.freezes).toBe(STARTING_FREEZES - 1);
    expect(store.loadFreezes(KID)).toBe(STARTING_FREEZES - 1); // persisted
    expect(store.loadWeekly(KID)).toEqual({ week: "2026-07-13", count: 2 });
  });
});

describe("BuyFreezeUseCase", () => {
  it("spends and increments; refuses when unaffordable", () => {
    const store = new FakeEconomyStore();
    expect(new BuyFreezeUseCase(store).execute(KID)).toBeNull();
    store.saveStars(KID, FREEZE_COST);
    expect(new BuyFreezeUseCase(store).execute(KID)).toEqual({
      freezes: STARTING_FREEZES + 1,
      stars: 0,
    });
  });
});

describe("FeedPetUseCase", () => {
  it("charges a meal and grows the active pet without undressing it", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, MEAL_COST);
    store.savePetCollection(KID, {
      active: STARTER_SPECIES,
      owned: [STARTER_SPECIES],
      pets: { [STARTER_SPECIES]: { meals: 2, lastFed: null, worn: ["gorro"] } },
    });
    const fed = new FeedPetUseCase(store).execute(KID, NOW);
    expect(fed).not.toBeNull();
    expect(fed!.pet.meals).toBe(3);
    expect(fed!.pet.lastFed).toBe(dayKey(NOW));
    expect(fed!.pet.worn).toEqual(["gorro"]);
    expect(fed!.stars).toBe(0);
  });

  it("refuses when unaffordable", () => {
    const store = new FakeEconomyStore();
    expect(new FeedPetUseCase(store).execute(KID, NOW)).toBeNull();
  });
});

describe("AdoptSpeciesUseCase", () => {
  const conejo = PET_SPECIES.find((s) => s.id === "conejo")!;

  it("charges the catalog price, adds a fresh egg, and makes it active", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, conejo.cost);
    const adopted = new AdoptSpeciesUseCase(store).execute(KID, "conejo");
    expect(adopted).not.toBeNull();
    expect(adopted!.stars).toBe(0);
    expect(adopted!.collection.active).toBe("conejo");
    expect(adopted!.collection.owned).toContain(STARTER_SPECIES);
    expect(adopted!.collection.pets["conejo"]).toEqual({ meals: 0, lastFed: null });
  });

  it("refuses unknown species, owned species, and empty wallets", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, 10_000);
    const adopt = new AdoptSpeciesUseCase(store);
    expect(adopt.execute(KID, "sirena")).toBeNull();
    expect(adopt.execute(KID, STARTER_SPECIES)).toBeNull(); // starter is owned
    store.saveStars(KID, conejo.cost - 1);
    expect(adopt.execute(KID, "conejo")).toBeNull();
  });
});

describe("SetActiveSpeciesUseCase", () => {
  it("only activates a species the kid owns", () => {
    const store = new FakeEconomyStore();
    const set = new SetActiveSpeciesUseCase(store);
    set.execute(KID, "dragon"); // not owned — ignored
    expect(store.loadPetCollection(KID)).toBeNull();
    store.saveStars(KID, 10_000);
    new AdoptSpeciesUseCase(store).execute(KID, "conejo");
    set.execute(KID, STARTER_SPECIES);
    expect(store.loadPetCollection(KID)!.active).toBe(STARTER_SPECIES);
  });
});

describe("BuyAccessoryUseCase", () => {
  const gorro = ACCESSORIES.find((a) => a.id === "gorro")!;

  it("charges the catalog price, records ownership, and dresses the pet", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, gorro.cost);
    const bought = new BuyAccessoryUseCase(store).execute(KID, "gorro");
    expect(bought).not.toBeNull();
    expect(bought!.owned).toEqual(["gorro"]);
    expect(bought!.stars).toBe(0);
    const pet = store.loadPetCollection(KID)!.pets[STARTER_SPECIES]!;
    expect(pet.worn).toContain("gorro");
  });

  it("refuses unknown ids, owned items, and empty wallets", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, 10_000);
    const buy = new BuyAccessoryUseCase(store);
    expect(buy.execute(KID, "no-such-thing")).toBeNull();
    buy.execute(KID, "gorro");
    expect(buy.execute(KID, "gorro")).toBeNull(); // already owned
    store.saveStars(KID, 0);
    expect(buy.execute(KID, "lazo")).toBeNull();
  });
});

describe("ToggleAccessoryUseCase / PlaceAccessoryUseCase", () => {
  it("toggling requires ownership and flips worn state", () => {
    const store = new FakeEconomyStore();
    const toggle = new ToggleAccessoryUseCase(store);
    expect(toggle.execute(KID, "gorro")).toBeNull(); // not owned
    store.saveOwnedAccessories(KID, ["gorro"]);
    expect(toggle.execute(KID, "gorro")!.worn).toEqual(["gorro"]);
    expect(toggle.execute(KID, "gorro")!.worn).toEqual([]);
  });

  it("placing stores clamped percent coordinates on the active pet", () => {
    const store = new FakeEconomyStore();
    const placed = new PlaceAccessoryUseCase(store).execute(KID, "gorro", 150, -10);
    expect(placed.placements?.["gorro"]).toEqual({ x: 100, y: 0 });
  });
});

describe("OpenSurpriseUseCase", () => {
  it("refuses when unaffordable", () => {
    const store = new FakeEconomyStore();
    expect(new OpenSurpriseUseCase(store, () => 0).execute(KID)).toBeNull();
  });

  it("an accessory draw records ownership and dresses the pet", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, SURPRISE_COST);
    const opened = new OpenSurpriseUseCase(store, () => 0).execute(KID);
    expect(opened!.result.type).toBe("accessory");
    const id = (opened!.result as { id: string }).id;
    expect(store.loadOwnedAccessories(KID)).toContain(id);
    expect(opened!.stars).toBe(0);
  });

  it("a freeze draw grants a freeze on top of the starting stock", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, SURPRISE_COST);
    store.saveOwnedAccessories(KID, ACCESSORIES.map((a) => a.id)); // all owned
    const opened = new OpenSurpriseUseCase(store, () => 0.1).execute(KID);
    expect(opened!.result.type).toBe("freeze");
    expect(store.loadFreezes(KID)).toBe(STARTING_FREEZES + 1);
  });

  it("a star draw pays back into the wallet", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, SURPRISE_COST);
    store.saveOwnedAccessories(KID, ACCESSORIES.map((a) => a.id));
    const opened = new OpenSurpriseUseCase(store, () => 0.9).execute(KID);
    expect(opened!.result.type).toBe("stars");
    expect(opened!.stars).toBeGreaterThan(0);
    expect(store.loadStars(KID)).toBe(opened!.stars);
  });
});

describe("BuyAvatarUseCase", () => {
  const paid = AVATAR_CATALOG.find((a) => a.cost > 0)!;
  const free = AVATAR_CATALOG.find((a) => a.cost === 0)!;

  it("charges the catalog price and records ownership", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, paid.cost);
    expect(new BuyAvatarUseCase(store).execute(KID, paid.emoji)).toBe(0);
    expect(store.loadOwnedAvatars(KID)).toEqual([paid.emoji]);
  });

  it("refuses free starters, unknown emoji, owned avatars, empty wallets", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, 10_000);
    const buy = new BuyAvatarUseCase(store);
    expect(buy.execute(KID, free.emoji)).toBeNull(); // free = always owned
    expect(buy.execute(KID, "🗿")).toBeNull(); // not in the catalog
    buy.execute(KID, paid.emoji);
    expect(buy.execute(KID, paid.emoji)).toBeNull(); // already owned
    store.saveStars(KID, 0);
    const other = AVATAR_CATALOG.find((a) => a.cost > 0 && a.emoji !== paid.emoji)!;
    expect(buy.execute(KID, other.emoji)).toBeNull();
  });
});

describe("UnlockDeckUseCase", () => {
  it("spends once per deck", () => {
    const store = new FakeEconomyStore();
    store.saveStars(KID, 100);
    const unlock = new UnlockDeckUseCase(store);
    expect(unlock.execute(KID, "misterio", 60)).toBe(40);
    expect(store.loadUnlockedDecks(KID)).toEqual(["misterio"]);
    expect(unlock.execute(KID, "misterio", 60)).toBeNull(); // already unlocked
    expect(unlock.execute(KID, "otro", 60)).toBeNull(); // unaffordable now
  });
});

describe("ClaimCategoryRewardUseCase", () => {
  it("pays each tier once, never re-pays a lower or equal tier", () => {
    const store = new FakeEconomyStore();
    const claim = new ClaimCategoryRewardUseCase(store);
    expect(claim.execute(KID, "animals", "earned")).toBe(15);
    expect(claim.execute(KID, "animals", "earned")).toBeNull(); // same tier
    expect(claim.execute(KID, "animals", "gold")).toBe(50); // skips silver fine
    expect(claim.execute(KID, "animals", "silver")).toBeNull(); // lower than claimed
    expect(store.loadStars(KID)).toBe(65);
  });
});

describe("SaveRetoBestUseCase", () => {
  it("keeps only new records", () => {
    const store = new FakeEconomyStore();
    const save = new SaveRetoBestUseCase(store);
    expect(save.execute(KID, "animals", 5)).toBe(true);
    expect(save.execute(KID, "animals", 5)).toBe(false);
    expect(save.execute(KID, "animals", 4)).toBe(false);
    expect(save.execute(KID, "animals", 6)).toBe(true);
    expect(store.loadRetoBest(KID)["animals"]).toBe(6);
  });
});
