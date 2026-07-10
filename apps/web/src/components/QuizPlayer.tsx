"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createQuiz,
  type Deck,
  type Quiz,
  type QuizMode,
} from "@learn-spanish/core";
import { speakSpanish, warmUpVoices } from "@/lib/speech";

interface Props {
  deck: Deck;
  mode: QuizMode;
  accent: string;
}

const CELEBRATE_MS = 1100;

export function QuizPlayer({ deck, mode, accent }: Props) {
  // Rounds are random, so the quiz is built client-side only — building it
  // during SSR would hydrate against a different shuffle.
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [wrongTap, setWrongTap] = useState<{ id: string; nonce: number } | null>(
    null,
  );
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    warmUpVoices();
    setQuiz(createQuiz(deck, mode));
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, [deck, mode]);

  const rounds = quiz?.rounds ?? [];
  const done = quiz !== null && index >= rounds.length;
  const round = rounds[index];

  function restart() {
    setQuiz(createQuiz(deck, mode));
    setIndex(0);
    setCorrectId(null);
    setWrongTap(null);
  }

  function choose(cardId: string) {
    if (!round || correctId !== null) {
      return;
    }
    if (cardId === round.answer.id) {
      setCorrectId(cardId);
      setWrongTap(null);
      speakSpanish(round.answer.spanish);
      advanceTimer.current = window.setTimeout(() => {
        setIndex((i) => i + 1);
        setCorrectId(null);
      }, CELEBRATE_MS);
    } else {
      setWrongTap((prev) => ({ id: cardId, nonce: (prev?.nonce ?? 0) + 1 }));
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
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div aria-hidden className="pop-in text-8xl">
            🎉
          </div>
          <h1 className="text-5xl font-extrabold">¡Muy bien!</h1>
          <div className="flex gap-6">
            <button
              type="button"
              onClick={restart}
              aria-label="Play again"
              className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              🔁
            </button>
            <Link
              href={`/deck/${deck.id}`}
              aria-label={`Back to ${deck.nameEnglish}`}
              className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              🏠
            </Link>
          </div>
        </section>
      ) : !round ? (
        // One frame while the client builds the shuffle.
        <section className="flex-1" aria-hidden />
      ) : (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-8">
            {mode === "listen" ? (
              <button
                type="button"
                onClick={() => speakSpanish(round.answer.spanish)}
                aria-label={`Hear the word (${round.answer.english})`}
                className="sticker pop-in flex h-36 w-36 items-center justify-center text-7xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔊
              </button>
            ) : (
              <div
                key={round.answer.id}
                className="sticker pop-in relative flex w-full max-w-md items-center justify-center px-8 py-6"
              >
                <span aria-hidden className="sticker-peel" />
                <span className="text-5xl font-extrabold sm:text-6xl">
                  {round.answer.spanish}
                </span>
              </div>
            )}

            <div className="grid w-full max-w-md grid-cols-2 gap-6">
              {round.choices.map((choice) => {
                const isCorrectPick = correctId === choice.id;
                const isWrongPick = wrongTap?.id === choice.id;
                return (
                  <button
                    type="button"
                    key={`${round.answer.id}-${choice.id}-${
                      isWrongPick ? wrongTap.nonce : 0
                    }`}
                    onClick={() => choose(choice.id)}
                    aria-label={`Pick ${choice.english}`}
                    className={`sticker relative flex aspect-square flex-col items-center justify-center gap-2 p-4 ${
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
                    <span aria-hidden className="sticker-peel" />
                    <span
                      aria-hidden
                      className={
                        mode === "listen"
                          ? "text-8xl sm:text-9xl"
                          : "text-7xl sm:text-8xl"
                      }
                    >
                      {choice.emoji}
                    </span>
                    {isCorrectPick && (
                      <span className="text-2xl font-extrabold">
                        {round.answer.spanish}
                      </span>
                    )}
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
                  key={r.answer.id}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i < index || (i === index && correctId !== null)
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
