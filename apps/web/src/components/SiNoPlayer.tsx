"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createSiNoGame,
  type Deck,
  type QuizMode,
  type SiNoGame,
} from "@learn-spanish/core";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { DoneScreen } from "@/components/DoneScreen";

interface Props {
  deck: Deck;
  mode: QuizMode;
  accent: string;
}

const CELEBRATE_MS = 1100;

export function SiNoPlayer({ deck, mode, accent }: Props) {
  // Rounds are random, so the game is built client-side only (hydration).
  const [game, setGame] = useState<SiNoGame | null>(null);
  const [index, setIndex] = useState(0);
  const [correctPick, setCorrectPick] = useState<boolean | null>(null);
  const [wrongTap, setWrongTap] = useState<{ pick: boolean; nonce: number } | null>(
    null,
  );
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    warmUpVoices();
    setGame(createSiNoGame(deck, mode));
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, [deck, mode]);

  const rounds = game?.rounds ?? [];
  const done = game !== null && index >= rounds.length;
  const round = rounds[index];

  function restart() {
    setGame(createSiNoGame(deck, mode));
    setIndex(0);
    setCorrectPick(null);
    setWrongTap(null);
  }

  function answer(saidYes: boolean) {
    if (!round || correctPick !== null) {
      return;
    }
    if (saidYes === round.isTrue) {
      setCorrectPick(saidYes);
      setWrongTap(null);
      // Always speak the picture's true name — the reinforcement either way.
      speakSpanish(round.card.spanish);
      advanceTimer.current = window.setTimeout(() => {
        setIndex((i) => i + 1);
        setCorrectPick(null);
      }, CELEBRATE_MS);
    } else {
      setWrongTap((prev) => ({ pick: saidYes, nonce: (prev?.nonce ?? 0) + 1 }));
    }
  }

  return (
    <main
      style={{ "--accent": accent } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href={`/deck/${deck.id}`}
          aria-label={`Back to ${deck.nameEnglish}`}
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          {deck.emoji}
        </span>
      </header>

      {done ? (
        <DoneScreen
          stickerDeckId={deck.id}
          activity={mode === "listen" ? "si-no-listen" : "si-no-read"}
          onReplay={restart}
          back={{
            href: `/deck/${deck.id}`,
            emoji: deck.emoji,
            label: `More games in ${deck.nameEnglish}`,
          }}
        />
      ) : !round ? (
        <section className="flex-1" aria-hidden />
      ) : (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-6">
            <div
              key={`picture-${round.card.id}`}
              className="sticker pop-in relative flex aspect-square w-full max-w-64 items-center justify-center p-6"
              aria-label={`Picture of ${round.card.english}`}
            >
              <span aria-hidden className="sticker-peel" />
              <span aria-hidden className="text-8xl sm:text-9xl">
                {round.card.emoji}
              </span>
            </div>

            {mode === "listen" ? (
              <button
                type="button"
                onClick={() => speakSpanish(`¿Es ${round.claim.spanish}?`)}
                aria-label={`Hear the question (is it ${round.claim.english}?)`}
                className="sticker flex h-28 w-28 items-center justify-center text-6xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔊
              </button>
            ) : (
              <div
                key={`claim-${round.card.id}`}
                className="sticker pop-in relative flex w-full max-w-md items-center justify-center px-8 py-5"
              >
                <span aria-hidden className="sticker-peel" />
                <span className="text-4xl font-extrabold sm:text-5xl">
                  ¿Es {round.claim.spanish}?
                </span>
              </div>
            )}

            <div className="grid w-full max-w-md grid-cols-2 gap-6">
              {([true, false] as const).map((saidYes) => {
                const isCorrectPick = correctPick === saidYes;
                const isWrongPick = wrongTap?.pick === saidYes;
                return (
                  <button
                    type="button"
                    key={`${round.card.id}-${saidYes}-${
                      isWrongPick ? wrongTap.nonce : 0
                    }`}
                    onClick={() => answer(saidYes)}
                    aria-label={saidYes ? "Yes" : "No"}
                    className={`sticker flex h-32 items-center justify-center text-7xl active:translate-x-1 active:translate-y-1 active:shadow-none ${
                      isCorrectPick ? "pop-in" : isWrongPick ? "wobble" : ""
                    }`}
                    style={
                      isCorrectPick
                        ? ({
                            "--sticker-face": "var(--color-lime)",
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {saidYes ? "✅" : "❌"}
                  </button>
                );
              })}
            </div>
          </section>

          <footer className="flex items-center justify-center pb-2">
            <div
              className="flex flex-wrap items-center gap-1.5"
              aria-label={`Round ${index + 1} of ${rounds.length}`}
            >
              {rounds.map((r, i) => (
                <span
                  key={r.card.id}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i < index || (i === index && correctPick !== null)
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
