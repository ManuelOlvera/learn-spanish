"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createSentenceGame,
  SENTENCES_ID,
  sentenceText,
  type Sentence,
  type SentenceGame,
} from "@learn-spanish/core";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { DoneScreen } from "@/components/DoneScreen";

interface Props {
  sentences: readonly Sentence[];
  accent: string;
}

/** Describe-the-card: a picture whose tap speaks a whole sentence about it. */
export function FrasesListenPlayer({ sentences, accent }: Props) {
  // Round order is random, so the game is built client-side only (hydration).
  const [game, setGame] = useState<SentenceGame | null>(null);
  const [index, setIndex] = useState(0);
  const [wobbleKey, setWobbleKey] = useState(0);

  useEffect(() => {
    warmUpVoices();
    setGame(createSentenceGame(sentences));
  }, [sentences]);

  const rounds = game?.rounds ?? [];
  const done = game !== null && index >= rounds.length;
  const round = rounds[index];

  function hear(sentence: Sentence) {
    speakSpanish(sentenceText(sentence));
    setWobbleKey((k) => k + 1);
  }

  // Silent on advance, like the flashcards: audio only on the card's own tap.
  function next() {
    setIndex((i) => i + 1);
    setWobbleKey(0);
  }

  function restart() {
    setGame(createSentenceGame(sentences));
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
          💬
        </span>
      </header>

      {done ? (
        <DoneScreen
          stickerDeckId={SENTENCES_ID}
          activity="frases-listen"
          onReplay={restart}
          firstTryCount={2}
          back={{ href: "/", emoji: "🏠", label: "Back to all decks" }}
        />
      ) : !round ? (
        <section className="flex-1" aria-hidden />
      ) : (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-8">
            <button
              type="button"
              key={`${round.sentence.id}-${wobbleKey}`}
              onClick={() => hear(round.sentence)}
              aria-label={`Hear the sentence (${round.sentence.english})`}
              className={`sticker relative flex aspect-square w-full max-w-md flex-col items-center justify-center gap-4 p-8 ${
                wobbleKey > 0 ? "wobble" : "pop-in"
              }`}
            >
              <span aria-hidden className="sticker-peel" />
              <span aria-hidden className="text-[7rem] leading-none sm:text-[9rem]">
                {round.sentence.emoji}
              </span>
              <span className="text-3xl font-extrabold sm:text-4xl">
                {sentenceText(round.sentence)}
              </span>
              <span aria-hidden className="absolute bottom-5 right-6 text-3xl">
                🔊
              </span>
            </button>
          </section>

          <footer className="flex items-center justify-between gap-4 pb-2">
            <div
              className="flex flex-wrap items-center gap-1.5"
              aria-label={`Sentence ${index + 1} of ${rounds.length}`}
            >
              {rounds.map((r, i) => (
                <span
                  key={r.sentence.id}
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
              aria-label="Next sentence"
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
