"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  dailyCard,
  KID_GAME_MODES,
  type Deck,
  type DeckGroup,
  type KidId,
  type Streak,
  type VocabularyCard,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { deckAccent } from "@/lib/deck-theme";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { feedStreak, getStreak } from "@/lib/album";
import { getSelectedKid, KID_META, setSelectedKid } from "@/lib/kid";
import { KidPicker } from "@/components/KidPicker";

interface Props {
  decks: readonly Deck[];
  groups: readonly DeckGroup[];
}

export function HomeView({ decks, groups }: Props) {
  // undefined = still reading storage; null = never picked (show the picker).
  const [kid, setKid] = useState<KidId | null | undefined>(undefined);
  const [daily, setDaily] = useState<VocabularyCard | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [dailyWobble, setDailyWobble] = useState(0);

  useEffect(() => {
    warmUpVoices();
    setKid(getSelectedKid());
    // Computed client-side: a build-time "today" would freeze the card.
    setDaily(dailyCard(decks, new Date()));
  }, [decks]);

  useEffect(() => {
    if (!kid) {
      return;
    }
    let cancelled = false;
    getStreak
      .execute(kid)
      .then((s) => {
        if (!cancelled) {
          setStreak(s);
        }
      })
      .catch((err: unknown) => log.error("streak", "failed to load", { err }));
    return () => {
      cancelled = true;
    };
  }, [kid]);

  function pick(id: KidId) {
    setSelectedKid(id);
    setKid(id);
  }

  function hearDaily(card: VocabularyCard) {
    speakSpanish(card.spanish);
    setDailyWobble((k) => k + 1);
    if (kid) {
      feedStreak
        .execute(kid, new Date())
        .then(setStreak)
        .catch((err: unknown) => log.error("streak", "failed to feed", { err }));
    }
  }

  if (kid === undefined) {
    return <main className="min-h-dvh" aria-hidden />;
  }

  if (kid === null) {
    return <KidPicker onPick={pick} />;
  }

  const meta = KID_META[kid];

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-8 p-6">
      <header className="relative w-full text-center">
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl">
          ¡Palabras!
        </h1>
        <p className="mt-1 text-lg font-semibold text-ink/60">
          Tap a sticker to play
        </p>
        <button
          type="button"
          onClick={() => setKid(null)}
          aria-label={`Playing as ${meta.name} (${meta.english}) — tap to switch kids`}
          className="sticker absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          {meta.avatar}
        </button>
        <Link
          href="/album"
          aria-label="Open the sticker album"
          className="sticker absolute right-0 top-0 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          📔
        </Link>
      </header>

      {daily && (
        <button
          type="button"
          key={`daily-${dailyWobble}`}
          onClick={() => hearDaily(daily)}
          aria-label={`Word of the day: ${daily.spanish} (${daily.english})`}
          className={`sticker relative flex w-full max-w-md items-center justify-center gap-4 px-6 py-4 active:translate-x-1 active:translate-y-1 active:shadow-none ${
            dailyWobble > 0 ? "wobble" : "pop-in"
          }`}
        >
          <span aria-hidden className="sticker-peel" />
          <span aria-hidden className="text-5xl">
            {daily.emoji}
          </span>
          <span className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/40">
              La carta del día
            </span>
            <span className="text-3xl font-extrabold">{daily.spanish}</span>
          </span>
          <span aria-hidden className="ml-2 text-2xl">
            🔊
          </span>
          {streak !== null && streak.count > 0 && (
            <span
              aria-label={`${streak.count} day streak`}
              className="absolute -right-3 -top-3 flex items-center gap-1 rounded-full border-4 border-ink bg-[var(--color-lime)] px-3 py-1 text-lg font-extrabold"
            >
              ☀️ {streak.count}
            </span>
          )}
        </button>
      )}

      <div className="grid w-full grid-cols-2 gap-5 sm:gap-6">
        {groups.map((group, i) => {
          const previews = group.deckIds.flatMap((id) => {
            const deck = decks.find((d) => d.id === id);
            return deck ? [deck] : [];
          });
          return (
            <Link
              key={group.id}
              href={`/group/${group.id}`}
              style={{ "--accent": deckAccent(group.id) } as React.CSSProperties}
              className="sticker pop-in relative flex min-h-40 flex-col items-center justify-center gap-1.5 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
            >
              <span aria-hidden className="sticker-peel" />
              <span
                aria-hidden
                className="text-5xl sm:text-6xl"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {group.emoji}
              </span>
              <span className="text-center text-xl font-extrabold sm:text-2xl">
                {group.nameSpanish}
              </span>
              <span className="text-xs font-semibold text-ink/50">
                {group.nameEnglish}
              </span>
              <span aria-hidden className="text-base tracking-wide">
                {previews.map((d) => d.emoji).join(" ")}
              </span>
            </Link>
          );
        })}

        <Link
          href={kid ? `/frases/${KID_GAME_MODES[kid].quiz}` : "/frases"}
          aria-label="Las frases — sentences"
          style={{ "--accent": deckAccent("frases") } as React.CSSProperties}
          className="sticker pop-in relative flex min-h-40 flex-col items-center justify-center gap-1.5 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
        >
          <span aria-hidden className="sticker-peel" />
          <span aria-hidden className="text-5xl sm:text-6xl">
            💬
          </span>
          <span className="text-center text-xl font-extrabold sm:text-2xl">
            Las frases
          </span>
          <span className="text-xs font-semibold text-ink/50">Sentences</span>
        </Link>
      </div>
    </main>
  );
}
