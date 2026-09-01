import { describe, expect, it } from "vitest";
import { StaticDeckGroupRepository } from "../src/infrastructure/static-deck-group-repository";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import { ListDeckGroupsUseCase } from "../src/application/list-deck-groups";
import {
  groupsInTrailOrder,
  TRAIL_GROUP_ORDER,
} from "../src/infrastructure/deck-groups";

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

  /**
   * The bug this pins (2026-09-01): the "animales" shelf and its general deck
   * were both "Los animales / Animals", and so were "comida" and "food" ("La
   * comida / Food"). /album lists *decks*, home lists *shelves* — so the album
   * showed "La comida" finished in gold while the category called "La comida"
   * stood at 1 of 6, and both numbers were right about different things. A
   * parent cannot be expected to tell two identically-named things apart.
   *
   * Checked against EVERY shelf, not just the pair that collided: the same
   * mistake is one promotion away, since a new shelf is usually named after
   * the broad deck it grew out of.
   */
  it("never lets a shelf share a name with any deck", async () => {
    const allDecks = await decks.listDecks();
    for (const group of await groups.listGroups()) {
      for (const deck of allDecks) {
        expect(
          deck.nameSpanish,
          `deck ${deck.id} shares its Spanish name with shelf ${group.id}`,
        ).not.toBe(group.nameSpanish);
        expect(
          deck.nameEnglish,
          `deck ${deck.id} shares its English name with shelf ${group.id}`,
        ).not.toBe(group.nameEnglish);
      }
    }
  });

  it("gives every shelf a name of its own", async () => {
    const allGroups = await groups.listGroups();
    expect(new Set(allGroups.map((g) => g.nameSpanish)).size).toBe(allGroups.length);
    expect(new Set(allGroups.map((g) => g.nameEnglish)).size).toBe(allGroups.length);
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

  it("keeps home one screen: at most 12 groups", async () => {
    // Raised from 6 to seat Las letras (2026-07-14) — home's 2-column grid
    // absorbs one more shelf tile without scrolling meaningfully further.
    // Raised again to 8 for El calendario (2026-07-28), which also squares
    // the grid off: eight tiles fill four even rows with no orphan.
    // Raised to 9 for ¿Cómo soy? (2026-07-28): Mi casa y yo was full at 5,
    // so the describe-a-person decks needed a shelf of their own. The ninth
    // tile ends a row alone — accepted, since the alternative was cramming
    // hair and size onto a shelf about the house.
    // Raised to 10 for Formas y lugares (2026-08-17). Unlike every previous
    // raise this one costs nothing in layout: it re-pairs the orphaned ninth
    // tile, so the 2-column grid is back to even rows. Shapes and positions
    // had no shelf they belonged on — the spatial words are neither about the
    // house nor about the body — and Alto o bajo, a spatial idea parked on
    // ¿Cómo soy? for want of anywhere better, moved over to join them.
    // Raised to 12 for La comida and El transporte (2026-08-29), and like the
    // last raise it costs nothing in layout: two tiles keep the 2-column grid
    // on even rows. Both shelves are promotions rather than inventions — food,
    // fruit and vehicles already existed as decks buried inside Mi casa and
    // El mundo, and the two categories a kid names most now open from home in
    // one tap. Mi casa falls back to the 3-deck minimum, El mundo to 4.
    const allGroups = await groups.listGroups();
    expect(allGroups.length).toBeGreaterThanOrEqual(3);
    expect(allGroups.length).toBeLessThanOrEqual(12);
  });

  it("shelves La comida and El transporte, and the moved decks keep every card id", async () => {
    // The 2026-08-29 promotion. Both shelves are mostly *moves*: food, fruit
    // and vehicles already shipped inside Mi casa and El mundo. A move must
    // never rewrite a card id — every sticker, star and word-stat a kid has
    // earned is keyed by it, so a "tidy up the ids while we're here" edit
    // would silently wipe progress on the three most-played decks.
    const allGroups = await groups.listGroups();
    const byId = new Map(allGroups.map((g) => [g.id, g]));

    expect(byId.get("comida")!.deckIds).toEqual([
      "food", "fruit", "verduras", "dulces", "platos", "mesa",
    ]);
    expect(byId.get("transporte")!.deckIds).toEqual([
      "vehicles", "trabajo", "ruedas", "aire-mar", "viaje",
    ]);

    // The decks that moved, with the card ids they must still carry.
    const moved: Record<string, readonly string[]> = {
      food: [
        "manzana", "platano", "pan", "leche", "queso", "huevo", "fresa",
        "naranja-fruta", "zanahoria", "galleta", "agua", "helado",
      ],
      fruit: [
        "pera", "uva", "sandia", "melon", "pina", "melocoton", "cereza",
        "limon", "kiwi", "coco", "mango", "aguacate",
      ],
      vehicles: [
        "coche", "autobus", "tren", "avion", "barco", "bicicleta", "moto",
        "camion", "cohete", "helicoptero", "tractor", "ambulancia",
      ],
    };
    for (const [deckId, cardIds] of Object.entries(moved)) {
      const deck = await decks.getDeck(deckId);
      expect(deck!.cards.map((c) => c.id), deckId).toEqual(cardIds);
    }

    // The shelves they left are still legal, not emptied below the minimum.
    expect(byId.get("casa")!.deckIds).toEqual(["familia", "house", "clothes"]);
    expect(byId.get("mundo")!.deckIds).toEqual([
      "nature", "weather", "jobs", "city",
    ]);
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

describe("el camino's shelf order", () => {
  it("places every shelf on the ladder exactly once", async () => {
    const ids = (await groups.listGroups()).map((g) => g.id);
    expect([...TRAIL_GROUP_ORDER].sort()).toEqual([...ids].sort());
  });

  it("starts the route at the animals and ends it at the verbs", async () => {
    const ordered = groupsInTrailOrder(await groups.listGroups());
    expect(ordered[0]!.id).toBe("animales");
    expect(ordered.at(-1)!.id).toBe("verbos");
  });

  it("drops a shelf nobody placed to the end instead of losing it", () => {
    const stray = {
      id: "sin-ladera",
      nameSpanish: "x",
      nameEnglish: "x",
      emoji: "❓",
      deckIds: [],
    };
    const ordered = groupsInTrailOrder([
      stray,
      { ...stray, id: "letras" },
      { ...stray, id: "animales" },
    ]);
    expect(ordered.map((g) => g.id)).toEqual(["animales", "letras", "sin-ladera"]);
  });
});
