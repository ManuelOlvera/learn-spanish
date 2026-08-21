import { describe, expect, it } from "vitest";
import { stickerId } from "../src/domain/album";
import type { ActivityId } from "../src/domain/album";
import type { Deck } from "../src/domain/deck";
import type { DeckGroup } from "../src/domain/deck-group";
import type { KidId } from "../src/domain/kid";
import { buildCamino, trailActivities } from "../src/domain/trail";
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

/** Earn the first `n` activities this kid can actually earn on a deck. */
function stickersFor(kid: KidId, deck: Deck, n: number): readonly string[] {
  return trailActivities(deck, kid)
    .slice(0, n)
    .map((activity) => stickerId(kid, deck.id, activity));
}

const uno = testDeck("uno");
const dos = testDeck("dos");
const tres = testDeck("tres");
const groups = [group("g1", ["uno", "dos"]), group("g2", ["tres"])];
const decks = [uno, dos, tres];

describe("trailActivities", () => {
  it("offers a kid only their own difficulty's activities", () => {
    const listener = trailActivities(uno, "listener");
    expect(listener).toContain("learn");
    expect(listener).toContain("quiz-listen");
    expect(listener).not.toContain("quiz-read");
    expect(listener).toHaveLength(6);
  });

  it("offers a learn-only deck nothing but flashcards", () => {
    expect(trailActivities(testDeck("verbo", { learnOnly: true }), "reader")).toEqual([
      "learn",
    ]);
  });
});

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
