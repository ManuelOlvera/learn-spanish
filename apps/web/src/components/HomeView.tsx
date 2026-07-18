"use client";

import { useEffect, useMemo, useState } from "react";
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
import { syncPull, syncPush } from "@/lib/sync";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { feedStreak, getStreak, getWordStats } from "@/lib/client-container";
import {
  buyFreeze,
  canClaimDailyGift,
  claimDailyGift,
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
  anyPetHungry,
  dayKey,
  MISSION_BONUS,
  petFormEmoji,
  petMaxForm,
} from "@learn-spanish/core";
import type { DailyGift } from "@learn-spanish/core";
import { WeeklyBurst } from "@/components/WeeklyBurst";
import { MissionBurst } from "@/components/MissionBurst";
import { GiftReveal } from "@/components/GiftReveal";
import { MissionCard } from "@/components/MissionCard";
import { WeeklyCard } from "@/components/WeeklyCard";
import { SecretDeckTile } from "@/components/SecretDeckTile";
import { feedbackFanfare, feedbackRacha } from "@/lib/feedback";
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
  // True while the daily-mission trophy celebration is on screen.
  const [missionBurst, setMissionBurst] = useState(false);
  // El regalo del día: whether today's free gift is waiting, and the drawn
  // gift while its reveal is on screen.
  const [giftReady, setGiftReady] = useState(false);
  const [giftReveal, setGiftReveal] = useState<DailyGift | null>(null);
  // Bumped when a cross-device pull applies changes, to re-read home state.
  const [syncNonce, setSyncNonce] = useState(0);

  // Secret decks stay out of the daily card, review, and shelves until bought.
  // Memoized so the effects below can depend on them without re-running every
  // render (the filter would otherwise mint a fresh array identity each time).
  const publicDecks = useMemo(() => decks.filter((d) => !d.secret), [decks]);
  const secretDecks = useMemo(() => decks.filter((d) => d.secret), [decks]);

  useEffect(() => {
    warmUpVoices();
    setKid(getSelectedKid());
    // Computed client-side: a build-time "today" would freeze the card.
    setDaily(dailyCard(publicDecks, new Date()));
  }, [publicDecks]);

  // Cross-device sync (ADR 004): pull the latest on app open — and again each
  // time the tab becomes visible, so a tablet left open all afternoon still
  // picks up the phone's progress. No-op when unpaired; never blocks render.
  useEffect(() => {
    let cancelled = false;
    const pull = () => {
      void syncPull().then((applied) => {
        if (applied && !cancelled) {
          setSyncNonce((n) => n + 1);
        }
      });
    };
    pull();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pull();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
    setGiftReady(canClaimDailyGift(kid));
    const week = rolloverWeekly(kid);
    setWeekly(week);
    if (week.outcome !== "none") {
      setBurst(week.outcome);
    }
    return () => {
      cancelled = true;
    };
  }, [kid, publicDecks, syncNonce]);

  function pick(id: KidId) {
    setSelectedKid(id);
    setKid(id);
  }

  /** Open the misión chest: bank the bonus, celebrate, and push the claimed
   *  flag so the other device sees it done (no re-claim). */
  function claimBonus() {
    const balance = kid ? claimMissionBonus(kid) : null;
    if (balance !== null) {
      feedbackFanfare();
      setStars(balance);
      setMission(kid ? getMission(kid) : null);
      setMissionBurst(true);
      void syncPush();
    }
  }

  /** Open today's free gift: draw, bank the reward, reveal it. A no-op (just
   *  hides the present) if it was somehow already claimed today. */
  function openGift() {
    if (!kid) {
      return;
    }
    setGiftReady(false);
    const res = claimDailyGift(kid);
    if (res === null) {
      return;
    }
    feedbackRacha();
    setStars(res.stars);
    if (res.gift.type === "freeze") {
      setWeekly((w) => (w ? { ...w, freezes: w.freezes + 1 } : w));
    }
    setGiftReveal(res.gift);
    // The stars/❄️ are banked into the synced wallet/freeze fields — push so
    // the other device sees them (the claim day itself stays per-device).
    void syncPush();
  }

  /** Try to buy a ❄️; false lets the WeeklyCard play its denied wobble. */
  function handleBuyFreeze(): boolean {
    if (!kid) {
      return false;
    }
    const res = buyFreeze(kid);
    if (res === null) {
      return false;
    }
    feedbackRacha();
    setStars(res.stars);
    setWeekly((w) => (w ? { ...w, freezes: res.freezes } : w));
    void syncPush();
    return true;
  }

  /** Try to unlock a secret deck; false lets the tile play its denied wobble. */
  function handleUnlock(deckId: string, cost: number): boolean {
    if (!kid) {
      return false;
    }
    const balance = unlockDeck(kid, deckId, cost);
    if (balance === null) {
      return false;
    }
    feedbackRacha();
    setStars(balance);
    setUnlockedDecks((prev) => [...prev, deckId]);
    void syncPush();
    return true;
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
      {missionBurst && (
        <MissionBurst
          bonus={MISSION_BONUS}
          onDone={() => setMissionBurst(false)}
        />
      )}
      {giftReveal !== null && (
        <GiftReveal gift={giftReveal} onDone={() => setGiftReveal(null)} />
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

      {giftReady && (
        <button
          type="button"
          onClick={openGift}
          aria-label="El regalo del día — open today's free gift"
          className="sticker chest-tease relative flex items-center gap-3 px-6 py-3 text-xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
          style={{ "--accent": "var(--color-lime)" } as React.CSSProperties}
        >
          <span aria-hidden className="text-4xl">
            🎁
          </span>
          El regalo del día
        </button>
      )}

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

      {mission !== null && <MissionCard mission={mission} onClaim={claimBonus} />}

      {weekly !== null && (
        <WeeklyCard weekly={weekly} stars={stars} onBuyFreeze={handleBuyFreeze} />
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

        {secretDecks.map((deck) => (
          <SecretDeckTile
            key={deck.id}
            deck={deck}
            unlocked={unlockedDecks.includes(deck.id)}
            stars={stars}
            onUnlock={() => handleUnlock(deck.id, deck.unlockCost ?? 0)}
          />
        ))}
      </div>
    </main>
  );
}
