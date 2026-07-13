import { describe, expect, it } from "vitest";
import { StaticDeckGroupRepository } from "../src/infrastructure/static-deck-group-repository";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import { ListDeckGroupsUseCase } from "../src/application/list-deck-groups";

const groups = new StaticDeckGroupRepository();
const decks = new StaticDeckRepository();

describe("deck groups content", () => {
  it("partitions every non-secret deck into exactly one group (home shows groups only)", async () => {
    const allGroups = await groups.listGroups();
    const grouped = allGroups.flatMap((g) => g.deckIds);
    const deckIds = (await decks.listDecks())
      .filter((d) => !d.secret)
      .map((d) => d.id);
    expect([...grouped].sort()).toEqual([...deckIds].sort());
  });

  it("keeps secret decks off every shelf (they're unlocked with stars)", async () => {
    const secret = (await decks.listDecks()).filter((d) => d.secret);
    expect(secret.length).toBeGreaterThan(0);
    for (const d of secret) {
      expect(d.unlockCost, `${d.id} needs a price`).toBeGreaterThan(0);
    }
    const grouped = new Set(
      (await groups.listGroups()).flatMap((g) => g.deckIds),
    );
    for (const d of secret) {
      expect(grouped.has(d.id), `${d.id} must not be shelved`).toBe(false);
    }
  });

  it("keeps groups shelf-sized: 3-5 decks each", async () => {
    for (const group of await groups.listGroups()) {
      expect(group.deckIds.length).toBeGreaterThanOrEqual(3);
      expect(group.deckIds.length).toBeLessThanOrEqual(5);
    }
  });

  it("keeps home one screen: at most 7 groups", async () => {
    // Raised from 6 to seat Las letras (2026-07-14) — home's 2-column grid
    // absorbs one more shelf tile without scrolling meaningfully further.
    const allGroups = await groups.listGroups();
    expect(allGroups.length).toBeGreaterThanOrEqual(3);
    expect(allGroups.length).toBeLessThanOrEqual(7);
  });

  it("gives every group an id, names, and a picture", async () => {
    for (const group of await groups.listGroups()) {
      expect(group.id).not.toBe("");
      expect(group.nameSpanish).not.toBe("");
      expect(group.nameEnglish).not.toBe("");
      expect(group.emoji).not.toBe("");
    }
  });
});

describe("ListDeckGroupsUseCase", () => {
  it("returns every group from the repository", async () => {
    const useCase = new ListDeckGroupsUseCase(groups);
    await expect(useCase.execute()).resolves.toEqual(
      await groups.listGroups(),
    );
  });
});
