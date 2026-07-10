"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ALL_ACTIVITIES,
  SENTENCE_ACTIVITIES,
  SENTENCES_ID,
  stickerId,
  type ActivityId,
  type Deck,
  type KidId,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { getAlbum } from "@/lib/album";
import { getSelectedKid, KID_META, setSelectedKid } from "@/lib/kid";
import { deckAccent } from "@/lib/deck-theme";
import { ACTIVITY_META } from "@/lib/activity-theme";

interface Props {
  decks: readonly Deck[];
}

export function AlbumView({ decks }: Props) {
  const [kid, setKid] = useState<KidId | null>(null);
  // Earned stickers live in browser storage — load after mount.
  const [earned, setEarned] = useState<ReadonlySet<string> | null>(null);

  useEffect(() => {
    setKid(getSelectedKid() ?? "listener");
  }, []);

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
  }, [kid]);

  function switchKid() {
    if (kid === null) {
      return;
    }
    const other: KidId = kid === "listener" ? "reader" : "listener";
    setSelectedKid(other);
    setEarned(null);
    setKid(other);
  }

  const total =
    decks.length * ALL_ACTIVITIES.length + SENTENCE_ACTIVITIES.length;
  const meta = kid === null ? null : KID_META[kid];

  function slot(deckId: string, activity: ActivityId) {
    const activityMeta = ACTIVITY_META[activity];
    const has =
      kid !== null && (earned?.has(stickerId(kid, deckId, activity)) ?? false);
    return (
      <span
        key={activity}
        aria-label={`${activityMeta.english}: ${has ? "earned" : "not yet earned"}`}
        className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 text-2xl ${
          has
            ? "pop-in border-ink bg-[var(--accent)]"
            : "border-dashed border-ink/25 opacity-40"
        }`}
      >
        <span aria-hidden>
          {activityMeta.game}
          {activityMeta.mode && (
            <span className="text-base">{activityMeta.mode}</span>
          )}
        </span>
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
        {meta && (
          <button
            type="button"
            onClick={switchKid}
            aria-label={`Showing ${meta.name}'s album — tap for the other kid`}
            className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {meta.avatar}
          </button>
        )}
      </header>

      <div className="text-center">
        <h1 className="text-5xl font-extrabold sm:text-6xl">
          {meta ? `El álbum de ${meta.name}` : "Mi álbum"}
        </h1>
        <p className="mt-1 text-lg font-semibold text-ink/60">
          {earned === null ? "…" : `${earned.size} / ${total}`}
        </p>
      </div>

      <div className="flex flex-col gap-6 pb-6">
        {decks.map((deck) => (
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
            </div>
            <div className="flex flex-wrap gap-3">
              {ALL_ACTIVITIES.map((activity) => slot(deck.id, activity))}
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
          </div>
          <div className="flex flex-wrap gap-3">
            {SENTENCE_ACTIVITIES.map((activity) => slot(SENTENCES_ID, activity))}
          </div>
        </section>
      </div>
    </main>
  );
}
