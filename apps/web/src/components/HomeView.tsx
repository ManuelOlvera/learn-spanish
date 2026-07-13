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
import { syncPull } from "@/lib/sync";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { feedStreak, getStreak, getWordStats } from "@/lib/album";
import {
  buyFreeze,
  claimMissionBonus,
  getActivePet,
  getMission,
  getPetCollection,
  getStars,
  getUnlockedDecks,
  rolloverWeekly,
  unlockDeck,
  type MissionView,
  type WeeklyView,
} from "@/lib/economy";
import {
  ACTIVE_WEEK_DAYS,
  anyPetHungry,
  dayKey,
  FREEZE_COST,
  MISSION_BONUS,
  petFormEmoji,
  petMaxForm,
} from "@learn-spanish/core";
import { WeeklyBurst } from "@/components/WeeklyBurst";
import { feedbackRacha, feedbackWrong } from "@/lib/feedback";
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
  const [petFace, setPetFace] = useState("🥚");
  const [petHungry, setPetHungry] = useState(false);
  const [unlockedDecks, setUnlockedDecks] = useState<readonly string[]>([]);
  const [weekly, setWeekly] = useState<WeeklyView | null>(null);
  const [burst, setBurst] = useState<WeeklyView["outcome"] | null>(null);
  const [nope, setNope] = useState(0);
  // Bumped when a cross-device pull applies changes, to re-read home state.
  const [syncNonce, setSyncNonce] = useState(0);

  // Secret decks stay out of the daily card, review, and shelves until bought.
  const publicDecks = decks.filter((d) => !d.secret);
  const secretDecks = decks.filter((d) => d.secret);

  useEffect(() => {
    warmUpVoices();
    setKid(getSelectedKid());
    // Computed client-side: a build-time "today" would freeze the card.
    setDaily(dailyCard(publicDecks, new Date()));
  }, [decks]);

  // Cross-device sync (ADR 004): pull the latest on app open, then re-read
  // home state if anything merged in. No-op when unpaired; never blocks render.
  useEffect(() => {
    let cancelled = false;
    void syncPull().then((applied) => {
      if (applied && !cancelled) {
        setSyncNonce((n) => n + 1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
            pickReviewCards(publicDecks.flatMap((d) => d.cards), stats, 99).length,
          );
        }
      })
      .catch((err: unknown) =>
        log.error("word-stats", "failed to load", { err }),
      );
    setMission(getMission(kid));
    setStars(getStars(kid));
    const collection = getPetCollection(kid);
    const activePet = getActivePet(kid);
    const activeMaxForm = petMaxForm(collection.active, activePet.meals);
    setPetFace(
      petFormEmoji(collection.active, Math.min(activePet.form ?? Infinity, activeMaxForm)),
    );
    setPetHungry(anyPetHungry(collection, dayKey(new Date())));
    setUnlockedDecks(getUnlockedDecks(kid));
    const week = rolloverWeekly(kid);
    setWeekly(week);
    if (week.outcome !== "none") {
      setBurst(week.outcome);
    }
    return () => {
      cancelled = true;
    };
  }, [kid, decks, syncNonce]);

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
      {burst !== null && burst !== "none" && (
        <WeeklyBurst
          outcome={burst}
          count={weekly?.count ?? 0}
          onDone={() => setBurst(null)}
        />
      )}
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

      {weekly !== null && (
        <div
          className="sticker relative flex w-full max-w-md items-center justify-between gap-3 px-5 py-3"
          aria-label={`Weekly streak: ${weekly.count} weeks, ${weekly.activeDays} of ${ACTIVE_WEEK_DAYS} days this week, ${weekly.freezes} freezes`}
        >
          <span aria-hidden className="sticker-peel" />
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-3xl">
              🔥
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-extrabold">
                Semana {weekly.count}
              </span>
              <span aria-hidden className="mt-1 flex gap-1">
                {Array.from({ length: ACTIVE_WEEK_DAYS }, (_, i) => (
                  <span
                    key={i}
                    className={`h-3 w-3 rounded-full border-2 border-ink ${
                      i < weekly.activeDays ? "bg-[var(--color-lime)]" : "bg-white"
                    }`}
                  />
                ))}
              </span>
            </span>
          </span>
          <button
            type="button"
            key={`freeze-${nope}`}
            onClick={() => {
              if (!kid) return;
              const res = buyFreeze(kid);
              if (res === null) {
                feedbackWrong();
                setNope((n) => n + 1);
                return;
              }
              feedbackRacha();
              setStars(res.stars);
              setWeekly((w) => (w ? { ...w, freezes: res.freezes } : w));
            }}
            aria-label={`Buy a freeze for ${FREEZE_COST} stars — you have ${weekly.freezes}`}
            className={`sticker flex items-center gap-1 px-3 py-2 text-lg font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none ${
              stars < FREEZE_COST ? "wobble" : ""
            }`}
            style={{ "--accent": "#7dd3fc" } as React.CSSProperties}
          >
            <span aria-hidden className="text-2xl">
              ❄️
            </span>
            <span>{weekly.freezes}</span>
            <span
              aria-hidden
              className="ml-1 rounded-full border-2 border-ink bg-white px-2 text-sm"
            >
              +{FREEZE_COST}⭐
            </span>
          </button>
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
          aria-label={
            petHungry
              ? `La mascota is hungry — feed it with your ${stars} stars`
              : `La mascota — feed it with your ${stars} stars`
          }
          style={{ "--accent": "#fbbf24" } as React.CSSProperties}
          className="sticker pop-in relative flex min-h-40 flex-col items-center justify-center gap-1.5 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
        >
          <span aria-hidden className="sticker-peel" />
          {petHungry && (
            <span
              aria-hidden
              className="chest-tease absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-ink bg-white text-2xl"
            >
              🥺
            </span>
          )}
          <span aria-hidden className="text-5xl sm:text-6xl">
            {petFace}
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

        {secretDecks.map((deck) => {
          const unlocked = unlockedDecks.includes(deck.id);
          const cost = deck.unlockCost ?? 0;
          if (unlocked) {
            return (
              <Link
                key={deck.id}
                href={`/deck/${deck.id}`}
                aria-label={`${deck.nameEnglish} — unlocked`}
                style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
                className="sticker pop-in relative flex min-h-40 flex-col items-center justify-center gap-1.5 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
              >
                <span aria-hidden className="sticker-peel" />
                <span aria-hidden className="text-5xl sm:text-6xl">
                  {deck.emoji}
                </span>
                <span className="text-center text-xl font-extrabold sm:text-2xl">
                  {deck.nameSpanish}
                </span>
                <span className="text-xs font-semibold text-ink/50">
                  {deck.nameEnglish}
                </span>
              </Link>
            );
          }
          return (
            <button
              type="button"
              key={`${deck.id}-${nope}`}
              onClick={() => {
                if (!kid) return;
                const balance = unlockDeck(kid, deck.id, cost);
                if (balance === null) {
                  feedbackWrong();
                  setNope((n) => n + 1);
                  return;
                }
                feedbackRacha();
                setStars(balance);
                setUnlockedDecks([...unlockedDecks, deck.id]);
              }}
              aria-label={`Unlock the mystery deck for ${cost} stars`}
              style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
              className={`sticker pop-in relative flex min-h-40 flex-col items-center justify-center gap-1.5 p-4 active:translate-x-1 active:translate-y-1 active:shadow-none ${
                stars < cost ? "wobble" : ""
              }`}
            >
              <span aria-hidden className="sticker-peel" />
              <span aria-hidden className="text-5xl opacity-70 sm:text-6xl">
                🔮
              </span>
              <span className="text-center text-xl font-extrabold sm:text-2xl">
                ??? 🔒
              </span>
              <span
                aria-hidden
                className="rounded-full border-2 border-ink bg-white px-3 text-base font-extrabold"
              >
                {cost}⭐
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
