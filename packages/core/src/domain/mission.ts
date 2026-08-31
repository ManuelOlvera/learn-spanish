import { adivinaDifficulties } from "./adivina";
import { COUNTING_DECK_ID } from "./counting";
import { dayKey } from "./daily";
import type { Deck } from "./deck";
import type { DeckGroup } from "./deck-group";
import { globoDifficulties } from "./globo";
import type { KidId } from "./kid";
import { sopaDifficulties } from "./sopa";
import type { ActivityId } from "./album";

/** Every misión kind there is. The type is DERIVED from this list so the two
 *  can never drift, and so presentation maps keyed by `MissionKind` (the home
 *  screen's icon map) fail to compile until a newly added kind is drawn —
 *  `cuento` was once drawable with no icon and rendered a blank tile. */
export const MISSION_KINDS = [
  "learn",
  "quiz",
  "si-no",
  "match",
  "connect",
  "scene",
  "frases",
  "cuento",
  "duel",
  "counting",
  "spelling",
  "sopa",
  "globo",
  "adivina",
  "reto",
  "hablar",
] as const;

/** La misión del día: three activity kinds to complete, new every day,
 *  different per kid, +MISSION_BONUS stars from the bonus chest. */
export type MissionKind = (typeof MISSION_KINDS)[number];

/** Kinds either kid can complete at their own difficulty. Two of the canonical
 *  kinds stay out of every pool: `reto` is timed and the misión must be
 *  pressure-free, and `hablar` lives on only 16 of the 44 decks, so drawing it
 *  could set a task the deck a kid opens cannot offer. Both are still in
 *  MISSION_KINDS so they keep a type and an icon. */
const SHARED_KINDS: readonly MissionKind[] = [
  "learn",
  "quiz",
  "si-no",
  "match",
  "connect",
  "scene",
  "frases",
  "cuento",
  "duel",
  "counting",
];

/** Each kid draws from their own pool: the reader's adds the four letter
 *  games — spelling, the sopa, el globo and adivina (reading practice a
 *  pre-reader can't do) — so the misión leans into what that kid is
 *  actually working on. */
const KIND_POOLS: Record<KidId, readonly MissionKind[]> = {
  listener: SHARED_KINDS,
  reader: [...SHARED_KINDS, "spelling", "sopa", "globo", "adivina"],
};

export const MISSION_SIZE = 3;

export interface MissionState {
  readonly day: string;
  readonly done: readonly MissionKind[];
  readonly claimed: boolean;
}

/** Which mission kind an activity feeds. */
export function activityKind(activity: ActivityId): MissionKind {
  if (!activity.includes("-")) {
    return activity as MissionKind;
  }
  const game = activity.slice(0, activity.lastIndexOf("-"));
  return game as MissionKind;
}

/** Deterministic for (day, kid): FNV-1a seeds a small PRNG over the kinds. */
export function dailyMission(date: Date, kid: KidId): readonly MissionKind[] {
  let hash = 0x811c9dc5;
  for (const char of `${dayKey(date)}:${kid}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  const kinds = [...KIND_POOLS[kid]];
  const picked: MissionKind[] = [];
  for (let i = 0; i < MISSION_SIZE; i++) {
    hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
    hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39) ^ (hash >>> 16);
    picked.push(kinds.splice((hash >>> 0) % kinds.length, 1)[0]!);
  }
  return picked;
}

export function markMissionDone(
  state: MissionState | null,
  today: string,
  kind: MissionKind,
): MissionState {
  const current =
    state !== null && state.day === today
      ? state
      : { day: today, done: [] as readonly MissionKind[], claimed: false };
  if (current.done.includes(kind)) {
    return current;
  }
  return { ...current, done: [...current.done, kind] };
}

export function missionComplete(
  state: MissionState | null,
  mission: readonly MissionKind[],
): boolean {
  return state !== null && mission.every((kind) => state.done.includes(kind));
}

/**
 * Where a misión kind is played. Most kinds are a game on a deck; adivina is
 * played over a whole shelf; las frases and los cuentos have one fixed home
 * each. `null` when the pack offers nowhere to send the kid, which is the
 * only honest answer for a kind no deck can host.
 */
export type MissionTarget =
  | { readonly scope: "deck"; readonly deckId: string }
  | { readonly scope: "shelf"; readonly groupId: string }
  | { readonly scope: "pack" }
  | null;

/** Whether a deck can host a misión kind — the same gates the deck's own game
 *  menu uses to decide which tiles it draws. A kid sent to a deck that cannot
 *  host the game would land on a menu with no way to do the task. */
function deckHosts(kind: MissionKind, deck: Deck): boolean {
  if (deck.secret === true) {
    return false;
  }
  switch (kind) {
    // Flashcards are the one game every deck offers, learn-only included.
    case "learn":
      return true;
    case "counting":
      return deck.id === COUNTING_DECK_ID;
    case "sopa":
      return sopaDifficulties(deck).length > 0;
    case "globo":
      return globoDifficulties(deck).length > 0;
    // Habla con tu mascota runs on a curated half of the pack, and that list
    // is content (infrastructure), not something this layer can see. It is out
    // of every draw pool for exactly that reason — see KIND_POOLS — so it
    // never needs a route, and saying so beats guessing a deck wrong.
    case "hablar":
      return false;
    // Not played on a deck at all; `missionTarget` answers these before here.
    case "frases":
    case "cuento":
    case "adivina":
      return false;
    // The quiz-shaped games: every deck but the learn-only ones.
    default:
      return deck.learnOnly !== true;
  }
}

/** Whether a shelf holds enough deducible words for Adivina la palabra. */
function shelfHostsAdivina(
  group: DeckGroup,
  decks: readonly Deck[],
): boolean {
  const cards = group.deckIds.flatMap((id) => {
    const deck = decks.find((d) => d.id === id);
    return deck === undefined || deck.secret === true ? [] : deck.cards;
  });
  return adivinaDifficulties(cards).length > 0;
}

/**
 * Where to send a kid who taps one of today's misión icons: the game they are
 * being asked to play, on the stop **el camino is already pointing them at**
 * when that deck can host it, and otherwise the first deck in the pack that
 * can. Preferring the route's own next stop is what makes the misión pull in
 * the same direction as everything else on the home screen instead of
 * scattering the kid across the pack.
 *
 * @param preferredDeckId el camino's next deck, or null
 * @param preferredGroupId el camino's next shelf, or null
 */
export function missionTarget(
  kind: MissionKind,
  decks: readonly Deck[],
  groups: readonly DeckGroup[],
  preferredDeckId: string | null = null,
  preferredGroupId: string | null = null,
): MissionTarget {
  if (kind === "frases" || kind === "cuento") {
    return { scope: "pack" };
  }
  if (kind === "adivina") {
    const preferred = groups.find((g) => g.id === preferredGroupId);
    const group =
      preferred !== undefined && shelfHostsAdivina(preferred, decks)
        ? preferred
        : groups.find((g) => shelfHostsAdivina(g, decks));
    return group === undefined ? null : { scope: "shelf", groupId: group.id };
  }
  const preferred = decks.find((d) => d.id === preferredDeckId);
  const deck =
    preferred !== undefined && deckHosts(kind, preferred)
      ? preferred
      : decks.find((d) => deckHosts(kind, d));
  return deck === undefined ? null : { scope: "deck", deckId: deck.id };
}
