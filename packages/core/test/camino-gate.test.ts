import { describe, expect, it } from "vitest";
import { stickerId } from "../src/domain/album";
import type { Deck } from "../src/domain/deck";
import type { DeckGroup } from "../src/domain/deck-group";
import type { KidId } from "../src/domain/kid";
import { earnableActivities } from "../src/domain/category";
import {
  buildCamino,
  reachableDeckIds,
  reachableGroupIds,
} from "../src/domain/trail";
import { EXAM_PASS_MARK, recordExamScore } from "../src/domain/exam";
import type { ExamRecords } from "../src/domain/exam";
import { card } from "./helpers";

function testDeck(id: string): Deck {
  return {
    id,
    nameSpanish: id,
    nameEnglish: id,
    emoji: "🧪",
    cards: [card(1), card(2), card(3), card(4)],
  };
}

function group(id: string, deckIds: readonly string[]): DeckGroup {
  return { id, nameSpanish: id, nameEnglish: id, emoji: "📦", deckIds };
}

const KID: KidId = "listener";
const uno = testDeck("uno");
const dos = testDeck("dos");
const tres = testDeck("tres");
const decks = [uno, dos, tres];
const groups = [group("g1", ["uno"]), group("g2", ["dos"]), group("g3", ["tres"])];

/** Every sticker this kid can earn on a deck — i.e. its step, finished. */
function allOf(deck: Deck): readonly string[] {
  return earnableActivities(deck, KID).map((a) => stickerId(KID, deck.id, a));
}

const passed = (...ids: string[]): ExamRecords =>
  ids.reduce<ExamRecords>((r, id) => recordExamScore(r, id, EXAM_PASS_MARK), {});

function shelf(camino: ReturnType<typeof buildCamino>, id: string) {
  return camino.shelves.find((s) => s.groupId === id)!;
}

describe("the gate", () => {
  it("leaves the first shelf open on a brand-new album", () => {
    const camino = buildCamino(groups, decks, KID, [], {}, {});
    expect(shelf(camino, "g1").locked).toBe(false);
  });

  it("locks every shelf after the first one", () => {
    const camino = buildCamino(groups, decks, KID, [], {}, {});
    expect(shelf(camino, "g2").locked).toBe(true);
    expect(shelf(camino, "g3").locked).toBe(true);
  });

  it("keeps the next shelf locked while only the decks are done", () => {
    // Completing the content is half the gate; the exam is the other half.
    const camino = buildCamino(groups, decks, KID, allOf(uno), {}, {});
    expect(shelf(camino, "g1").complete).toBe(true);
    expect(shelf(camino, "g2").locked).toBe(true);
  });

  it("opens the next shelf once the exam is passed", () => {
    const camino = buildCamino(groups, decks, KID, allOf(uno), {}, passed("g1"));
    expect(shelf(camino, "g2").locked).toBe(false);
  });

  it("does not open a shelf two ahead", () => {
    const camino = buildCamino(groups, decks, KID, allOf(uno), {}, passed("g1"));
    expect(shelf(camino, "g3").locked).toBe(true);
  });

  it("stays shut on a failing best score", () => {
    const failed = recordExamScore({}, "g1", EXAM_PASS_MARK - 1);
    const camino = buildCamino(groups, decks, KID, allOf(uno), {}, failed);
    expect(shelf(camino, "g2").locked).toBe(true);
  });

  it("opens the whole route when every shelf is done and examined", () => {
    const camino = buildCamino(
      groups,
      decks,
      KID,
      [...allOf(uno), ...allOf(dos), ...allOf(tres)],
      {},
      passed("g1", "g2", "g3"),
    );
    expect(camino.shelves.every((s) => !s.locked)).toBe(true);
    expect(camino.complete).toBe(true);
  });

  it("is not complete while a final exam is outstanding", () => {
    const camino = buildCamino(
      groups,
      decks,
      KID,
      [...allOf(uno), ...allOf(dos), ...allOf(tres)],
      {},
      passed("g1", "g2"),
    );
    expect(camino.complete).toBe(false);
    expect(camino.nextExamGroupId).toBe("g3");
  });
});

