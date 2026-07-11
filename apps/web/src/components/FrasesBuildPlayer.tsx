"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createSentenceGame,
  SENTENCES_ID,
  sentenceText,
  type Sentence,
  type SentenceGame,
} from "@learn-spanish/core";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { useCombo } from "@/lib/use-combo";
import { DoneScreen } from "@/components/DoneScreen";
import { RachaBurst } from "@/components/RachaBurst";

interface Props {
  sentences: readonly Sentence[];
  accent: string;
}

const CELEBRATE_MS = 1600;

/** Sentence builder: tap the word tiles in order; wrong tiles wobble back. */
export function FrasesBuildPlayer({ sentences, accent }: Props) {
  // Round order and tile deals are random — built client-side only (hydration).
  const [game, setGame] = useState<SentenceGame | null>(null);
  const [index, setIndex] = useState(0);
  /** Tile positions already placed, in placement order. */
  const [placed, setPlaced] = useState<readonly number[]>([]);
  const [wrongTap, setWrongTap] = useState<{ tile: number; nonce: number } | null>(
    null,
  );
  const [celebrating, setCelebrating] = useState(false);
  const advanceTimer = useRef<number | null>(null);
  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
    setGame(createSentenceGame(sentences));
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, [sentences]);

  const rounds = game?.rounds ?? [];
  const done = game !== null && index >= rounds.length;
  const round = rounds[index];

  function restart() {
    setGame(createSentenceGame(sentences));
    setIndex(0);
    setPlaced([]);
    setWrongTap(null);
    setCelebrating(false);
    combo.reset();
  }

  function tap(tileIndex: number) {
    if (!round || celebrating || placed.includes(tileIndex)) {
      return;
    }
    const expected = round.sentence.tokens[placed.length];
    const word = round.tiles[tileIndex];
    if (word !== expected) {
      combo.wrong();
      setWrongTap((prev) => ({ tile: tileIndex, nonce: (prev?.nonce ?? 0) + 1 }));
      return;
    }
    const nowPlaced = [...placed, tileIndex];
    setPlaced(nowPlaced);
    setWrongTap(null);
    combo.correct();
    if (nowPlaced.length === round.sentence.tokens.length) {
      // The whole sentence, as the reward for finishing it.
      speakSpanish(sentenceText(round.sentence));
      setCelebrating(true);
      advanceTimer.current = window.setTimeout(() => {
        setIndex((i) => i + 1);
        setPlaced([]);
        setCelebrating(false);
      }, CELEBRATE_MS);
    } else {
      speakSpanish(word ?? "");
    }
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

      {combo.racha !== null && !done && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}
      {done ? (
        <DoneScreen
          stickerDeckId={SENTENCES_ID}
          activity="frases-read"
          onReplay={restart}
          back={{ href: "/", emoji: "🏠", label: "Back to all decks" }}
        />
      ) : !round ? (
        <section className="flex-1" aria-hidden />
      ) : (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-4">
              <span
                aria-label={`Picture hint: ${round.sentence.english}`}
                className="text-7xl sm:text-8xl"
              >
                {round.sentence.emoji}
              </span>
              <button
                type="button"
                onClick={() => speakSpanish(sentenceText(round.sentence))}
                aria-label={`Hear the sentence (${round.sentence.english})`}
                className="sticker flex h-20 w-20 items-center justify-center text-4xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔊
              </button>
            </div>

            <div
              aria-label="Your sentence so far"
              className={`sticker relative flex min-h-24 w-full max-w-md flex-wrap items-center justify-center gap-3 px-6 py-4 ${
                celebrating ? "pop-in" : ""
              }`}
              style={
                celebrating
                  ? ({
                      "--sticker-face": "var(--color-lime)",
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <span aria-hidden className="sticker-peel" />
              {round.sentence.tokens.map((_, slot) => {
                const tileIndex = placed[slot];
                const word =
                  tileIndex === undefined ? null : round.tiles[tileIndex];
                return word ? (
                  <span
                    key={slot}
                    className="pop-in text-3xl font-extrabold sm:text-4xl"
                  >
                    {word}
                  </span>
                ) : (
                  <span
                    key={slot}
                    aria-hidden
                    className="h-4 w-16 rounded-full border-b-4 border-dashed border-ink/30"
                  />
                );
              })}
            </div>

            <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-4">
              {round.tiles.map((word, tileIndex) => {
                const isPlaced = placed.includes(tileIndex);
                const isWrong = wrongTap?.tile === tileIndex;
                return (
                  <button
                    type="button"
                    key={`${round.sentence.id}-${tileIndex}-${
                      isWrong ? wrongTap.nonce : 0
                    }`}
                    onClick={() => tap(tileIndex)}
                    disabled={isPlaced}
                    aria-label={`Tile ${word}${isPlaced ? " (placed)" : ""}`}
                    className={`sticker px-6 py-4 text-2xl font-extrabold sm:text-3xl ${
                      isPlaced
                        ? "opacity-25"
                        : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                    } ${isWrong ? "wobble" : ""}`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </section>

          <footer className="flex items-center justify-center pb-2">
            <div
              className="flex flex-wrap items-center gap-1.5"
              aria-label={`Sentence ${index + 1} of ${rounds.length}`}
            >
              {rounds.map((r, i) => (
                <span
                  key={r.sentence.id}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i < index || (i === index && celebrating)
                      ? "bg-[var(--accent)]"
                      : "bg-white"
                  }`}
                />
              ))}
            </div>
          </footer>
        </>
      )}
    </main>
  );
}
