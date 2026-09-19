import { describe, expect, it } from "vitest";
import { stickerId } from "../src/domain/album";
import type { Deck } from "../src/domain/deck";
import type { DeckGroup } from "../src/domain/deck-group";
import type { KidId } from "../src/domain/kid";
import { earnableActivities } from "../src/domain/category";
import { buildCamino } from "../src/domain/trail";
import {
  EXAM_PASS_MARK,
  SUPER_EXAM_PASS_MARK,
  recordExamScore,
} from "../src/domain/exam";
import type { ExamRecords } from "../src/domain/exam";
import { card } from "./helpers";

/** A pinned clock — a sitting's timestamp is its merge identity (ADR 022). */
const AT = Date.UTC(2026, 8, 19, 9, 0, 0);


const KID: KidId = "listener";

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

/** Twelve shelves, one deck each, so shelf 4 is a real milestone. */
const LADDER = Array.from({ length: 12 }, (_, i) => group(`g${i + 1}`, [`d${i + 1}`]));
const DECKS = Array.from({ length: 12 }, (_, i) => testDeck(`d${i + 1}`));

function allOf(deckId: string): readonly string[] {
  const deck = DECKS.find((d) => d.id === deckId)!;
  return earnableActivities(deck, KID).map((a) => stickerId(KID, deckId, a));
}

/** Finish shelves 1..n and pass each one's exam at whatever its bar is. */
function through(n: number): { earned: string[]; records: ExamRecords } {
  const earned: string[] = [];
  let records: ExamRecords = {};
  for (let i = 1; i <= n; i += 1) {
    earned.push(...allOf(`d${i}`));
    const mark = i % 4 === 0 ? SUPER_EXAM_PASS_MARK : EXAM_PASS_MARK;
    records = recordExamScore(records, `g${i}`, mark, AT + i);
  }
  return { earned, records };
}

const shelf = (c: ReturnType<typeof buildCamino>, id: string) =>
  c.shelves.find((s) => s.groupId === id)!;

describe("a súper examen as a gate", () => {
  it("keeps shelf 5 shut while shelf 4's súper is unpassed", () => {
    const { earned } = through(4);
    const records = through(3).records; // 1-3 passed, 4 not yet
    const camino = buildCamino(LADDER, DECKS, KID, earned, {}, records);
    expect(shelf(camino, "g4").examPending).toBe(true);
    expect(shelf(camino, "g4").examKind).toBe("super");
    expect(shelf(camino, "g5").locked).toBe(true);
  });

  it("opens shelf 5 once the súper is passed at its own bar", () => {
    const { earned, records } = through(4);
    const camino = buildCamino(LADDER, DECKS, KID, earned, {}, records);
    expect(shelf(camino, "g5").locked).toBe(false);
  });

  it("refuses a score that would have passed a regular exam", () => {
    const { earned } = through(4);
    let records = through(3).records;
    records = recordExamScore(records, "g4", EXAM_PASS_MARK, AT); // 7 — a regular pass
    const camino = buildCamino(LADDER, DECKS, KID, earned, {}, records);
    expect(shelf(camino, "g4").examPassed).toBe(false);
    expect(shelf(camino, "g5").locked).toBe(true);
  });

  it("makes shelf 12's súper the capstone of the whole route", () => {
    const { earned, records } = through(12);
    const camino = buildCamino(LADDER, DECKS, KID, earned, {}, records);
    expect(camino.complete).toBe(true);
  });

  it("is not complete while only the capstone is outstanding", () => {
    const { earned } = through(12);
    const records = through(11).records;
    const camino = buildCamino(LADDER, DECKS, KID, earned, {}, records);
    expect(camino.complete).toBe(false);
    expect(camino.nextExamGroupId).toBe("g12");
    expect(shelf(camino, "g12").examKind).toBe("super");
  });
});

describe("la llave de papá", () => {
  it("opens exactly the shelf a grown-up named", () => {
    const camino = buildCamino(LADDER, DECKS, KID, [], {}, {}, ["g7"]);
    expect(shelf(camino, "g7").locked).toBe(false);
  });

  it("leaves everything else exactly as it was", () => {
    const camino = buildCamino(LADDER, DECKS, KID, [], {}, {}, ["g7"]);
    expect(shelf(camino, "g6").locked).toBe(true);
    expect(shelf(camino, "g8").locked).toBe(true);
    expect(shelf(camino, "g1").locked).toBe(false); // first shelf, as always
  });

  it("resumes normal gating from the opened shelf onward", () => {
    // Opening 7 does not open 8: the parent said "she is ready for this one",
    // not "turn the teaching off" (ADR 021 addendum).
    const earned = [...allOf("d7")];
    const records = recordExamScore({}, "g7", EXAM_PASS_MARK, AT);
    const camino = buildCamino(LADDER, DECKS, KID, earned, {}, records, ["g7"]);
    expect(shelf(camino, "g8").locked).toBe(false);
  });

  it("opens a súper shelf too — the valve must cover the hardest wall", () => {
    const camino = buildCamino(LADDER, DECKS, KID, [], {}, {}, ["g8"]);
    expect(shelf(camino, "g8").locked).toBe(false);
  });

  it("ignores a shelf id that is not on the ladder", () => {
    const camino = buildCamino(LADDER, DECKS, KID, [], {}, {}, ["nonsense"]);
    expect(camino.shelves.filter((s) => !s.locked)).toHaveLength(1);
  });

  it("changes nothing when empty", () => {
    const open = buildCamino(LADDER, DECKS, KID, [], {}, {}, []);
    const none = buildCamino(LADDER, DECKS, KID, [], {}, {});
    expect(open.shelves.map((s) => s.locked)).toEqual(
      none.shelves.map((s) => s.locked),
    );
  });
});
