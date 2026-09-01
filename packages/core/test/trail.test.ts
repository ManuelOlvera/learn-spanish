import { describe, expect, it } from "vitest";
import { stickerId } from "../src/domain/album";
import type { ActivityId } from "../src/domain/album";
import type { Deck } from "../src/domain/deck";
import type { DeckGroup } from "../src/domain/deck-group";
import type { KidId } from "../src/domain/kid";
import {
  categoryTierFromAlbum,
  earnableActivities,
} from "../src/domain/category";
import { buildCamino } from "../src/domain/trail";
import { TIER_THRESHOLDS } from "../src/domain/sticker-tiers";
import { card } from "./helpers";

function testDeck(id: string, extra: Partial<Deck> = {}): Deck {
  return {
    id,
    nameSpanish: id,
    nameEnglish: id,
    emoji: "🧪",
    cards: [card(1), card(2), card(3), card(4)],
    ...extra,
  };
}

function group(id: string, deckIds: readonly string[]): DeckGroup {
  return {
    id,
    nameSpanish: id,
    nameEnglish: id,
    emoji: "📦",
    deckIds,
  };
}

/** Play every one of a deck's activities `times` over, as the counts ledger
 *  would record it. */
function countsFor(
  kid: KidId,
  deck: Deck,
  times: number,
): Record<string, number> {
  return Object.fromEntries(
    earnableActivities(deck, kid).map((a) => [stickerId(kid, deck.id, a), times]),
  );
}

/** Earn the first `n` activities this kid can actually earn on a deck. */
function stickersFor(kid: KidId, deck: Deck, n: number): readonly string[] {
  return earnableActivities(deck, kid)
    .slice(0, n)
    .map((activity) => stickerId(kid, deck.id, activity));
}

const uno = testDeck("uno");
const dos = testDeck("dos");
const tres = testDeck("tres");
const groups = [group("g1", ["uno", "dos"]), group("g2", ["tres"])];
const decks = [uno, dos, tres];

describe("buildCamino", () => {
  it("completes a step only when every activity the kid can earn is done", () => {
    const camino = buildCamino(groups, decks, "listener", stickersFor("listener", uno, 6));
    expect(camino.shelves[0]!.steps[0]).toMatchObject({
      deckId: "uno",
      done: 6,
      target: 6,
      complete: true,
    });
  });

  it("leaves a step one activity short incomplete", () => {
    const camino = buildCamino(groups, decks, "listener", stickersFor("listener", uno, 5));
    expect(camino.shelves[0]!.steps[0]).toMatchObject({
      done: 5,
      target: 6,
      complete: false,
    });
  });

  it("completes a learn-only deck at its single activity", () => {
    const verbo = testDeck("verbo", { learnOnly: true });
    const camino = buildCamino(
      [group("g1", ["verbo"])],
      [verbo],
      "reader",
      [stickerId("reader", "verbo", "learn")],
    );
    expect(camino.shelves[0]!.steps[0]).toMatchObject({
      done: 1,
      target: 1,
      complete: true,
    });
  });

  it("points at the first incomplete deck of the first incomplete shelf", () => {
    const camino = buildCamino(groups, decks, "listener", stickersFor("listener", uno, 6));
    expect(camino.nextGroupId).toBe("g1");
    expect(camino.nextDeckId).toBe("dos");
  });

  it("skips a finished shelf when picking the next step", () => {
    const earned = [
      ...stickersFor("listener", uno, 6),
      ...stickersFor("listener", dos, 6),
    ];
    const camino = buildCamino(groups, decks, "listener", earned);
    expect(camino.shelves[0]!.complete).toBe(true);
    expect(camino.nextGroupId).toBe("g2");
    expect(camino.nextDeckId).toBe("tres");
  });

  it("has no next step once every shelf is done", () => {
    const earned = [uno, dos, tres].flatMap((d) => stickersFor("listener", d, 6));
    const camino = buildCamino(groups, decks, "listener", earned);
    expect(camino.nextGroupId).toBeNull();
    expect(camino.nextDeckId).toBeNull();
    expect(camino.complete).toBe(true);
  });

  it("counts a shelf's finished steps", () => {
    const camino = buildCamino(groups, decks, "listener", stickersFor("listener", uno, 6));
    expect(camino.shelves[0]).toMatchObject({ doneSteps: 1, complete: false });
    expect(camino.shelves[0]!.steps).toHaveLength(2);
  });

  it("keeps each kid's route independent", () => {
    // The reader has finished "uno"; the listener's own route is untouched.
    const camino = buildCamino(groups, decks, "listener", stickersFor("reader", uno, 6));
    expect(camino.shelves[0]!.steps[0]).toMatchObject({ done: 0, complete: false });
    expect(camino.nextDeckId).toBe("uno");
  });

  it("never makes a step of the secret deck", () => {
    const mystery = testDeck("mystery", { secret: true });
    const camino = buildCamino(
      [group("g1", ["uno", "mystery"])],
      [uno, mystery],
      "listener",
      [],
    );
    expect(camino.shelves[0]!.steps.map((s) => s.deckId)).toEqual(["uno"]);
  });

  it("ignores a shelved deck the pack no longer has", () => {
    const camino = buildCamino([group("g1", ["uno", "fantasma"])], [uno], "listener", []);
    expect(camino.shelves[0]!.steps.map((s) => s.deckId)).toEqual(["uno"]);
  });

  it("does not credit a step for another deck's stickers", () => {
    const strays: readonly ActivityId[] = ["learn", "quiz-listen", "scene-listen"];
    const earned = strays.map((a) => stickerId("listener", "dos", a));
    const camino = buildCamino(groups, decks, "listener", earned);
    expect(camino.shelves[0]!.steps[0]).toMatchObject({ deckId: "uno", done: 0 });
    expect(camino.shelves[0]!.steps[1]).toMatchObject({ deckId: "dos", done: 3 });
    expect(camino.shelves[0]!.steps[1]!.complete).toBe(false);
    expect(camino.nextDeckId).toBe("uno");
  });
});

