import { describe, expect, it } from "vitest";
import {
  ALL_KIDS,
  isKidId,
  KID_GAME_MODES,
  kidForActivity,
} from "../src/domain/kid";

describe("kids", () => {
  it("defines exactly a listener and a reader", () => {
    expect(ALL_KIDS).toEqual(["listener", "reader"]);
  });

  it("maps the listener to ear-first modes and the reader to text-first modes", () => {
    expect(KID_GAME_MODES.listener).toEqual({ quiz: "listen", match: "pictures" });
    expect(KID_GAME_MODES.reader).toEqual({ quiz: "read", match: "words" });
  });

  it("validates stored kid ids", () => {
    expect(isKidId("listener")).toBe(true);
    expect(isKidId("reader")).toBe(true);
    expect(isKidId("dino")).toBe(false);
    expect(isKidId("")).toBe(false);
  });

  it("infers the kid from a mode-specific activity", () => {
    expect(kidForActivity("quiz-listen")).toBe("listener");
    expect(kidForActivity("si-no-listen")).toBe("listener");
    expect(kidForActivity("match-pictures")).toBe("listener");
    expect(kidForActivity("frases-listen")).toBe("listener");
    expect(kidForActivity("quiz-read")).toBe("reader");
    expect(kidForActivity("si-no-read")).toBe("reader");
    expect(kidForActivity("match-words")).toBe("reader");
    expect(kidForActivity("frases-read")).toBe("reader");
  });

  it("cannot infer a kid from flashcards", () => {
    expect(kidForActivity("learn")).toBeNull();
  });
});
