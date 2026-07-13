"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  activitiesForKid,
  ALL_ACTIVITIES,
  categoryTier,
  SENTENCE_ACTIVITIES,
  SENTENCES_ID,
  stickerId,
  stickerTier,
  type ActivityId,
  type Deck,
  type KidId,
  type StickerTier,
} from "@learn-spanish/core";
import { getStickerCounts, getUnlockedDecks } from "@/lib/economy";
import { log } from "@learn-spanish/config";
import { getAlbum } from "@/lib/album";
import { getAvatar, getSelectedKid, setSelectedKid } from "@/lib/kid";
import { deckAccent } from "@/lib/deck-theme";
import { ACTIVITY_META } from "@/lib/activity-theme";
import { TransferPanel } from "@/components/TransferPanel";

interface Props {
  decks: readonly Deck[];
}

export function AlbumView({ decks }: Props) {
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
  const deckActivities = activitiesForKid(ALL_ACTIVITIES, viewKid);
  const sentenceActivities = activitiesForKid(SENTENCE_ACTIVITIES, viewKid);
  const total =
    shownDecks.length * deckActivities.length + sentenceActivities.length;
  const avatar = kid === null ? null : getAvatar(kid);

  function slotCount(deckId: string, activity: ActivityId): number {
    const id = kid === null ? null : stickerId(kid, deckId, activity);
    if (id === null) {
      return 0;
    }
    // A sticker earned before the tier system has no count — treat it as one.
    return counts[id] ?? (earned?.has(id) ? 1 : 0);
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

      <div className="flex flex-col gap-6 pb-6">
        {shownDecks.map((deck) => (
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
              <h2 className="text-2xl font-extrabold">{deck.nameSpanish}</h2>
              {categoryMedal(deck.id, ALL_ACTIVITIES)}
            </div>
            <div className="flex flex-wrap gap-3">
              {deckActivities.map((activity) => slot(deck.id, activity))}
            </div>
          </section>
        ))}

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
