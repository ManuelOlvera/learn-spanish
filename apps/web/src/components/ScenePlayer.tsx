"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createSceneGame,
  kidForActivity,
  sceneQuestion,
  type Deck,
  type QuizMode,
  type SceneGame,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { recordAnswer } from "@/lib/album";
import { getSelectedKid } from "@/lib/kid";
import { useCombo } from "@/lib/use-combo";
import { DoneScreen } from "@/components/DoneScreen";
import { RachaBurst } from "@/components/RachaBurst";

interface Props {
  deck: Deck;
  mode: QuizMode;
  accent: string;
}

const FOUND_MS = 1000;

/** Busca y toca: a busy board of pictures; hunt the one the app asks for. */
export function ScenePlayer({ deck, mode, accent }: Props) {
  // Layout and rounds are random — built client-side only (hydration).
  const [game, setGame] = useState<SceneGame | null>(null);
  const [index, setIndex] = useState(0);
  const [foundId, setFoundId] = useState<string | null>(null);
  const [wrongTap, setWrongTap] = useState<{ id: string; nonce: number } | null>(
    null,
  );
  const advanceTimer = useRef<number | null>(null);
  const roundMissed = useRef(false);
  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
    setGame(createSceneGame(deck, mode));
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, [deck, mode]);

  const rounds = game?.rounds ?? [];
  const done = game !== null && index >= rounds.length;
  const target = rounds[index];

  function restart() {
    setGame(createSceneGame(deck, mode));
    setIndex(0);
    setFoundId(null);
    setWrongTap(null);
    roundMissed.current = false;
    combo.reset();
  }

  function tap(cardId: string) {
    if (!target || foundId !== null) {
      return;
    }
    if (cardId === target.id) {
      setFoundId(cardId);
      setWrongTap(null);
      combo.correct();
      const kid =
        getSelectedKid() ??
        kidForActivity(mode === "listen" ? "scene-listen" : "scene-read") ??
        "listener";
      recordAnswer
        .execute(kid, target.id, !roundMissed.current)
        .catch((err: unknown) =>
          log.error("word-stats", "failed to record", { err }),
        );
      roundMissed.current = false;
      speakSpanish(target.spanish);
      advanceTimer.current = window.setTimeout(() => {
        setIndex((i) => i + 1);
        setFoundId(null);
      }, FOUND_MS);
    } else {
      roundMissed.current = true;
      combo.wrong();
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

      {combo.racha !== null && !done && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}
      {done ? (
        <DoneScreen
          stickerDeckId={deck.id}
          activity={mode === "listen" ? "scene-listen" : "scene-read"}
          onReplay={restart}
          back={{
            href: `/deck/${deck.id}`,
            emoji: deck.emoji,
            label: `More games in ${deck.nameEnglish}`,
          }}
        />
      ) : !target || !game ? (
        <section className="flex-1" aria-hidden />
      ) : (
        <>
          <section className="flex flex-col items-center gap-4 py-3">
            {mode === "listen" ? (
              <button
                type="button"
                onClick={() => speakSpanish(sceneQuestion(target))}
                aria-label={`Hear who to find (${target.english})`}
                className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔊
              </button>
            ) : (
              <div
                key={target.id}
                className="sticker pop-in relative flex w-full max-w-md items-center justify-center px-6 py-4"
              >
                <span aria-hidden className="sticker-peel" />
                <span className="text-3xl font-extrabold sm:text-4xl">
                  {sceneQuestion(target)}
                </span>
              </div>
            )}
          </section>

          <section className="flex flex-1 items-stretch">
            <div className="sticker relative w-full" aria-label="The scene">
              {game.items.map((item) => {
                const isFound = foundId === item.card.id;
                const isWrong = wrongTap?.id === item.card.id;
                return (
                  <button
                    type="button"
                    key={`${item.card.id}-${isWrong ? wrongTap.nonce : 0}`}
                    onClick={() => tap(item.card.id)}
                    aria-label={`Scene item ${item.card.english}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 text-5xl transition-transform sm:text-6xl ${
                      isFound ? "pop-in scale-125" : isWrong ? "wobble" : ""
                    }`}
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  >
                    <span
                      className={
                        isFound
                          ? "rounded-full bg-[var(--color-lime)] p-1 shadow-[0_0_0_4px_var(--color-ink)]"
                          : ""
                      }
                    >
                      {item.card.emoji}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <footer className="flex items-center justify-center pb-2 pt-3">
            <div
              className="flex flex-wrap items-center gap-1.5"
              aria-label={`Round ${index + 1} of ${rounds.length}`}
            >
              {rounds.map((r, i) => (
                <span
                  key={r.id}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i < index || (i === index && foundId !== null)
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
