import { stickerId } from "./album";
import { categoryTierFromAlbum, earnableActivities, tierRank } from "./category";
import { examKindFor, shelfExamPassed, type ExamKind, type ExamRecords } from "./exam";
import type { Deck } from "./deck";
import type { DeckGroup } from "./deck-group";
import type { KidId } from "./kid";
import type { StickerTier } from "./sticker-tiers";

/**
 * El camino — the guided route through the pack, at two zoom levels: the
 * shelves in learning order, and inside each one its decks in pack order.
 *
 * It **gates** (ADR 021, which supersedes ADR 016 on exactly this point): a
 * shelf stays locked until the one before it is complete *and* that shelf's
 * exam is passed. The lock is real — `apps/web` makes a locked shelf's tiles
 * untappable on the home grid, not merely pale on the strip.
 *
 * Two rules keep the gate from becoming the wall ADR 016 feared. **Nothing a
 * kid has already played ever locks** (see `grandfathered` below), and a
 * failed exam always names a deck to go and play, so the route never says
 * "no" without saying "do this instead".
 *
 * Shelf *progress* is still derived from the album, never stored — that half
 * of ADR 016 survives intact. Exactly one fact is stored, the exam score,
 * because it provably cannot be derived (ADR 022).
 */

/** One stop on a shelf's path: a deck, and how far into it the kid is. */
export interface TrailStep {
  readonly deckId: string;
  readonly done: number;
  readonly target: number;
  readonly complete: boolean;
  /** How *deep*: the album's own medal for this deck, so a route mark and the
   *  album page can never disagree. `none` until the step is complete. */
  readonly tier: StickerTier;
}

/** One shelf's path. */
export interface TrailShelf {
  readonly groupId: string;
  readonly steps: readonly TrailStep[];
  readonly doneSteps: number;
  readonly complete: boolean;
  /** The weakest tier among its decks — a shelf is only as gold as its least
   *  played deck, the same "weakest slot" rule the album uses within a deck. */
  readonly tier: StickerTier;
  /** Unreachable: the shelf before it is unfinished or unexamined, and this
   *  kid has never played anything here. `apps/web` must honour this on the
   *  home grid, not only on the strip. */
  readonly locked: boolean;
  /** Every deck done, exam not yet passed — the exam is the thing to do. */
  readonly examPending: boolean;
  /** This shelf's exam has been passed at some point. */
  readonly examPassed: boolean;
  /** Which checkpoint this shelf carries — the ladder's thirds are súper
   *  exámenes, twice as long and drawn across everything before them. */
  readonly examKind: ExamKind;
  /** Open only because a grown-up opened it (la llave de papá), rather than
   *  because the route reached it. Kept distinct from `locked` so a parent can
   *  see what their own key is holding open. */
  readonly unlockedByParent: boolean;
}

/** The whole route, plus the one thing to do next. */
export interface Camino {
  readonly shelves: readonly TrailShelf[];
  readonly nextGroupId: string | null;
  /** The deck to play next, or null when an exam is what stands in the way. */
  readonly nextDeckId: string | null;
  /** The shelf whose exam is due now, or null. Exactly one of this and
   *  `nextDeckId` is set while the route is unfinished. */
  readonly nextExamGroupId: string | null;
  readonly complete: boolean;
}

/**
 * A deck's step is done only when **every** sticker this kid can earn on it
 * is — deliberately the same bar, computed by the same function, as the
 * album's own category completion (`earnableActivities`), so a deck's ⭐ on
 * the route and its 🥉 in the album always mean the same thing. Two copies of
 * that rule is exactly what drifted before: see the note on that function.
 */
function stepFor(
  deck: Deck,
  kid: KidId,
  earned: ReadonlySet<string>,
  counts: Readonly<Record<string, number>>,
): TrailStep {
  const activities = earnableActivities(deck, kid);
  const done = activities.filter((activity) =>
    earned.has(stickerId(kid, deck.id, activity)),
  ).length;
  return {
    deckId: deck.id,
    done,
    target: activities.length,
    complete: done === activities.length,
    // Deliberately the album's own function rather than a parallel rule: it
    // already handles the weakest-slot logic and the pre-tier stickers that
    // carry no count row.
    tier: categoryTierFromAlbum(kid, deck.id, activities, counts, earned),
  };
}

/** The weakest tier in a list — a shelf is as strong as its least-played deck. */
function weakestTier(tiers: readonly StickerTier[]): StickerTier {
  if (tiers.length === 0) {
    return "none";
  }
  return tiers.reduce((weakest, tier) =>
    tierRank(tier) < tierRank(weakest) ? tier : weakest,
  );
}

/**
 * Build a kid's camino. `groups` must already be in trail order — the order
 * is content curation and lives beside the shelves in `infrastructure`.
 *
 * Secret decks (El misterio) are left out: a star-gated bonus is not a rung on
 * the learning ladder, and its own star lock is a different mechanism from
 * this one.
 */
