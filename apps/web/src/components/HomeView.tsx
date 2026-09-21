"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  dailyFeature,
  gameModesFor,
  levelFor,
  dayIndex,
  challengeClaimable,
  missionOnHome,
  pickHomeFocus,
  reviewCount,
  REVIEW_MIN,
  type Deck,
  type DeckGroup,
  type KidId,
  type ParentChallenge,
  type Streak,
  type DailyFeature,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { deckAccent } from "@/lib/deck-theme";
import { syncPull, syncPush } from "@/lib/sync";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { feedStreak, getStreak, getWordStats } from "@/lib/client-container";
import {
  canClaimDailyGift,
  claimDailyGift,
  claimChallengeBonus,
  claimMissionBonus,
  getChallenge,
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
import { BoostBadge } from "@/components/BoostBadge";
import { MissionCard } from "@/components/MissionCard";
import { ChallengeCard } from "@/components/ChallengeCard";
import { SecretDeckTile } from "@/components/SecretDeckTile";
import { feedbackFanfare, feedbackRacha } from "@/lib/feedback";
import { getAvatar, getSelectedKid, KID_META, setSelectedKid } from "@/lib/kid";
import { KidPicker } from "@/components/KidPicker";
import { CaminoMap } from "@/components/CaminoMap";
import { useCamino } from "@/lib/use-camino";
import { useKidLevels } from "@/lib/use-kid-levels";

interface Props {
  decks: readonly Deck[];
  groups: readonly DeckGroup[];
}

export function HomeView({ decks, groups }: Props) {
  // undefined = still reading storage; null = never picked (show the picker).
  const [kid, setKid] = useState<KidId | null | undefined>(undefined);
  const [daily, setDaily] = useState<DailyFeature | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [weakCount, setWeakCount] = useState(0);
  const [dailyWobble, setDailyWobble] = useState(0);
  const [mission, setMission] = useState<MissionView | null>(null);
  // El reto de papá, set from /informe on this device.
  const [challenge, setChallenge] = useState<ParentChallenge | null>(null);
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
  // Bumped when today's gift may have opened a ⚡ window, so the badge re-reads
  // without waiting for its own tick.
  const [boostNonce, setBoostNonce] = useState(0);
  // Bumped when a cross-device pull applies changes, to re-read home state.
  const [syncNonce, setSyncNonce] = useState(0);

  // Secret decks stay out of the daily card, review, and shelves until bought.
  // Memoized so the effects below can depend on them without re-running every
  // render (the filter would otherwise mint a fresh array identity each time).
  const publicDecks = useMemo(() => decks.filter((d) => !d.secret), [decks]);
  const secretDecks = useMemo(() => decks.filter((d) => d.secret), [decks]);

  // El camino: how far this kid has come along the route, and the one shelf
  // that is next. Derived from the album, so it costs no new storage.
  const camino = useCamino(groups, publicDecks, kid, syncNonce);
  // Games play at the profile's *level*, which a grown-up can change.
  const levels = useKidLevels(syncNonce);
  const modes = gameModesFor(levelFor(kid ?? "listener", levels));

  // The one thing home says today. A domain rule, not a pile of && in JSX —
  // see domain/home-focus.ts for why claims outrank suggestions.
  const focus = pickHomeFocus({
    giftReady,
    challengePending: challenge !== null && !challenge.done,
    challengeClaimable: challengeClaimable(challenge),
    repasoReady: weakCount >= REVIEW_MIN,
  });

  useEffect(() => {
    warmUpVoices();
    setKid(getSelectedKid());
  }, [publicDecks]);

  // The carta del día is per level now (roadmap 10): the listener gets the
  // word, the reader a sentence about it. Computed client-side — a build-time
  // "today" would freeze the card — and re-run when the kid changes, so
  // switching avatars swaps the card rather than leaving the other kid's.
  // An unpicked kid sees the listener's word, which is what home showed
  // before there was a level to ask about.
  useEffect(() => {
    setDaily(dailyFeature(publicDecks, new Date(), kid ?? "listener"));
  }, [publicDecks, kid]);

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
          // What a repaso session would actually offer: the missed words
          // and the ones going quiet (domain/review.ts).
          setWeakCount(
            reviewCount(
              publicDecks.flatMap((d) => d.cards),
              stats,
              dayIndex(new Date()),
            ),
          );
        }
      })
      .catch((err: unknown) =>
        log.error("word-stats", "failed to load", { err }),
      );
    setMission(getMission(kid));
    setChallenge(getChallenge(kid));
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

  /** Bank the challenge bonus and clear the card. */
  function claimChallengeReward() {
    if (!kid) {
      return;
    }
    const balance = claimChallengeBonus(kid);
    if (balance !== null) {
      feedbackFanfare();
      setStars(balance);
      setChallenge(getChallenge(kid));
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
    if (res.gift.type === "boost") {
      setBoostNonce((n) => n + 1);
    }
    setGiftReveal(res.gift);
    // The stars/❄️ are banked into the synced wallet/freeze fields — push so
    // the other device sees them (the claim day itself stays per-device).
    void syncPush();
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

  function hearDaily(feature: DailyFeature) {
    speakSpanish(feature.text);
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
      {/* A real three-column row rather than a title with buttons absolutely
          placed on top of it: with a third button (la mascota) the old layout
          put the egg straight through "¡Palabras!" at phone width. */}
      {/* Sticky since the map moved in: home is now a long scroll, and a
          header pinned to the top of the document puts la mascota and the
          album out of reach the moment a kid starts walking the route. */}
      <header className="sticky top-0 z-20 -mx-4 flex w-[calc(100%+2rem)] items-start justify-between gap-2 bg-paper px-4 py-2 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6">
        <button
          type="button"
          onClick={() => setKid(null)}
          aria-label={`Playing as ${avatar} (${meta.english}) — tap to switch kids`}
          className="sticker flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          {avatar}
        </button>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-6xl">
            ¡Palabras!
          </h1>
          <p className="mt-1 hidden text-lg font-semibold text-ink/60 sm:block">
            Tap a sticker to play
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          {/* La mascota is not learning content, so it no longer sits among the
              shelves — it belongs with the album, as the other half of "your
              stuff". The star balance rides it, since this is where stars go. */}
          <Link
            href="/mascota"
            aria-label={
              petHungry
                ? `La mascota is hungry — feed it with your ${stars} stars`
                : `La mascota — feed it with your ${stars} stars`
            }
            style={{ "--accent": "#fbbf24" } as React.CSSProperties}
            className="sticker relative flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <span aria-hidden>{petFace}</span>
            {petHungry && (
              <span
                aria-hidden
                className="chest-tease absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-white text-base"
              >
                🥺
              </span>
            )}
            <span
              aria-hidden
              className="absolute -bottom-2 rounded-full border-2 border-ink bg-white px-1.5 text-xs font-extrabold"
            >
              ⭐{stars}
            </span>
          </Link>
          <Link
            href="/album"
            aria-label="Open the sticker album"
            className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            📔
          </Link>
        </div>
      </header>

      <BoostBadge kid={kid} nonce={boostNonce} />

      {daily && (
        <button
          type="button"
          key={`daily-${dailyWobble}`}
          onClick={() => hearDaily(daily)}
          aria-label={`Card of the day: ${daily.text} (${daily.card.english})`}
          className={`sticker relative flex w-full max-w-md items-center justify-center gap-4 px-6 py-4 active:translate-x-1 active:translate-y-1 active:shadow-none ${
            dailyWobble > 0 ? "wobble" : "pop-in"
          }`}
        >
          <span aria-hidden className="sticker-peel" />
          <span aria-hidden className="text-5xl">
            {daily.card.emoji}
          </span>
          <span className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/40">
              La carta del día
            </span>
            {/* A sentence needs to wrap where a single word never did. */}
            <span
              className={`font-extrabold ${
                daily.attribute === undefined ? "text-3xl" : "text-2xl"
              }`}
            >
              {daily.text}
            </span>
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

      {/* One thing, not eight. Which one is a domain rule (pickHomeFocus):
          anything holding unclaimed stars outranks any suggestion, and a
          person's challenge outranks the app's own. Everything not shown is
          still reachable — el repaso by the camino, la mascota from the
          header. La misión is NOT in this rotation: see below. */}
      {/* Today's one thing, and la misión, in a single row instead of two
          stacked bands. `flex-wrap` means this degrades to exactly the old
          stacking when both cards are wide — it only buys a line back when
          they fit, which on a phone is the common case (a 🎁 beside three
          misión icons). The bands above home's content were the crowding;
          the route below is long, but long is not crowded. */}
      <div className="flex w-full flex-wrap items-stretch justify-center gap-3">
        {focus === "gift" && (
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

        {(focus === "challenge" || focus === "challenge-claim") &&
          challenge !== null &&
          (() => {
            const deck = decks.find((d) => d.id === challenge.deckId);
            return deck === undefined ? null : (
              <ChallengeCard
                challenge={challenge}
                deck={deck}
                onClaim={claimChallengeReward}
              />
            );
          })()}

        {/* La misión is drawn outside the slot above, like el camino: it resets
            at midnight and no other screen can show it, so competing for one slot
            meant a kid with stuck words never saw it at all. It leaves home only
            once it is done and the chest is open (missionOnHome). */}
        {missionOnHome(mission) && (
          <MissionCard
            mission={mission}
            kid={kid}
            decks={publicDecks}
            groups={groups}
            camino={camino}
            onClaim={claimBonus}
          />
        )}

        {focus === "repaso" && (
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
      </div>

      {/* El camino *is* home now. The 12-tile grid it replaces already
          rendered `groupsInTrailOrder`, so this is the same shelves in the
          same order drawn as a route rather than a grid — and it retires the
          duplication home carried since the strip shipped: a strip that
          summarised the route sitting directly above a grid that was the
          route. One navigation, not two. */}
      {camino !== null && <CaminoMap camino={camino} groups={groups} />}

      {/* What the route does not cover. Las frases, los cuentos and the secret
          decks sit outside the shelved pack, which is exactly the open roadmap
          item "frases, cuentos and the secret deck as steps" — until that
          lands they keep a grid of their own, below the road. */}
      <div className="grid w-full grid-cols-2 gap-5 sm:gap-6">

        <Link
          href={kid ? `/frases/${modes.quiz}` : "/frases"}
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

        <Link
          href="/cuento"
          aria-label="Los cuentos — stories"
          style={{ "--accent": deckAccent("cuento") } as React.CSSProperties}
          className="sticker pop-in relative flex min-h-40 flex-col items-center justify-center gap-1.5 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
        >
          <span aria-hidden className="sticker-peel" />
          <span aria-hidden className="text-5xl sm:text-6xl">
            📚
          </span>
          <span className="text-center text-xl font-extrabold sm:text-2xl">
            Los cuentos
          </span>
          <span className="text-xs font-semibold text-ink/50">Stories</span>
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
