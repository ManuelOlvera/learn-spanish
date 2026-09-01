"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  activitiesForKid,
  buildCamino,
  categoryTier,
  earnableActivities,
  groupsInTrailOrder,
  SENTENCE_ACTIVITIES,
  SENTENCES_ID,
  STORIES_ID,
  STORY_ACTIVITIES,
  stickerCount,
  stickerId,
  stickerTier,
  type ActivityId,
  type Deck,
  type DeckGroup,
  type KidId,
  type StickerTier,
} from "@learn-spanish/core";
import { getStickerCounts, getUnlockedDecks } from "@/lib/economy";
import { log } from "@learn-spanish/config";
import { getAlbum } from "@/lib/client-container";
import { getAvatar, getSelectedKid, setSelectedKid } from "@/lib/kid";
import { deckAccent } from "@/lib/deck-theme";
import { ACTIVITY_META } from "@/lib/activity-theme";
import { TransferPanel } from "@/components/TransferPanel";

interface Props {
  decks: readonly Deck[];
  /** The home-screen shelves, so the album can be read in the same shape home
   *  is. Without them this page was a flat run of 50-odd deck sections with no
   *  sign of which category each belonged to — which is how a deck called
   *  "La comida" came to be read as the shelf of the same name. */
  groups: readonly DeckGroup[];
}