export function buildCamino(
  groups: readonly DeckGroup[],
  decks: readonly Deck[],
  kid: KidId,
  earned: readonly string[],
  /** Completion counts behind the stickers — the tier ledger. A sticker with no
   *  row reads as one play, matching what the album shows. */
  counts: Readonly<Record<string, number>> = {},
  /** Exam scores per shelf. Absent means no exam has ever been sat, which
   *  locks everything past the first shelf unless it is grandfathered. */
  examRecords: ExamRecords = {},
  /** Shelves a grown-up has opened with la llave de papá (ADR 021's addendum).
   *  A set that only grows, so syncing can never re-lock one. */
  unlockedShelves: readonly string[] = [],
): Camino {
  const owned = new Set(earned);
  const parentOpened = new Set(unlockedShelves);

  // The gate walks the ladder in order: each shelf decides whether the next
  // one opens. The first shelf is always open — there is nothing behind it to
  // finish, and it is the deck a three-year-old already loves (ADR 021).
  let gateOpen = true;

  const shelves = groups.map((group, index): TrailShelf => {
    const steps = group.deckIds.flatMap((deckId) => {
      const deck = decks.find((d) => d.id === deckId);
      return deck === undefined || deck.secret === true
        ? []
        : [stepFor(deck, kid, owned, counts)];
    });
    const doneSteps = steps.filter((step) => step.complete).length;
    const complete = steps.length > 0 && doneSteps === steps.length;

    // Grandfathering, derived rather than stored: a shelf this kid has already
    // touched stays open however far ahead it sits. Because a locked shelf can
    // never accrue a sticker, this can only ever be true of play that predates
    // the gate — so it self-limits, and nobody is sent back to shelf 1 on the
    // day this ships. Deleting it silently demotes every existing kid.
    const grandfathered = steps.some((step) => step.done > 0);
    // A grown-up's key opens exactly this shelf and nothing else: normal
    // gating resumes from here, because the parent said "she is ready for
    // this one", not "turn the teaching off" (ADR 021's addendum).
    const unlockedByParent = parentOpened.has(group.id);
    const locked = !gateOpen && !grandfathered && !unlockedByParent;

    // The bar comes from the shelf's position on the ladder, never from
    // storage — see examKindFor for the one cost that buys.
    const examKind = examKindFor(index);
    const examPassed = shelfExamPassed(examRecords, group.id, examKind);
    // A shelf with no steps at all (every deck secret, or a shelf mid-edit)
    // must not strand the route behind an exam it can never offer.
    const examPending = complete && !examPassed;

    gateOpen = complete && examPassed;

    return {
      groupId: group.id,
      steps,
      doneSteps,
      complete,
      tier: complete ? weakestTier(steps.map((s) => s.tier)) : "none",
      locked,
      examPending,
      examPassed,
      examKind,
      unlockedByParent,
    };
  });

  // The one thing to do next, reading the route in order. A shelf is only
  // finished with once its exam is passed too, so a completed-but-unexamined
  // shelf answers "the exam", not "the next shelf's first deck" — which is
  // locked anyway.
  let nextGroupId: string | null = null;
  let nextDeckId: string | null = null;
  let nextExamGroupId: string | null = null;
  for (const shelf of shelves) {
    if (shelf.complete && shelf.examPassed) {
      continue;
    }
    // Shelves holding nothing playable are passed over rather than becoming a
    // dead end the kid cannot clear.
    if (shelf.steps.length === 0) {
      continue;
    }
    nextGroupId = shelf.groupId;
    const step = shelf.steps.find((s) => !s.complete);
    if (step === undefined) {
      nextExamGroupId = shelf.groupId;
    } else {
      nextDeckId = step.deckId;
    }
    break;
  }

  return {
    shelves,
    nextGroupId,
    nextDeckId,
    nextExamGroupId,
    complete: nextGroupId === null,
  };
}

/**
 * The shelves this kid may actually open, or `null` when the route is not
 * known yet.
 *
 * This exists because the gate has to hold everywhere, not just on the tiles
 * that draw it. La misión picks a deck to send a kid to and falls back to
 * scanning the whole pack when its preferred one does not host the game it
 * wants — which, once shelves lock, could hand a three-year-old a link
 * straight past the gate. Anything that *chooses content on the kid's behalf*
 * filters through here first.
 *
 * `null` rather than an empty set while the camino is unknown: home renders
 * before the album has been read, and filtering against an empty set would
 * blank those surfaces for a frame on every single load.
 */
export function reachableGroupIds(
  camino: Camino | null,
): ReadonlySet<string> | null {
  if (camino === null) {
    return null;
  }
  return new Set(
    camino.shelves.filter((shelf) => !shelf.locked).map((shelf) => shelf.groupId),
  );
}

/** The decks on those shelves — the deck-level counterpart of the above. */
export function reachableDeckIds(
  camino: Camino | null,
): ReadonlySet<string> | null {
  if (camino === null) {
    return null;
  }
  return new Set(
    camino.shelves
      .filter((shelf) => !shelf.locked)
      .flatMap((shelf) => shelf.steps.map((step) => step.deckId)),
  );
}
