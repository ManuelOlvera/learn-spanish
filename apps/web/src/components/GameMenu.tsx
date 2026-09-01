"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COUNTING_DECK_ID,
  earnableActivities,
  globoDifficulties,
  hasConversation,
  KID_GAME_MODES,
  sopaDifficulties,
  stickerCount,
  stickerId,
  stickerTier,
  type ActivityId,
  type Deck,
  type KidId,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { getAlbum } from "@/lib/client-container";
import { getStickerCounts } from "@/lib/economy";
import { TIER_GLYPH, TIER_LABEL } from "@/components/TrailMarks";
import { getAvatar, KID_META } from "@/lib/kid";
import { useSelectedKid } from "@/lib/use-selected-kid";

interface Props {
  deck: Deck;
  accent: string;
}

interface ModeLink {
  glyph: string;
  href: string;
  label: string;
}

/** With a kid selected, each game gets its one right button; without one
 *  (deep link before ever picking), both difficulty buttons show. */
function gamesFor(kid: KidId | null, deck: Deck): readonly {
  emoji: string;
  spanish: string;
  english: string;
  modes: readonly ModeLink[];
}[] {
  const flashcards = {
    emoji: "📖",
    spanish: "Las tarjetas",
    english: "Flashcards",
    modes: [{ glyph: "📖", href: "learn", label: "Flashcards" }],
  };
  // Learn-only decks (verbs) never generate quiz-style questions — the games
  // assume nouns ("¿Es un…?"), so only flashcards are offered.
  if (deck.learnOnly) {
    return [flashcards];
  }
  const deckId = deck.id;
  const modes = kid === null ? null : KID_GAME_MODES[kid];
  const pick = (listen: ModeLink, read: ModeLink): readonly ModeLink[] =>
    modes === null ? [listen, read] : [modes.quiz === "listen" ? listen : read];
  const pickMatch = (
    pictures: ModeLink,
    words: ModeLink,
  ): readonly ModeLink[] =>
    modes === null
      ? [pictures, words]
      : [modes.match === "pictures" ? pictures : words];

  return [
    flashcards,
    {
      emoji: "🔍",
      spanish: "¿Dónde está?",
      english: "Find the picture",
      modes: pick(
        { glyph: "👂", href: "quiz/listen", label: "Find it by ear" },
        { glyph: "🔤", href: "quiz/read", label: "Find it by word" },
      ),
    },
    {
      emoji: "✅",
      spanish: "¿Sí o no?",
      english: "Yes or no",
      modes: pick(
        { glyph: "👂", href: "si-no/listen", label: "Yes or no by ear" },
        { glyph: "🔤", href: "si-no/read", label: "Yes or no by word" },
      ),
    },
    {
      emoji: "🧩",
      spanish: "Las parejas",
      english: "Matching pairs",
      modes: pickMatch(
        { glyph: "🖼️", href: "match/pictures", label: "Pairs: pictures" },
        { glyph: "🔤", href: "match/words", label: "Pairs: words" },
      ),
    },
    {
      emoji: "🔗",
      spanish: "Conecta",
      english: "Connect the words",
      modes: pick(
        { glyph: "👂", href: "connect/listen", label: "Connect by ear" },
        { glyph: "🔤", href: "connect/read", label: "Connect by word" },
      ),
    },
    {
      emoji: "👀",
      spanish: "Busca y toca",
      english: "Seek and find",
      modes: pick(
        { glyph: "👂", href: "scene/listen", label: "Seek by ear" },
        { glyph: "🔤", href: "scene/read", label: "Seek by word" },
      ),
    },
    // Only on decks whose words are things a person can like — "¿Te gusta el
    // codo?" is grammatical and absurd, so the tile is simply absent elsewhere.
    ...(hasConversation(deckId)
      ? [
          {
            emoji: "🗣️",
            spanish: "Habla conmigo",
            english: "Talk with your pet",
            modes: [{ glyph: "💬", href: "hablar", label: "Talk with your pet" }],
          },
        ]
      : []),
    {
      emoji: "⚔️",
      spanish: "El duelo",
      english: "Two-player duel",
      modes: [{ glyph: "⚔️", href: "duel", label: "Two-player duel" }],
    },
    {
      emoji: "⏱️",
      spanish: "El reto",
      english: "60-second challenge",
      modes: [{ glyph: "⏱️", href: "reto", label: "60-second challenge" }],
    },
    // Counting needs showable quantities — only the 1-10 deck hosts it.
    ...(deckId === COUNTING_DECK_ID
      ? [
          {
            emoji: "🧮",
            spanish: "¿Cuántos hay?",
            english: "How many?",
            modes: pick(
              { glyph: "👂", href: "counting/listen", label: "Counting by ear" },
              { glyph: "🔤", href: "counting/read", label: "Counting by word" },
            ),
          },
        ]
      : []),
    // Spelling is reader-level; the pre-reader's menu hides it.
    ...(kid !== "listener"
      ? [
          {
            emoji: "✏️",
            spanish: "Deletrea",
            english: "Spell the word",
            modes: [{ glyph: "🔤", href: "spelling", label: "Spell the word" }],
          },
        ]
      : []),
    // La sopa is for both kids (they both love it) — the only gate is whether
    // the deck's words fit a grid. It stays sticker-less, so no album slot.
    ...(sopaDifficulties(deck).length > 0
      ? [
          {
            emoji: "🥣",
            spanish: "La sopa de letras",
            english: "Word search",
            modes: [{ glyph: "🔤", href: "sopa", label: "Word search" }],
          },
        ]
      : []),
    // El globo shipped reader-level, then went the way of la sopa (2026-08-13):
    // the pre-reader plays it and likes it, and 🟢 hands him the picture as its
    // tip, so the only gate left is whether the deck can fill a length band.
    // It stays sticker-less, so no album slot. Deletrea stays reader-level.
    ...(globoDifficulties(deck).length > 0
      ? [
          {
            emoji: "🎈",
            spanish: "El globo",
            english: "Guess before it pops",
            modes: [{ glyph: "🔤", href: "globo", label: "Guess the letters" }],
          },
        ]
      : []),
  ];
}

