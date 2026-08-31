import { describe, expect, it } from "vitest";
import {
  dailyMission,
  missionTarget,
  MISSION_KINDS,
  type MissionKind,
} from "../src/domain/mission";
import { COUNTING_DECK_ID } from "../src/domain/counting";
import { ALL_KIDS } from "../src/domain/kid";
import { STARTER_PACK } from "../src/infrastructure/starter-pack";
import { DECK_GROUPS } from "../src/infrastructure/deck-groups";

/** The pack as home hands it over: the secret decks are never shelved, so a
 *  misión must never point at one. */
const decks = STARTER_PACK.filter((deck) => deck.secret !== true);

/** Every kind that can actually be drawn for either kid — what has to route. */
const drawable = new Set<MissionKind>(
  ALL_KIDS.flatMap((kid) =>
    Array.from({ length: 400 }, (_, day) =>
      dailyMission(new Date(2026, 0, 1 + day), kid),
    ).flat(),
  ),
);

describe("missionTarget", () => {
  it("routes every kind a kid can actually be given", () => {
    for (const kind of drawable) {
      expect(missionTarget(kind, decks, DECK_GROUPS), kind).not.toBeNull();
    }
  });

  it("sends deck kinds to a deck that really offers the game", () => {
    const target = missionTarget("sopa", decks, DECK_GROUPS);
    expect(target).toMatchObject({ scope: "deck" });
    // La sopa is gated on the deck's words fitting a grid, so the deck it
    // picked must be one that passes that gate — not merely the first deck.
    const deck = decks.find(
      (d) => target?.scope === "deck" && d.id === target.deckId,
    );
    expect(deck).toBeDefined();
  });

  it("sends ¿cuántos hay? to the one deck that can host it", () => {
    expect(missionTarget("counting", decks, DECK_GROUPS)).toEqual({
      scope: "deck",
      deckId: COUNTING_DECK_ID,
    });
  });

  it("prefers el camino's next stop when that deck can host the kind", () => {
    expect(missionTarget("quiz", decks, DECK_GROUPS, "colors")).toEqual({
      scope: "deck",
      deckId: "colors",
    });
  });

  it("falls back off the route rather than sending a kid nowhere", () => {
    // Los verbos is learn-only: it cannot host a quiz, so the route's own
    // next stop has to be overruled — otherwise the kid lands on a menu with
    // no ¿Dónde está? button on it.
    const target = missionTarget(
      "quiz",
      decks,
      DECK_GROUPS,
      "verbs-infinitive",
    );
    expect(target).toMatchObject({ scope: "deck" });
    expect(target).not.toEqual({ scope: "deck", deckId: "verbs-infinitive" });
  });

  it("still sends flashcards to a learn-only deck — it is all they offer", () => {
    expect(missionTarget("learn", decks, DECK_GROUPS, "verbs-infinitive")).toEqual({
      scope: "deck",
      deckId: "verbs-infinitive",
    });
  });

  it("plays adivina over a shelf, preferring the route's own", () => {
    const target = missionTarget("adivina", decks, DECK_GROUPS, null, "animales");
    expect(target).toEqual({ scope: "shelf", groupId: "animales" });
  });

  it("gives las frases and los cuentos their one fixed home", () => {
    expect(missionTarget("frases", decks, DECK_GROUPS)).toEqual({ scope: "pack" });
    expect(missionTarget("cuento", decks, DECK_GROUPS)).toEqual({ scope: "pack" });
  });

  it("never points at a secret deck", () => {
    for (const kind of MISSION_KINDS) {
      const target = missionTarget(kind, STARTER_PACK, DECK_GROUPS);
      if (target?.scope === "deck") {
        const deck = STARTER_PACK.find((d) => d.id === target.deckId);
        expect(deck?.secret, `${kind} → ${target.deckId}`).not.toBe(true);
      }
    }
  });

  it("answers null for hablar rather than guessing a deck", () => {
    // Habla con tu mascota's deck list is curated content this layer cannot
    // see, which is why it is out of every draw pool. The card then leaves the
    // icon a plain badge instead of linking somewhere it might not exist.
    expect(missionTarget("hablar", decks, DECK_GROUPS)).toBeNull();
    expect(drawable.has("hablar")).toBe(false);
  });

  it("answers null when the pack is empty instead of inventing a route", () => {
    expect(missionTarget("quiz", [], [])).toBeNull();
    expect(missionTarget("adivina", [], [])).toBeNull();
  });
});
