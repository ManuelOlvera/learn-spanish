"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Deck } from "@learn-spanish/core";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { DoneScreen } from "@/components/DoneScreen";

interface Props {
  deck: Deck;
  accent: string;
}

export function FlashcardPlayer({ deck, accent }: Props) {
  const [index, setIndex] = useState(0);
  const [wobbleKey, setWobbleKey] = useState(0);
  const done = index >= deck.cards.length;
  const card = deck.cards[index];

  useEffect(() => {
    warmUpVoices();
  }, []);

  function hear(text: string) {
    speakSpanish(text);
    setWobbleKey((k) => k + 1);
  }

  // Deliberately silent on advance/restart: the kid gets to try naming the
  // picture first — audio only plays when the card itself is tapped.
  function next() {
    setIndex((i) => i + 1);
    setWobbleKey(0);
  }

  function restart() {
    setIndex(0);
    setWobbleKey(0);
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
        <span aria-hidden className="text-4xl">
          {deck.emoji}
        </span>
      </header>

      {done || !card ? (
        <DoneScreen deck={deck} activity="learn" onReplay={restart} />
      ) : (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-8">
            <button
              type="button"
              key={`${card.id}-${wobbleKey}`}
              onClick={() => hear(card.spanish)}
              aria-label={`Hear ${card.spanish} (${card.english})`}
              className={`sticker relative flex aspect-square w-full max-w-md flex-col items-center justify-center gap-4 p-8 ${
                wobbleKey > 0 ? "wobble" : "pop-in"
              }`}
            >
              <span aria-hidden className="sticker-peel" />
              <span aria-hidden className="text-[7rem] leading-none sm:text-[9rem]">
                {card.emoji}
              </span>
              <span className="text-4xl font-extrabold sm:text-5xl">
                {card.spanish}
              </span>
              <span aria-hidden className="absolute bottom-5 right-6 text-3xl">
                🔊
              </span>
            </button>
          </section>

          <footer className="flex items-center justify-between gap-4 pb-2">
            <div
              className="flex max-w-[55%] flex-wrap items-center gap-1.5"
              aria-label={`Card ${index + 1} of ${deck.cards.length}`}
            >
              {deck.cards.map((c, i) => (
                <span
                  key={c.id}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i <= index ? "bg-[var(--accent)]" : "bg-white"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              aria-label="Next card"
              className="sticker flex h-20 w-28 items-center justify-center text-5xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
              style={
                {
                  "--sticker-face": "var(--color-lime)",
                  "--accent": "var(--color-ink)",
                } as React.CSSProperties
              }
            >
              →
            </button>
          </footer>
        </>
      )}
    </main>
  );
}
