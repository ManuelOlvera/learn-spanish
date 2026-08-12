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

  it("keeps groups shelf-sized: 3-6 decks each", async () => {
    // Raised from 5 to 6 for La cara (2026-08-12), which split out of El
    // cuerpo once drawn card art made the face words teachable. ¿Cómo soy?
    // was the only shelf the face could sit on, and home is already at its
    // 9-shelf cap — so the deck row grows rather than the shelf list.
    for (const group of await groups.listGroups()) {
      expect(group.deckIds.length).toBeGreaterThanOrEqual(3);
      expect(group.deckIds.length).toBeLessThanOrEqual(6);
    }
  });

  it("keeps home one screen: at most 9 groups", async () => {
    // Raised from 6 to seat Las letras (2026-07-14) — home's 2-column grid
    // absorbs one more shelf tile without scrolling meaningfully further.
    // Raised again to 8 for El calendario (2026-07-28), which also squares
    // the grid off: eight tiles fill four even rows with no orphan.
    // Raised to 9 for ¿Cómo soy? (2026-07-28): Mi casa y yo was full at 5,
    // so the describe-a-person decks needed a shelf of their own. The ninth
    // tile ends a row alone — accepted, since the alternative was cramming
    // hair and size onto a shelf about the house.
    const allGroups = await groups.listGroups();
    expect(allGroups.length).toBeGreaterThanOrEqual(3);
    expect(allGroups.length).toBeLessThanOrEqual(9);
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
