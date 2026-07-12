"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createMemoryGame,
  tilesMatch,
  MEMORY_DIFFICULTIES,
  MEMORY_PAIR_COUNT,
  type Deck,
  type MemoryGame,
  type MemoryMode,
  type MemoryDifficulty,
  type MemoryTile,
} from "@learn-spanish/core";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { feedbackMatch, feedbackWrong } from "@/lib/feedback";
import { DoneScreen } from "@/components/DoneScreen";

interface Props {
  deck: Deck;
  mode: MemoryMode;
  accent: string;
}

const FLIP_BACK_MS = 950;

/** Board-size levels, shown as pictures alone so a pre-reader can pick. */
const DIFFICULTY_META: Record<
  MemoryDifficulty,
  { emoji: string; spanish: string; english: string }
> = {
  easy: { emoji: "🟢", spanish: "Fácil", english: "Easy" },
  medium: { emoji: "🟡", spanish: "Medio", english: "Medium" },
  hard: { emoji: "🔴", spanish: "Difícil", english: "Hard" },
};

export function MemoryPlayer({ deck, mode, accent }: Props) {
  // Board size is picked per play; until then, show the difficulty chooser.
  const [difficulty, setDifficulty] = useState<MemoryDifficulty | null>(null);
  // The layout is random, so the board is built client-side only (hydration).
  const [game, setGame] = useState<MemoryGame | null>(null);
  const [flipped, setFlipped] = useState<readonly MemoryTile[]>([]);
  const [matched, setMatched] = useState<ReadonlySet<string>>(new Set());
  const [missNonce, setMissNonce] = useState(0);
  const misses = useRef(0);
  const flipBackTimer = useRef<number | null>(null);

  useEffect(() => {
    warmUpVoices();
    return () => {
      if (flipBackTimer.current !== null) {
        window.clearTimeout(flipBackTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (difficulty === null) {
      setGame(null);
      return;
    }
    setGame(createMemoryGame(deck, mode, difficulty));
    setFlipped([]);
    setMatched(new Set());
    setMissNonce(0);
    misses.current = 0;
  }, [deck, mode, difficulty]);

  const tiles = game?.tiles ?? [];
  const done = game !== null && matched.size === tiles.length && tiles.length > 0;

  function restart() {
    if (difficulty === null) return;
    setGame(createMemoryGame(deck, mode, difficulty));
    setFlipped([]);
    setMatched(new Set());
    setMissNonce(0);
    misses.current = 0;
  }

  function flip(tile: MemoryTile) {
    // Two tiles up = board is resolving a miss; ignore taps until it clears.
    if (flipped.length === 2 || matched.has(tile.id)) {
      return;
    }
    if (flipped.some((t) => t.id === tile.id)) {
      return;
    }
    // Pre-readers get the word on every flip; readers only on a match,
    // so the written word has to be read first.
    if (mode === "pictures") {
      speakSpanish(tile.card.spanish);
    }

    const [first] = flipped;
    if (!first) {
      setFlipped([tile]);
      return;
    }

    if (tilesMatch(first, tile)) {
      setMatched((prev) => new Set([...prev, first.id, tile.id]));
      setFlipped([]);
      feedbackMatch();
      if (mode === "words") {
        speakSpanish(tile.card.spanish);
      }
    } else {
      setFlipped([first, tile]);
      feedbackWrong();
      misses.current += 1;
      setMissNonce((n) => n + 1);
      flipBackTimer.current = window.setTimeout(() => {
        setFlipped([]);
      }, FLIP_BACK_MS);
    }
  }

  const columns =
    mode === "pictures"
      ? "grid-cols-2 sm:grid-cols-4"
      : "grid-cols-3 sm:grid-cols-4";

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

      {difficulty === null ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
          <p className="pop-in text-2xl font-extrabold text-ink/70 sm:text-3xl">
            ¿Cuántas parejas?
          </p>
          <div className="flex w-full max-w-md flex-col gap-5">
            {MEMORY_DIFFICULTIES.map((level, i) => {
              const meta = DIFFICULTY_META[level];
              const pairs = MEMORY_PAIR_COUNT[level];
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  aria-label={`${meta.english} — ${pairs} pairs`}
                  className="sticker pop-in flex items-center justify-between gap-4 p-4 active:translate-x-1 active:translate-y-1 active:shadow-none"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="flex items-center gap-3">
                    <span aria-hidden className="text-5xl">
                      {meta.emoji}
                    </span>
                    <span className="text-2xl font-extrabold sm:text-3xl">
                      {meta.spanish}
                    </span>
                  </span>
                  {/* Board size as dots, so it reads without letters. */}
                  <span aria-hidden className="flex max-w-[7rem] flex-wrap justify-end gap-1">
                    {Array.from({ length: pairs }).map((_, d) => (
                      <span
                        key={d}
                        className="h-3 w-3 rounded-full bg-ink/30"
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : done ? (
        <DoneScreen
          stickerDeckId={deck.id}
          activity={mode === "pictures" ? "match-pictures" : "match-words"}
          onReplay={restart}
          firstTryCount={Math.max(0, tiles.length / 2 - misses.current)}
          back={{
            href: `/deck/${deck.id}`,
            emoji: deck.emoji,
            label: `More games in ${deck.nameEnglish}`,
          }}
        />
      ) : tiles.length === 0 ? (
        <section className="flex-1" aria-hidden />
      ) : (
        <section className="flex flex-1 items-center justify-center">
          <div className={`grid w-full gap-4 ${columns}`}>
            {tiles.map((tile) => {
              const isMatched = matched.has(tile.id);
              const isUp = isMatched || flipped.some((t) => t.id === tile.id);
              const isMissed = !isMatched && flipped.length === 2 && isUp;
              return (
                <button
                  type="button"
                  key={`${tile.id}-${isMissed ? missNonce : 0}`}
                  onClick={() => flip(tile)}
                  aria-label={isUp ? tile.card.english : "Flip tile"}
                  className={`sticker flex aspect-square items-center justify-center p-2 active:translate-x-1 active:translate-y-1 active:shadow-none ${
                    isMissed ? "wobble" : isMatched ? "pop-in" : ""
                  }`}
                  style={
                    isMatched
                      ? ({
                          "--sticker-face": "var(--color-lime)",
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {isUp ? (
                    tile.face === "picture" ? (
                      <span aria-hidden className="text-5xl sm:text-6xl">
                        {tile.card.emoji}
                      </span>
                    ) : (
                      <span className="break-words text-center text-xl font-extrabold sm:text-2xl">
                        {tile.card.spanish}
                      </span>
                    )
                  ) : (
                    <span aria-hidden className="text-5xl text-ink/30 sm:text-6xl">
                      ❓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