describe("grandfathering", () => {
  it("keeps every shelf up to the furthest one they COMPLETED", () => {
    // The day the gate ships, nobody loses a shelf they genuinely finished
    // (ADR 021). The frontier is completion, not a single sticker: one sticker
    // anywhere used to hold a shelf open forever, which left an established
    // kid with almost nothing gated at all.
    const camino = buildCamino(groups, decks, KID, allOf(tres), {}, {});
    expect(shelf(camino, "g1").locked).toBe(false);
    expect(shelf(camino, "g2").locked).toBe(false);
    expect(shelf(camino, "g3").locked).toBe(false);
  });

  it("does not open a shelf past that frontier", () => {
    const camino = buildCamino(groups, decks, KID, allOf(dos), {}, {});
    expect(shelf(camino, "g2").locked).toBe(false);
    expect(shelf(camino, "g3").locked).toBe(true);
  });

  it("no longer holds a shelf open on a single sticker", () => {
    // The old rule. A kid who merely dabbled in a far shelf is asked to reach
    // it in order — that is the whole point of the route.
    const dabbled = [stickerId(KID, "tres", "learn")];
    const camino = buildCamino(groups, decks, KID, dabbled, {}, {});
    expect(shelf(camino, "g3").locked).toBe(true);
  });

  it("opens everything before a completed shelf, gaps included", () => {
    // Completed shelf 3 but never finished 2: 2 stays reachable, because the
    // promise is "nothing you could reach yesterday disappears", not "your
    // history was tidy".
    const camino = buildCamino(groups, decks, KID, allOf(tres), {}, {});
    expect(shelf(camino, "g2").complete).toBe(false);
    expect(shelf(camino, "g2").locked).toBe(false);
  });

  it("locks everything for a kid who has completed nothing", () => {
    const camino = buildCamino(groups, decks, KID, [], {}, {});
    expect(shelf(camino, "g2").locked).toBe(true);
    expect(shelf(camino, "g3").locked).toBe(true);
  });
});

describe("what to do next", () => {
  it("points at the first deck of the first shelf on a fresh album", () => {
    const camino = buildCamino(groups, decks, KID, [], {}, {});
    expect(camino.nextGroupId).toBe("g1");
    expect(camino.nextDeckId).toBe("uno");
    expect(camino.nextExamGroupId).toBeNull();
  });

  it("points at the exam, not the next deck, once a shelf is finished", () => {
    const camino = buildCamino(groups, decks, KID, allOf(uno), {}, {});
    expect(camino.nextExamGroupId).toBe("g1");
    expect(camino.nextDeckId).toBeNull();
  });

  it("moves on to the next shelf's decks after the exam is passed", () => {
    const camino = buildCamino(groups, decks, KID, allOf(uno), {}, passed("g1"));
    expect(camino.nextExamGroupId).toBeNull();
    expect(camino.nextGroupId).toBe("g2");
    expect(camino.nextDeckId).toBe("dos");
  });

  it("sends a grandfathered kid back to the earliest unfinished shelf", () => {
    const camino = buildCamino(groups, decks, KID, allOf(tres), {}, {});
    expect(camino.nextGroupId).toBe("g1");
  });
});

describe("exam state per shelf", () => {
  it("marks the exam pending only once the decks are all done", () => {
    const none = buildCamino(groups, decks, KID, [], {}, {});
    expect(shelf(none, "g1").examPending).toBe(false);

    const done = buildCamino(groups, decks, KID, allOf(uno), {}, {});
    expect(shelf(done, "g1").examPending).toBe(true);
  });

  it("stops being pending once passed, and says so", () => {
    const camino = buildCamino(groups, decks, KID, allOf(uno), {}, passed("g1"));
    expect(shelf(camino, "g1").examPending).toBe(false);
    expect(shelf(camino, "g1").examPassed).toBe(true);
  });
});

describe("what the rest of the app may point at", () => {
  it("lists only the shelves the route has opened", () => {
    const camino = buildCamino(groups, decks, KID, allOf(uno), {}, passed("g1"));
    expect([...reachableGroupIds(camino)!].sort()).toEqual(["g1", "g2"]);
  });

  it("lists only the decks on those shelves", () => {
    const camino = buildCamino(groups, decks, KID, allOf(uno), {}, passed("g1"));
    expect([...reachableDeckIds(camino)!].sort()).toEqual(["dos", "uno"]);
  });

  it("includes a grandfathered shelf, which is reachable by definition", () => {
    const camino = buildCamino(groups, decks, KID, allOf(tres), {}, {});
    expect(reachableDeckIds(camino)!.has("tres")).toBe(true);
  });

  it("excludes a shelf the kid merely dabbled in", () => {
    const camino = buildCamino(
      groups,
      decks,
      KID,
      [stickerId(KID, "tres", "learn")],
      {},
      {},
    );
    expect(reachableDeckIds(camino)!.has("tres")).toBe(false);
  });

  it("returns null while the route is unknown, so nothing is filtered away", () => {
    // Home renders before the album has been read; filtering against an empty
    // set there would blank la misión for a frame on every load.
    expect(reachableDeckIds(null)).toBeNull();
    expect(reachableGroupIds(null)).toBeNull();
  });
});