export function AlbumView({ decks, groups }: Props) {
  const [kid, setKid] = useState<KidId | null>(null);
  // Earned stickers live in browser storage — load after mount.
  const [earned, setEarned] = useState<ReadonlySet<string> | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [counts, setCounts] = useState<Readonly<Record<string, number>>>({});
  const [unlocked, setUnlocked] = useState<readonly string[]>([]);

  useEffect(() => {
    const current = getSelectedKid() ?? "listener";
    setKid(current);
    setCounts(getStickerCounts());
    setUnlocked(getUnlockedDecks(current));
  }, [reloadNonce]);

  // Secret decks appear as album sections only once that kid has unlocked them.
  const shownDecks = decks.filter((d) => !d.secret || unlocked.includes(d.id));

  useEffect(() => {
    if (kid === null) {
      return;
    }
    let cancelled = false;
    getAlbum
      .execute(kid)
      .then((ids) => {
        if (!cancelled) {
          setEarned(new Set(ids));
        }
      })
      .catch((err: unknown) => {
        log.error("album", "failed to load album", { err });
        if (!cancelled) {
          setEarned(new Set());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [kid, reloadNonce]);

  function switchKid() {
    if (kid === null) {
      return;
    }
    const other: KidId = kid === "listener" ? "reader" : "listener";
    setSelectedKid(other);
    setEarned(null);
    setKid(other);
  }

  // Only the games this kid can actually reach count toward — and appear in —
  // their album, so a pre-reader's category can hit 100% (a reader never sees
  // the same slots). `kid` is briefly null before mount; default the layout to
  // the pre-reader's set, which re-renders once storage is read.
  const viewKid: KidId = kid ?? "listener";
  // Per deck, never one list for all of them: a learn-only deck (the verbs
  // shelf) is one sticker deep, and drawing it with the full six put five
  // slots on the page that nothing could ever fill — no medal, no chest, and
  // a denominator the kid could not reach. Same function el camino counts by.
  const sentenceActivities = activitiesForKid(SENTENCE_ACTIVITIES, viewKid);
  const storyActivities = activitiesForKid(STORY_ACTIVITIES, viewKid);
  const total =
    shownDecks.reduce(
      (sum, deck) => sum + earnableActivities(deck, viewKid).length,
      0,
    ) +
    sentenceActivities.length +
    storyActivities.length;
  const avatar = kid === null ? null : getAvatar(kid);

  // Each shelf's standing, from `buildCamino` — the very call home makes for
  // its pips, so the count printed beside a shelf here and the dots on its
  // home tile cannot disagree. Null until the album has been read.
  const orderedGroups = groupsInTrailOrder(groups);
  const camino =
    earned === null
      ? null
      : buildCamino(orderedGroups, decks, viewKid, [...earned], counts);

  // How deep this kid has gone on one slot. The domain owns the rule (a count
  // with no sticker behind it is orphaned and reads as zero), so this page's
  // medals can never outrank the slots drawn right beneath them.
  function slotCount(deckId: string, activity: ActivityId): number {
    return kid === null
      ? 0
      : stickerCount(kid, deckId, activity, counts, earned ?? new Set());
  }

  const MEDAL: Record<StickerTier, string> = {
    none: "",
    earned: "🥉",
    silver: "🥈",
    gold: "🥇",
  };

  function categoryMedal(deckId: string, activities: readonly ActivityId[]) {
    const tier = categoryTier(
      activitiesForKid(activities, viewKid).map((a) => slotCount(deckId, a)),
    );
    if (tier === "none") {
      return null;
    }
    return (
      <span
        aria-label={`Category complete: ${tier}`}
        className="pop-in ml-auto text-3xl"
      >
        {MEDAL[tier]}
      </span>
    );
  }

  function slot(deckId: string, activity: ActivityId) {
    const activityMeta = ACTIVITY_META[activity];
    const id = kid === null ? null : stickerId(kid, deckId, activity);
    const has = id !== null && (earned?.has(id) ?? false);
    const tier = id === null ? "none" : stickerTier(slotCount(deckId, activity));
    return (
      <span
        key={activity}
        aria-label={`${activityMeta.english}: ${has ? tier : "not yet earned"}`}
        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-4 text-2xl ${
          has
            ? "pop-in border-ink bg-[var(--accent)]"
            : "border-dashed border-ink/25 opacity-40"
        }`}
        style={
          tier === "gold"
            ? { backgroundColor: "#fde68a" }
            : tier === "silver"
              ? { backgroundColor: "#e5e7eb" }
              : undefined
        }
      >
        <span aria-hidden>
          {activityMeta.game}
          {activityMeta.mode && (
            <span className="text-base">{activityMeta.mode}</span>
          )}
        </span>
        {(tier === "silver" || tier === "gold") && (
          <span aria-hidden className="absolute -right-2 -top-2 text-lg">
            {tier === "gold" ? "🥇" : "🥈"}
          </span>
        )}
      </span>
    );
  }

  /** One deck's album section: its slots and, once every one is filled, its
   *  medal. Rendered under the shelf the deck belongs to. */
  function deckSection(deck: Deck) {
    return (
      <section
        key={deck.id}
        style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
        className="sticker relative flex flex-col gap-3 p-5"
      >
        <span aria-hidden className="sticker-peel" />
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-4xl">
            {deck.emoji}
          </span>
          <h3 className="text-2xl font-extrabold">{deck.nameSpanish}</h3>
          {categoryMedal(deck.id, earnableActivities(deck, viewKid))}
        </div>
        <div className="flex flex-wrap gap-3">
          {earnableActivities(deck, viewKid).map((activity) =>
            slot(deck.id, activity),
          )}
        </div>
      </section>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back to all decks"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        {avatar && (
          <button
            type="button"
            onClick={switchKid}
            aria-label={`Showing ${avatar}'s album — tap for the other kid`}
            className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {avatar}
          </button>
        )}
      </header>

      <div className="text-center">
        <h1 className="text-5xl font-extrabold sm:text-6xl">
          {avatar ? `El álbum de ${avatar}` : "Mi álbum"}
        </h1>
        <p className="mt-1 text-lg font-semibold text-ink/60">
          {earned === null ? "…" : `${earned.size} / ${total}`}
        </p>
      </div>

      <div className="flex flex-col gap-8 pb-6">
        {/* Under its shelf, in the shelf order home uses. A deck section and
            the category it lives on are now visibly different things — the
            report that started this was a deck and a shelf sharing a name. */}
        {orderedGroups.map((group) => {
          const shelfDecks = group.deckIds.flatMap((id) => {
            const deck = shownDecks.find((d) => d.id === id);
            return deck === undefined ? [] : [deck];
          });
          if (shelfDecks.length === 0) {
            return null;
          }
          const shelf = camino?.shelves.find((s) => s.groupId === group.id);
          return (
            <section key={group.id} className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 px-1 text-xl font-extrabold text-ink/70">
                <span aria-hidden className="text-2xl">
                  {group.emoji}
                </span>
                {group.nameSpanish}
                {shelf !== undefined && (
                  <span
                    aria-label={`${shelf.doneSteps} de ${shelf.steps.length} mazos terminados`}
                    className="ml-auto rounded-full border-2 border-ink bg-white px-2 py-0.5 text-sm font-extrabold"
                  >
                    <span aria-hidden>
                      {shelf.doneSteps}/{shelf.steps.length}
                    </span>
                  </span>
                )}
              </h2>
              {shelfDecks.map((deck) => deckSection(deck))}
            </section>
          );
        })}

        {/* Secret decks sit on no shelf (they are bought, not walked to), so
            they follow the shelves rather than vanishing from the album. */}
        {(() => {
          const shelved = new Set(groups.flatMap((g) => g.deckIds));
          const loose = shownDecks.filter((d) => !shelved.has(d.id));
          return loose.length === 0 ? null : (
            <section className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 px-1 text-xl font-extrabold text-ink/70">
                <span aria-hidden className="text-2xl">
                  🔮
                </span>
                Los secretos
              </h2>
              {loose.map((deck) => deckSection(deck))}
            </section>
          );
        })()}

        <section
          style={{ "--accent": deckAccent(SENTENCES_ID) } as React.CSSProperties}
          className="sticker relative flex flex-col gap-3 p-5"
        >
          <span aria-hidden className="sticker-peel" />
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-4xl">
              💬
            </span>
            <h2 className="text-2xl font-extrabold">Las frases</h2>
            {categoryMedal(SENTENCES_ID, SENTENCE_ACTIVITIES)}
          </div>
          <div className="flex flex-wrap gap-3">
            {sentenceActivities.map((activity) => slot(SENTENCES_ID, activity))}
          </div>
        </section>

        <section
          style={{ "--accent": deckAccent(STORIES_ID) } as React.CSSProperties}
          className="sticker relative flex flex-col gap-3 p-5"
        >
          <span aria-hidden className="sticker-peel" />
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-4xl">
              📚
            </span>
            <h2 className="text-2xl font-extrabold">Los cuentos</h2>
            {categoryMedal(STORIES_ID, STORY_ACTIVITIES)}
          </div>
          <div className="flex flex-wrap gap-3">
            {storyActivities.map((activity) => slot(STORIES_ID, activity))}
          </div>
        </section>
      </div>

      <TransferPanel
        onImported={() => {
          setEarned(null);
          setReloadNonce((n) => n + 1);
        }}
      />
    </main>
  );
}
