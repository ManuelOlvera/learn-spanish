import { ALL_ACTIVITIES, stickerId } from "./album";
import type { ActivityId } from "./album";
import { activitiesForKid } from "./category";
import type { Deck } from "./deck";
import type { DeckGroup } from "./deck-group";
import type { KidId } from "./kid";

/**
 * El camino — the guided route through the pack, at two zoom levels: the
 * shelves in learning order, and inside each one its decks in pack order.
 *
 * It **never locks anything**. The route is a suggestion drawn on top of the
 * free picture-navigation the app is built on: every deck stays as reachable
 * as it was, and the camino only says how far a kid has come and which single
 * thing is next. That is the condition roadmap #22 set for building it at all.
 *
 * Progress is *derived* from the album, never stored — so there is no new
 * storage key, no migration, and nothing extra for sync to merge. Replaying a
 * deck cannot lose a step, because the sticker that proves it stays earned.
 */

/** One stop on a shelf's path: a deck, and how far into it the kid is. */
export interface TrailStep {
  readonly deckId: string;
  readonly done: number;
  readonly target: number;
  readonly complete: boolean;
}

/** One shelf's path. */
export interface TrailShelf {
  readonly groupId: string;
  readonly steps: readonly TrailStep[];
  readonly doneSteps: number;
  readonly complete: boolean;
}

/** The whole route, plus the one thing to do next. */
export interface Camino {
  readonly shelves: readonly TrailShelf[];
  readonly nextGroupId: string | null;
  readonly nextDeckId: string | null;
  readonly complete: boolean;
}

/**
 * The activities that count toward a deck's step for one kid: the shared
 * `learn` plus that kid's own difficulty variant of each game (six in all) —
 * and a step is done only when **every one** of them is. That is deliberately
 * the same bar as the album's own category completion, so a deck's ⭐ on the
 * route and its 🥉 in the album always mean the same thing.
 *
 * A learn-only deck (the verbs shelf) offers flashcards and nothing else, so
 * its step is one activity deep — otherwise it could never be completed.
 * Every other deck can offer all five games: the content tests hold every deck
 * at 10–17 cards, comfortably above what any of them needs to deal a round.
 */
export function trailActivities(deck: Deck, kid: KidId): readonly ActivityId[] {
  return deck.learnOnly ? ["learn"] : activitiesForKid(ALL_ACTIVITIES, kid);
}

function stepFor(
  deck: Deck,
  kid: KidId,
  earned: ReadonlySet<string>,
): TrailStep {
  const activities = trailActivities(deck, kid);
  const done = activities.filter((activity) =>
    earned.has(stickerId(kid, deck.id, activity)),
  ).length;
  return {
    deckId: deck.id,
    done,
    target: activities.length,
    complete: done === activities.length,
  };
}

/**
 * Build a kid's camino. `groups` must already be in trail order — the order
 * is content curation and lives beside the shelves in `infrastructure`.
 *
 * Secret decks (El misterio) are left out: a star-gated bonus is not a rung on
 * the learning ladder, and a route that pointed at a locked deck would break
 * the never-locks promise from the other side.
 */
export function buildCamino(
  groups: readonly DeckGroup[],
  decks: readonly Deck[],
  kid: KidId,
  earned: readonly string[],
): Camino {
  const owned = new Set(earned);
  const shelves = groups.map((group): TrailShelf => {
    const steps = group.deckIds.flatMap((deckId) => {
      const deck = decks.find((d) => d.id === deckId);
      return deck === undefined || deck.secret === true
        ? []
        : [stepFor(deck, kid, owned)];
    });
    const doneSteps = steps.filter((step) => step.complete).length;
    return {
      groupId: group.id,
      steps,
      doneSteps,
      complete: steps.length > 0 && doneSteps === steps.length,
    };
  });

  // The first unfinished stop, reading the route in order: finished shelves
  // and any that hold no steps at all are simply passed over.
  let nextGroupId: string | null = null;
  let nextDeckId: string | null = null;
  for (const shelf of shelves) {
    const step = shelf.steps.find((s) => !s.complete);
    if (step !== undefined) {
      nextGroupId = shelf.groupId;
      nextDeckId = step.deckId;
      break;
    }
  }

  return { shelves, nextGroupId, nextDeckId, complete: nextDeckId === null };
}
