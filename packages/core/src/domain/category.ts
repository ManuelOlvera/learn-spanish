import { ALL_ACTIVITIES, stickerId } from "./album";
import type { ActivityId } from "./album";
import type { Deck } from "./deck";
import { kidForActivity } from "./kid";
import type { KidId } from "./kid";
import { stickerTier } from "./sticker-tiers";
import type { StickerTier } from "./sticker-tiers";

/**
 * A "category" is one album section (a deck, or the pack-wide frases). It's
 * completed when every sticker a kid can *actually earn* in it is filled —
 * and it deepens as those stickers tier up. Completing a whole category to
 * bronze / silver / gold opens an escalating star chest, once per tier.
 */

/** The activities a given kid can earn: the shared ones (learn) plus that
 *  kid's own difficulty variant. A pre-reader never reaches the read/words
 *  games, so their album must not show — or count — those slots. */
export function activitiesForKid(
  activities: readonly ActivityId[],
  kid: KidId,
): readonly ActivityId[] {
  return activities.filter((activity) => {
    const owner = kidForActivity(activity);
    return owner === null || owner === kid;
  });
}

/**
 * Every sticker a kid can actually earn on one deck — the single answer to
 * "how deep is this album section", used by the album page, the deck's game
 * menu, el camino and the completion chest alike. They *must* agree: when the
 * album counted the full list while the route counted this one, a learn-only
 * deck showed six slots of which five could never be filled, so its medal
 * never appeared and its chest never opened, while el camino called the same
 * deck finished.
 *
 * A learn-only deck (the verbs shelf) offers flashcards and nothing else — the
 * games build noun-shaped questions ("¿Es un…?") that no action word fits — so
 * its section is one sticker deep. Every other deck can offer all five games:
 * the content tests hold every deck at 10-17 cards, comfortably above what any
 * of them needs to deal a round. Pass `null` for the pack-wide sections (las
 * frases, los cuentos), which carry activity lists of their own.
 */
export function earnableActivities(
  deck: Deck | null | undefined,
  kid: KidId,
): readonly ActivityId[] {
  return deck?.learnOnly === true
    ? ["learn"]
    : activitiesForKid(ALL_ACTIVITIES, kid);
}

/**
 * How many times a kid has finished one activity, as the album records it.
 *
 * **The sticker is the proof it was ever finished; the count only says how
 * deep.** A count with no sticker behind it is orphaned data and reads as zero
 * — the album, the game menu, el camino and the completion chest all ask this
 * one function, so none of them can credit an activity the album cannot show.
 *
 * Reading the count as proof is what let the two halves of the app disagree out
 * loud: a ledger that had run ahead of the sticker list (a swallowed album
 * write on a full quota, an album document salvaged per entry) put a 🥇 on a
 * category whose slots were all still dashed, while home's pips — which only
 * ever counted stickers — said the deck was untouched. Worse, the completion
 * chest measured the same inflated tier and paid stars for it.
 *
 * A slot earned before the tier system exists in the album with no count row,
 * and still reads as the one completion it is.
 */
export function stickerCount(
  kid: KidId,
  deckId: string,
  activity: ActivityId,
  counts: Readonly<Record<string, number>>,
  earned: ReadonlySet<string>,
): number {
  const id = stickerId(kid, deckId, activity);
  return earned.has(id) ? (counts[id] ?? 1) : 0;
}

/** The completion tier of one album section for a kid, from its earnable
 *  slots' counts — each read through `stickerCount`, so a section is never
 *  stronger than the stickers actually in the album. */
export function categoryTierFromAlbum(
  kid: KidId,
  deckId: string,
  activities: readonly ActivityId[],
  counts: Readonly<Record<string, number>>,
  earned: ReadonlySet<string>,
): StickerTier {
  const slots = activitiesForKid(activities, kid).map((activity) =>
    stickerCount(kid, deckId, activity, counts, earned),
  );
  return categoryTier(slots);
}

/** Tiers low→high; `none` = not yet earned. Index doubles as rank. */
const TIER_ORDER: readonly StickerTier[] = ["none", "earned", "silver", "gold"];

export function tierRank(tier: StickerTier): number {
  return TIER_ORDER.indexOf(tier);
}

/** A category is only as strong as its weakest slot: gold when *every*
 *  earnable sticker is gold, `none` while any slot is still empty. */
export function categoryTier(counts: readonly number[]): StickerTier {
  if (counts.length === 0) {
    return "none";
  }
  return counts.reduce<StickerTier>((weakest, count) => {
    const tier = stickerTier(count);
    return tierRank(tier) < tierRank(weakest) ? tier : weakest;
  }, "gold");
}

/** Star chest for finishing a category at each tier — richer the higher it goes. */
export const CATEGORY_BONUS: Record<Exclude<StickerTier, "none">, number> = {
  earned: 15,
  silver: 30,
  gold: 50,
};

export function categoryReward(tier: StickerTier): number {
  return tier === "none" ? 0 : CATEGORY_BONUS[tier];
}

/** The chest to open now: the current tier when it outranks whatever tier was
 *  last claimed, else null. Each tier's chest opens exactly once — reaching
 *  gold straight past an unclaimed silver simply opens the gold chest. */
export function pendingCategoryTier(
  current: StickerTier,
  claimed: StickerTier,
): Exclude<StickerTier, "none"> | null {
  return current !== "none" && tierRank(current) > tierRank(claimed)
    ? current
    : null;
}
