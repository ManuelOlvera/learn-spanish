"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  KID_GAME_MODES,
  sopaDifficulties,
  type Deck,
  type KidId,
} from "@learn-spanish/core";
import { getAvatar, getSelectedKid, KID_META } from "@/lib/kid";

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
    ...(deckId === "numbers"
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
  ];
}

export function GameMenu({ deck, accent }: Props) {
  const [kid, setKid] = useState<KidId | null | undefined>(undefined);

  useEffect(() => {
    setKid(getSelectedKid());
  }, []);

  if (kid === undefined) {
    return <main className="min-h-dvh" aria-hidden />;
  }

  const games = gamesFor(kid, deck);

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
                {game.modes.map((mode) => (
                  <Link
                    key={mode.href}
                    href={`/deck/${deck.id}/${mode.href}`}
                    aria-label={`${mode.label} — ${deck.nameEnglish}`}
                    className="sticker flex h-20 w-20 items-center justify-center text-4xl active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    {mode.glyph}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
