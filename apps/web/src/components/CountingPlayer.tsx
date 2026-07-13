"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createCountingGame,
  kidForActivity,
  type CountingGame,
  type QuizMode,
  type VocabularyCard,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { recordAnswer } from "@/lib/client-container";
import { getSelectedKid } from "@/lib/kid";
import { useCombo } from "@/lib/use-combo";
import { DoneScreen } from "@/components/DoneScreen";
import { RachaBurst } from "@/components/RachaBurst";

interface Props {
  itemPool: readonly VocabularyCard[];
  numberCards: readonly VocabularyCard[];
  mode: QuizMode;
  accent: string;
}

const CELEBRATE_MS = 1100;

/** ¿Cuántos hay?: count the pictures, tap the number. */
export function CountingPlayer({ itemPool, numberCards, mode, accent }: Props) {
  const [game, setGame] = useState<CountingGame | null>(null);
  const [index, setIndex] = useState(0);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [wrongTap, setWrongTap] = useState<{ id: string; nonce: number } | null>(
    null,
  );
  const advanceTimer = useRef<number | null>(null);
  const roundMissed = useRef(false);
  const firstTries = useRef(0);
  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
    setGame(createCountingGame(itemPool, numberCards, mode));
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, [itemPool, numberCards, mode]);

  const rounds = game?.rounds ?? [];
  const done = game !== null && index >= rounds.length;
  const round = rounds[index];

  function restart() {
    setGame(createCountingGame(itemPool, numberCards, mode));
    setIndex(0);
    setCorrectId(null);
    setWrongTap(null);
    roundMissed.current = false;
    firstTries.current = 0;
    combo.reset();
  }

  function choose(card: VocabularyCard) {
    if (!round || correctId !== null) {
      return;
    }
    const answer = numberCards[round.count - 1]!;
    if (card.id === answer.id) {
      setCorrectId(card.id);
      setWrongTap(null);
      combo.correct();
      const kid =
        getSelectedKid() ??
        kidForActivity(mode === "listen" ? "counting-listen" : "counting-read") ??
        "listener";
      recordAnswer
        .execute(kid, answer.id, !roundMissed.current)
        .catch((err: unknown) =>
          log.error("word-stats", "failed to record", { err }),
        );
      if (!roundMissed.current) {
        firstTries.current += 1;
      }
      roundMissed.current = false;
      speakSpanish(answer.spanish);
      advanceTimer.current = window.setTimeout(() => {
        setIndex((i) => i + 1);
        setCorrectId(null);
      }, CELEBRATE_MS);
    } else {
      roundMissed.current = true;
      combo.wrong();
      setWrongTap((prev) => ({ id: card.id, nonce: (prev?.nonce ?? 0) + 1 }));
    }
  }

  return (
    <main
      style={{ "--accent": accent } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href="/deck/numbers"
          aria-label="Back to Numbers 1-10"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          🧮
        </span>
      </header>

      {combo.racha !== null && !done && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}
      {done ? (
        <DoneScreen
          stickerDeckId="numbers"
          activity={mode === "listen" ? "counting-listen" : "counting-read"}
          onReplay={restart}
          noAward
          firstTryCount={firstTries.current}
          totalRounds={rounds.length}
          back={{ href: "/deck/numbers", emoji: "🔢", label: "Back to Numbers 1-10" }}
        />
      ) : !round ? (
        <section className="flex-1" aria-hidden />
      ) : (
        <>
          <section className="flex flex-col items-center gap-3 py-2">
            {mode === "listen" ? (
              <button
                type="button"
                onClick={() => speakSpanish("¿Cuántos hay?")}
                aria-label="Hear the question (how many are there?)"
                className="sticker flex h-20 w-20 items-center justify-center text-4xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔊
              </button>
            ) : (
              <div className="sticker relative flex w-full max-w-md items-center justify-center px-6 py-3">
                <span aria-hidden className="sticker-peel" />
                <span className="text-3xl font-extrabold sm:text-4xl">
                  ¿Cuántos hay?
                </span>
              </div>
            )}
          </section>

          <section className="flex flex-1 items-center justify-center">
            <div
              key={index}
              className="sticker pop-in relative flex w-full flex-wrap items-center justify-center gap-3 p-6"
              aria-label="Count the pictures"
            >
              <span aria-hidden className="sticker-peel" />
              {Array.from({ length: round.count }, (_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="count-item text-5xl sm:text-6xl"
                >
                  {round.item.emoji}
                </span>
              ))}
            </div>
          </section>

          <section className="py-3">
            <div
              className={`grid gap-4 ${mode === "listen" ? "grid-cols-2" : "grid-cols-4"}`}
            >
              {round.choices.map((choice) => {
                const isCorrectPick = correctId === choice.id;
                const isWrong = wrongTap?.id === choice.id;
                return (
                  <button
                    type="button"
                    key={`${index}-${choice.id}-${isWrong ? wrongTap.nonce : 0}`}
                    onClick={() => choose(choice)}
                    aria-label={`Pick ${choice.english}`}
                    className={`sticker flex min-h-20 items-center justify-center p-3 ${
                      isCorrectPick ? "pop-in" : isWrong ? "wobble" : ""
                    }`}
                    style={
                      isCorrectPick
                        ? ({
                            "--sticker-face": "var(--color-lime)",
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {mode === "listen" ? (
                      <span aria-hidden className="text-4xl sm:text-5xl">
                        {choice.emoji}
                      </span>
                    ) : (
                      <span className="text-2xl font-extrabold">
                        {choice.spanish}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <footer className="flex items-center justify-center pb-2">
            <div
              className="flex items-center gap-1.5"
              aria-label={`Round ${index + 1} of ${rounds.length}`}
            >
              {rounds.map((_, i) => (
                <span
                  key={i}
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
