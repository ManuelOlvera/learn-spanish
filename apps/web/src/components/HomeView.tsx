"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  dailyCard,
  KID_GAME_MODES,
  pickReviewCards,
  REVIEW_MIN,
  type Deck,
  type DeckGroup,
  type KidId,
  type Streak,
  type VocabularyCard,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { deckAccent } from "@/lib/deck-theme";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { feedStreak, getStreak, getWordStats } from "@/lib/album";
import {
  claimMissionBonus,
  getMission,
  getPet,
  getStars,
  type MissionView,
} from "@/lib/economy";
import { petStage, MISSION_BONUS, type PetState } from "@learn-spanish/core";
import { feedbackRacha } from "@/lib/feedback";
import { getAvatar, getSelectedKid, KID_META, setSelectedKid } from "@/lib/kid";
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
  const [weakCount, setWeakCount] = useState(0);
  const [dailyWobble, setDailyWobble] = useState(0);
  const [mission, setMission] = useState<MissionView | null>(null);
  const [stars, setStars] = useState(0);
  const [pet, setPet] = useState<PetState | null>(null);

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
    getWordStats
      .execute(kid)
      .then((stats) => {
        if (!cancelled) {
          setWeakCount(
            pickReviewCards(decks.flatMap((d) => d.cards), stats, 99).length,
          );
        }
      })
      .catch((err: unknown) =>
        log.error("word-stats", "failed to load", { err }),
      );
    setMission(getMission(kid));
    setStars(getStars(kid));
    setPet(getPet(kid));
    return () => {
      cancelled = true;
    };
  }, [kid, decks]);

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
  const avatar = getAvatar(kid);

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
          aria-label={`Playing as ${avatar} (${meta.english}) — tap to switch kids`}
          className="sticker absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          {avatar}
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

      {mission !== null && (
        <div
          className="sticker relative flex w-full max-w-md items-center justify-between gap-3 px-5 py-3"
          aria-label="Today's mission"
        >
          <span aria-hidden className="sticker-peel" />
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-3xl">
              🎯
            </span>
            <span className="text-lg font-extrabold">La misión</span>
          </span>
          <span className="flex items-center gap-2">
            {mission.kinds.map((kind) => {
              const done = mission.state.done.includes(kind);
              const KIND_EMOJI: Record<string, string> = {
                learn: "📖", quiz: "🔍", "si-no": "✅", match: "🧩",
                connect: "🔗", scene: "👀", frases: "💬", duel: "⚔️",
              };
              return (
                <span
                  key={kind}
                  aria-label={`${kind}: ${done ? "done" : "to do"}`}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border-4 text-2xl ${
                    done ? "border-ink bg-[var(--color-lime)]" : "border-dashed border-ink/30"
                  }`}
                >
                  <span aria-hidden>{KIND_EMOJI[kind]}</span>
                </span>
              );
            })}
            {mission.complete && !mission.state.claimed ? (
              <button
                type="button"
                onClick={() => {
                  const balance = kid ? claimMissionBonus(kid) : null;
                  if (balance !== null) {
                    feedbackRacha();
                    setStars(balance);
                    setMission(kid ? getMission(kid) : null);
                  }
                }}
                aria-label={`Open the mission chest (+${MISSION_BONUS} stars)`}
                className="sticker chest-tease flex h-14 w-14 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🎁
              </button>
            ) : mission.state.claimed ? (
              <span aria-label="Mission bonus claimed" className="text-3xl">
                🏆
              </span>
            ) : null}
          </span>
        </div>
      )}

      {weakCount >= REVIEW_MIN && (
        <Link
          href="/repaso"
          aria-label={`Review ${weakCount} tricky words`}
          className="sticker pop-in relative flex items-center gap-3 px-6 py-2 active:translate-x-1 active:translate-y-1 active:shadow-none"
          style={{ "--accent": "var(--color-lime-deep)" } as React.CSSProperties}
        >
          <span aria-hidden className="text-3xl">
            🔁
          </span>
          <span className="text-xl font-extrabold">El repaso</span>
          <span
            aria-hidden
            className="rounded-full border-2 border-ink bg-[var(--color-lime)] px-2 text-sm font-extrabold"
          >
            {weakCount}
          </span>
        </Link>
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
          href="/mascota"
          aria-label={`La mascota — feed it with your ${stars} stars`}
          style={{ "--accent": "#fbbf24" } as React.CSSProperties}
          className="sticker pop-in relative flex min-h-40 flex-col items-center justify-center gap-1.5 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
        >
          <span aria-hidden className="sticker-peel" />
          <span aria-hidden className="text-5xl sm:text-6xl">
            {["🥚", "🐣", "🐥", "🐓"][petStage(pet?.meals ?? 0)]}
          </span>
          <span className="text-center text-xl font-extrabold sm:text-2xl">
            La mascota
          </span>
          <span
            aria-hidden
            className="rounded-full border-2 border-ink bg-white px-3 text-base font-extrabold"
          >
            ⭐ {stars}
          </span>
        </Link>

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