describe("a step's tier", () => {
  it("is none until every activity is played at least once", () => {
    const camino = buildCamino(groups, decks, "listener", stickersFor("listener", uno, 5));
    expect(camino.shelves[0]!.steps[0]!.tier).toBe("none");
  });

  it("is earned on one play-through of each", () => {
    const camino = buildCamino(groups, decks, "listener", stickersFor("listener", uno, 6));
    expect(camino.shelves[0]!.steps[0]!.tier).toBe("earned");
  });

  it("reaches silver and gold as the deck is replayed", () => {
    const silver = buildCamino(
      groups,
      decks,
      "listener",
      stickersFor("listener", uno, 6),
      countsFor("listener", uno, TIER_THRESHOLDS.silver),
    );
    expect(silver.shelves[0]!.steps[0]!.tier).toBe("silver");

    const gold = buildCamino(
      groups,
      decks,
      "listener",
      stickersFor("listener", uno, 6),
      countsFor("listener", uno, TIER_THRESHOLDS.gold),
    );
    expect(gold.shelves[0]!.steps[0]!.tier).toBe("gold");
  });

  it("is only as strong as the deck's weakest activity", () => {
    // Everything gold but one activity played once — the album calls that
    // "earned", and the route must say exactly the same thing.
    const counts = countsFor("listener", uno, TIER_THRESHOLDS.gold);
    counts[stickerId("listener", "uno", "scene-listen")] = 1;
    const camino = buildCamino(
      groups,
      decks,
      "listener",
      stickersFor("listener", uno, 6),
      counts,
    );
    expect(camino.shelves[0]!.steps[0]!.tier).toBe("earned");
  });
});

describe("a shelf's tier", () => {
  it("is none while any deck on it is unfinished", () => {
    const camino = buildCamino(groups, decks, "listener", stickersFor("listener", uno, 6));
    expect(camino.shelves[0]!.tier).toBe("none");
  });

  it("takes the weakest deck's tier once the shelf is done", () => {
    const earned = [
      ...stickersFor("listener", uno, 6),
      ...stickersFor("listener", dos, 6),
    ];
    const counts = {
      ...countsFor("listener", uno, TIER_THRESHOLDS.gold),
      ...countsFor("listener", dos, TIER_THRESHOLDS.silver),
    };
    const camino = buildCamino(groups, decks, "listener", earned, counts);
    expect(camino.shelves[0]!.complete).toBe(true);
    expect(camino.shelves[0]!.tier).toBe("silver");
  });

  it("is gold only when every deck on it is gold", () => {
    const earned = [
      ...stickersFor("listener", uno, 6),
      ...stickersFor("listener", dos, 6),
    ];
    const counts = {
      ...countsFor("listener", uno, TIER_THRESHOLDS.gold),
      ...countsFor("listener", dos, TIER_THRESHOLDS.gold),
    };
    const camino = buildCamino(groups, decks, "listener", earned, counts);
    expect(camino.shelves[0]!.tier).toBe("gold");
  });

  it("treats a sticker with no count row as one play (pre-tier albums)", () => {
    const camino = buildCamino(groups, decks, "listener", stickersFor("listener", uno, 6), {});
    expect(camino.shelves[0]!.steps[0]!.tier).toBe("earned");
  });
});

/**
 * The reported symptom, pinned as one property: home's shelf pips count
 * stickers, the album page's medal reads the counts ledger. A ledger that has
 * run ahead of the album must not make the two say different things — La
 * comida showed one pip filled while every one of its decks wore a 🥇.
 */
describe("the album medal and el camino never disagree", () => {
  const deck = testDeck("platos");
  const shelf = [group("comida", ["platos"])];
  const activities = earnableActivities(deck, "listener");
  const fullCounts = Object.fromEntries(
    activities.map((a) => [stickerId("listener", "platos", a), 5]),
  );

  it("gives no medal to a deck the route calls untouched", () => {
    const camino = buildCamino(shelf, [deck], "listener", [], fullCounts);
    const step = camino.shelves[0]!.steps[0]!;
    expect(step.complete).toBe(false);
    expect(step.done).toBe(0);
    // The album page asks this for its medal; it must agree with the pips.
    expect(
      categoryTierFromAlbum("listener", "platos", activities, fullCounts, new Set()),
    ).toBe("none");
    expect(step.tier).toBe("none");
  });

  it("still tiers a deck the route calls finished", () => {
    const earned = activities.map((a) => stickerId("listener", "platos", a));
    const camino = buildCamino(shelf, [deck], "listener", earned, fullCounts);
    const step = camino.shelves[0]!.steps[0]!;
    expect(step.complete).toBe(true);
    expect(step.tier).toBe("gold");
    expect(
      categoryTierFromAlbum(
        "listener",
        "platos",
        activities,
        fullCounts,
        new Set(earned),
      ),
    ).toBe("gold");
  });
});