/** A mode's route is its activity id with the slash swapped for a dash
 *  ("quiz/listen" → "quiz-listen"), which is how the album already keys its
 *  stickers. Routes with no sticker (el duelo, el reto) simply never match. */
function activityForHref(href: string): ActivityId {
  return href.replace("/", "-") as ActivityId;
}

export function GameMenu({ deck, accent }: Props) {
  const selected = useSelectedKid();
  // `gamesFor` wants a real kid or nothing; "still reading" is handled below.
  const kid = selected.status === "picked" ? selected.kid : null;
  // Which of this deck's activities this kid has already finished — the
  // stickers themselves, so the ⭐ here and the ⭐ on el camino agree.
  const [earned, setEarned] = useState<ReadonlySet<string>>(new Set());
  // Completion counts behind those stickers — the same ledger the album tiers
  // from, so a 🥇 here and a 🥇 in the album are the same fact.
  const [counts, setCounts] = useState<Readonly<Record<string, number>>>({});

  useEffect(() => {
    if (!kid) {
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
      .catch((err: unknown) => log.error("album", "failed to load", { err }));
    setCounts(getStickerCounts());
    return () => {
      cancelled = true;
    };
  }, [kid]);

  if (selected.status === "loading") {
    return <main className="min-h-dvh" aria-hidden />;
  }

  const games = gamesFor(kid, deck);
  // The deck's step on el camino: how many of the activities this kid can earn
  // are done. Only meaningful once a kid is picked.
  const stepActivities = kid === null ? [] : earnableActivities(deck, kid);
  const stepDone =
    kid === null
      ? 0
      : stepActivities.filter((a) => earned.has(stickerId(kid, deck.id, a)))
          .length;

  /** How deep this kid has gone on one activity — the album's own rule, so a
   *  🥇 here and a 🥇 in the album are the same fact. */
  function tierOf(activity: ActivityId): ReturnType<typeof stickerTier> {
    return kid
      ? stickerTier(stickerCount(kid, deck.id, activity, counts, earned))
      : "none";
  }

  return (
    <main
      style={{ "--accent": accent } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back to all decks"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        {kid !== null && (
          <span
            aria-label={`Playing as the ${KID_META[kid].english} kid`}
            className="text-4xl"
          >
            {getAvatar(kid)}
          </span>
        )}
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
        <div className="pop-in text-center">
          <span aria-hidden className="block text-7xl sm:text-8xl">
            {deck.emoji}
          </span>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            {deck.nameSpanish}
          </h1>
          <p className="text-lg font-semibold text-ink/50">{deck.nameEnglish}</p>
          {/* This deck's stop on el camino, counted in the same stickers the
              route counts — so the ⭐s below and the pips on the shelf agree. */}
          {kid !== null && stepActivities.length > 0 && (
            <p
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border-4 border-ink bg-white px-3 py-1 text-lg font-extrabold"
              aria-label={`${stepDone} de ${stepActivities.length} juegos terminados`}
            >
              <span aria-hidden>⭐</span>
              <span aria-hidden>
                {stepDone}/{stepActivities.length}
              </span>
            </p>
          )}
        </div>

        <div className="flex w-full max-w-md flex-col gap-5">
          {games.map((game, i) => (
            <div
              key={game.spanish}
              className="pop-in flex items-center justify-between gap-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <span aria-hidden className="text-5xl">
                  {game.emoji}
                </span>
                <span className="flex flex-col">
                  <span className="text-2xl font-extrabold sm:text-3xl">
                    {game.spanish}
                  </span>
                  <span className="text-sm font-semibold text-ink/50">
                    {game.english}
                  </span>
                </span>
              </div>
              <div className="flex gap-3">
                {game.modes.map((mode) => {
                  const activity = activityForHref(mode.href);
                  // Only the six that make up the deck's step are badged. El
                  // duelo, el reto and the letter games earn no sticker, so a
                  // badge on them would promise progress they can't deliver.
                  const inStep = stepActivities.includes(activity);
                  const tier = tierOf(activity);
                  return (
                    <Link
                      key={mode.href}
                      href={`/deck/${deck.id}/${mode.href}`}
                      aria-label={`${mode.label} — ${deck.nameEnglish}${
                        inStep ? ` — ${TIER_LABEL[tier]}` : ""
                      }`}
                      className="sticker relative flex h-20 w-20 items-center justify-center text-4xl active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                      {mode.glyph}
                      {/* ○ still to do, then ⭐ → 🥈 → 🥇 as it is replayed.
                          A mark, never a lock: every button plays, and a
                          finished one plays again — which is how it levels. */}
                      {inStep && (
                        <span
                          aria-hidden
                          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-ink bg-white text-base"
                        >
                          {TIER_GLYPH[tier]}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
