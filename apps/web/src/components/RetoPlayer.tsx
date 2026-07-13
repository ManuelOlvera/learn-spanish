"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createQuizRound,
  KID_GAME_MODES,
  type Deck,
  type KidId,
  type QuizRound,
} from "@learn-spanish/core";
import { cardFace, emojiSizeClass } from "@/lib/emoji";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { getSelectedKid, getAvatar } from "@/lib/kid";
import { addStars, getRetoBest, saveRetoBest } from "@/lib/economy";
import { feedbackFanfare } from "@/lib/feedback";
import { useCombo } from "@/lib/use-combo";
import { RachaBurst } from "@/components/RachaBurst";
import { Confetti } from "@/components/Confetti";
import { StarChest } from "@/components/StarChest";

interface Props {
  deck: Deck;
  accent: string;
}

export const RETO_SECONDS = 60;

/** El reto: answer as many as you can in 60 seconds. Wrong answers just
 *  move on — the clock is the only pressure. Best score per deck+kid. */
export function RetoPlayer({ deck, accent }: Props) {
  const [kid, setKid] = useState<KidId | null>(null);
  const [round, setRound] = useState<QuizRound | null>(null);
  const [timeLeft, setTimeLeft] = useState(RETO_SECONDS);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [isRecord, setIsRecord] = useState(false);
  const [flash, setFlash] = useState<{ id: string; good: boolean; nonce: number } | null>(null);
  const ticker = useRef<number | null>(null);
  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
    setKid(getSelectedKid() ?? "listener");
    return () => {
      if (ticker.current !== null) {
        window.clearInterval(ticker.current);
      }
    };
  }, []);

  const mode = kid === null ? "listen" : KID_GAME_MODES[kid].quiz;

  function start() {
    if (kid === null) {
      return;
    }
    setScore(0);
    setTimeLeft(RETO_SECONDS);
    setRound(createQuizRound(deck, mode));
    setPhase("play");
    combo.reset();
    ticker.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (ticker.current !== null) {
            window.clearInterval(ticker.current);
          }
          setPhase("done");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (phase === "done" && kid !== null) {
      feedbackFanfare();
      setIsRecord(saveRetoBest(kid, deck.id, score));
    }
    // deliberately keyed on phase alone: score/kid are read when time is up
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function choose(cardId: string) {
    if (!round || phase !== "play") {
      return;
    }
    const good = cardId === round.answer.id;
    if (good) {
      setScore((s) => s + 1);
      combo.correct();
      speakSpanish(round.answer.spanish);
    } else {
      combo.wrong();
    }
    setFlash((prev) => ({ id: cardId, good, nonce: (prev?.nonce ?? 0) + 1 }));
    // Keep the pace: always deal the next round immediately.
    setRound(createQuizRound(deck, mode));
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
        {phase === "play" && (
          <span
            aria-label={`${timeLeft} seconds left`}
            className={`rounded-full border-4 border-ink bg-white px-4 py-1 text-2xl font-extrabold ${
              timeLeft <= 10 ? "wobble text-red-600" : ""
            }`}
          >
            ⏱️ {timeLeft}
          </span>
        )}
        <span aria-hidden className="text-4xl">
          {kid === null ? "⏱️" : getAvatar(kid)}
        </span>
      </header>

      {combo.racha !== null && phase === "play" && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}

      {phase === "ready" ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <span aria-hidden className="pop-in text-8xl">
            ⏱️
          </span>
          <h1 className="text-5xl font-extrabold">El reto</h1>
          <p className="text-lg font-semibold text-ink/60">
            {RETO_SECONDS} seconds — how many can you get?
          </p>
          {kid !== null && getRetoBest(kid, deck.id) > 0 && (
            <p
              aria-label={`Best score ${getRetoBest(kid, deck.id)}`}
              className="text-2xl font-extrabold"
            >
              🏆 Récord: {getRetoBest(kid, deck.id)}
            </p>
          )}
          <button
            type="button"
            onClick={start}
            aria-label="Start the challenge"
            className="sticker flex h-24 w-44 items-center justify-center text-4xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
            style={{ "--sticker-face": "var(--color-lime)" } as React.CSSProperties}
          >
            ¡Ya!
          </button>
        </section>
      ) : phase === "done" ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          {isRecord && <Confetti />}
          <h1 className="text-5xl font-extrabold">
            {isRecord ? "🏆 ¡Nuevo récord!" : "¡Tiempo!"}
          </h1>
          <p aria-label={`You scored ${score}`} className="text-4xl font-extrabold">
            ✅ {score}
          </p>
          <StarChest
            amount={Math.max(1, score)}
            onOpen={() => {
              if (kid !== null) {
                addStars(kid, Math.max(1, score));
              }
            }}
          />
          <div className="flex gap-6">
            <button
              type="button"
              onClick={start}
              aria-label="Play again"
              className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              🔁
            </button>
            <Link
              href={`/deck/${deck.id}`}
              aria-label={`More games in ${deck.nameEnglish}`}
              className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {deck.emoji}
            </Link>
          </div>
        </section>
      ) : !round ? (
        <section className="flex-1" aria-hidden />
      ) : (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-6">
            <span
              aria-label={`Score ${score}`}
              className="rounded-full border-4 border-ink bg-white px-4 py-1 text-2xl font-extrabold"
            >
              ✅ {score}
            </span>
            {mode === "listen" ? (
              <button
                type="button"
                onClick={() => speakSpanish(round.answer.spanish)}
                aria-label={`Hear the word (${round.answer.english})`}
                className="sticker flex h-28 w-28 items-center justify-center text-6xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔊
              </button>
            ) : (
              <div className="sticker relative flex w-full max-w-md items-center justify-center px-8 py-4">
                <span aria-hidden className="sticker-peel" />
                <span className="text-4xl font-extrabold sm:text-5xl">
                  {round.answer.spanish}
                </span>
              </div>
            )}
            <div className="grid w-full max-w-md grid-cols-2 gap-5">
              {round.choices.map((choice) => {
                const flashed = flash?.id === choice.id;
                return (
                  <button
                    type="button"
                    key={`${round.answer.id}-${choice.id}-${flashed ? flash.nonce : 0}`}
                    onClick={() => choose(choice.id)}
                    aria-label={`Pick ${choice.english}`}
                    className={`sticker flex aspect-square items-center justify-center p-4 active:translate-x-1 active:translate-y-1 active:shadow-none ${
                      flashed ? (flash.good ? "pop-in" : "wobble") : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className={emojiSizeClass(cardFace(choice.emoji), "text-6xl sm:text-7xl", "text-4xl sm:text-5xl")}
                    >
                      {cardFace(choice.emoji)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
