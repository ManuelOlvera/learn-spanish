"use client";

import Link from "next/link";
import { KID_GAME_MODES, type Story } from "@learn-spanish/core";
import { useSelectedKidOr } from "@/lib/use-selected-kid";
import { deckAccent } from "@/lib/deck-theme";

interface Props {
  stories: readonly Story[];
}

/** The story shelf: pick a cuento by its picture. The difficulty comes from
 *  whoever is playing, so a kid never sees a mode chooser here. */
export function StoryShelf({ stories }: Props) {
  const kid = useSelectedKidOr("listener");

  // Before storage is read (and on a deep link with no kid ever picked) the
  // pre-reader's level is the safe default — it never shows written prompts.
  const mode = KID_GAME_MODES[kid ?? "listener"].quiz;

  return (
    <main
      style={{ "--accent": deckAccent("cuento") } as React.CSSProperties}
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
        <span aria-hidden className="text-4xl">
          📚
        </span>
      </header>

      <div className="pop-in mt-4 text-center">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Los cuentos</h1>
        <p className="text-lg font-semibold text-ink/50">Stories</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-5 pb-6 sm:grid-cols-3">
        {stories.map((story) => (
          <Link
            key={story.id}
            href={`/cuento/${story.id}/${mode}`}
            aria-label={story.titleEnglish}
            style={
              { "--accent": deckAccent(story.id) } as React.CSSProperties
            }
            className="sticker pop-in relative flex min-h-44 flex-col items-center justify-center gap-2 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
          >
            <span aria-hidden className="sticker-peel" />
            <span aria-hidden className="text-6xl sm:text-7xl">
              {story.emoji}
            </span>
            <span className="text-center text-lg font-extrabold leading-tight">
              {story.titleSpanish}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
