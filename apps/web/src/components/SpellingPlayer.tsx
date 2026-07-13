"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createSpellingGame,
  type Deck,
  type SpellingGame,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { recordAnswer } from "@/lib/client-container";
import { getSelectedKid } from "@/lib/kid";
import { useCombo } from "@/lib/use-combo";
import { DoneScreen } from "@/components/DoneScreen";
import { RachaBurst } from "@/components/RachaBurst";

interface Props {
  deck: Deck;
  accent: string;
}

const CELEBRATE_MS = 1400;

/** Deletrea: spell the pictured word by tapping letter tiles in order. */
export function SpellingPlayer({ deck, accent }: Props) {
  const [game, setGame] = useState<SpellingGame | null>(null);
  const [index, setIndex] = useState(0);
  /** Tile positions placed so far, in order. */
  const [placed, setPlaced] = useState<readonly number[]>([]);
  const [wrongTap, setWrongTap] = useState<{ tile: number; nonce: number } | null>(
    null,
  );
  const [celebrating, setCelebrating] = useState(false);
  const advanceTimer = useRef<number | null>(null);
  const wordMissed = useRef(false);
  const firstTries = useRef(0);
  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
    setGame(createSpellingGame(deck));
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, [deck]);

  const rounds = game?.rounds ?? [];
  const done = game !== null && index >= rounds.length;
  const round = rounds[index];

  function restart() {
    setGame(createSpellingGame(deck));
    setIndex(0);
    setPlaced([]);
    setWrongTap(null);
    setCelebrating(false);
    wordMissed.current = false;
    firstTries.current = 0;
    combo.reset();
  }

  function tap(tileIndex: number) {
    if (!round || celebrating || placed.includes(tileIndex)) {
      return;
    }
    const expected = round.word[placed.length];
    const letter = round.tiles[tileIndex];
    if (letter !== expected) {
      wordMissed.current = true;
      combo.wrong();
      setWrongTap((prev) => ({ tile: tileIndex, nonce: (prev?.nonce ?? 0) + 1 }));
      return;
    }
    const nowPlaced = [...placed, tileIndex];
    setPlaced(nowPlaced);
    setWrongTap(null);
    if (nowPlaced.length === round.word.length) {
      combo.correct();
      if (!wordMissed.current) {
        firstTries.current += 1;
      }
      const kid = getSelectedKid() ?? "reader";
      recordAnswer
        .execute(kid, round.card.id, !wordMissed.current)
        .catch((err: unknown) =>
          log.error("word-stats", "failed to record", { err }),
        );
      wordMissed.current = false;
      speakSpanish(round.card.spanish);
      setCelebrating(true);
      advanceTimer.current = window.setTimeout(() => {
        setIndex((i) => i + 1);
        setPlaced([]);
        setCelebrating(false);
      }, CELEBRATE_MS);
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
          ✏️
        </span>
      </header>

      {combo.racha !== null && !done && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}
      {done ? (
        <DoneScreen
          stickerDeckId={deck.id}
          activity="spelling"
          onReplay={restart}
          noAward
          firstTryCount={firstTries.current}
          totalRounds={rounds.length}
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
            <div className="flex items-center gap-4">
              <span
                aria-label={`Picture hint: ${round.card.english}`}
                className="text-7xl sm:text-8xl"
              >
                {round.card.emoji}
              </span>
              <button
                type="button"
                onClick={() => speakSpanish(round.card.spanish)}
                aria-label={`Hear the word (${round.card.english})`}
                className="sticker flex h-20 w-20 items-center justify-center text-4xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🔊
              </button>
            </div>

            <div
              aria-label="Your word so far"
              className={`sticker relative flex min-h-24 w-full max-w-md items-center justify-center gap-2 px-6 py-4 ${
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
              {[...round.word].map((_, slot) => {
                const tileIndex = placed[slot];
                const letter =
                  tileIndex === undefined ? null : round.tiles[tileIndex];
                return letter ? (
                  <span
                    key={slot}
                    className="pop-in text-4xl font-extrabold sm:text-5xl"
                  >
                    {letter}
                  </span>
                ) : (
                  <span
                    key={slot}
                    aria-hidden
                    className="h-4 w-8 rounded-full border-b-4 border-dashed border-ink/30"
                  />
                );
              })}
            </div>

            <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-3">
              {round.tiles.map((letter, tileIndex) => {
                const isPlaced = placed.includes(tileIndex);
                const isWrong = wrongTap?.tile === tileIndex;
                return (
                  <button
                    type="button"
                    key={`${round.card.id}-${tileIndex}-${isWrong ? wrongTap.nonce : 0}`}
                    onClick={() => tap(tileIndex)}
                    disabled={isPlaced}
                    aria-label={`Letter ${letter}${isPlaced ? " (placed)" : ""}`}
                    className={`sticker flex h-16 w-16 items-center justify-center text-3xl font-extrabold ${
                      isPlaced
                        ? "opacity-25"
                        : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                    } ${isWrong ? "wobble" : ""}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </section>

          <footer className="flex items-center justify-center pb-2">
            <div
              className="flex items-center gap-1.5"
              aria-label={`Word ${index + 1} of ${rounds.length}`}
            >
              {rounds.map((r, i) => (
                <span
                  key={r.card.id}
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
