"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createSopaGame,
  findSopaWord,
  kidForActivity,
  lineBetween,
  SOPA_BOARDS,
  sopaDifficulties,
  type Deck,
  type SopaDifficulty,
  type SopaGame,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { recordAnswer } from "@/lib/client-container";
import { getSelectedKid } from "@/lib/kid";
import { useCombo } from "@/lib/use-combo";
import { feedbackMatch } from "@/lib/feedback";
import { DoneScreen } from "@/components/DoneScreen";
import { RachaBurst } from "@/components/RachaBurst";
import { mixSopaColors, sopaWordColor } from "@/lib/sopa-colors";
import { CardFace } from "./CardFace";

interface Props {
  deck: Deck;
  accent: string;
}

const DIFFICULTY_META: Record<
  SopaDifficulty,
  { emoji: string; english: string }
> = {
  easy: { emoji: "🟢", english: "Easy" },
  medium: { emoji: "🟡", english: "Medium" },
  hard: { emoji: "🔴", english: "Hard" },
};

/** La sopa de letras: deck words hidden in a letter grid — tap the first and
 *  last letter of a word to find it. Reader-level (finding a written word IS
 *  reading), so the whole screen may carry text. */
export function SopaPlayer({ deck, accent }: Props) {
  const [difficulty, setDifficulty] = useState<SopaDifficulty | null>(null);
  // Board layout is random — built client-side only (hydration).
  const [game, setGame] = useState<SopaGame | null>(null);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [foundIds, setFoundIds] = useState<readonly string[]>([]);
  // Which found words own each cell, by their index in `game.words`. A list,
  // not one owner: two words may legally cross on a shared letter, and that
  // cell is painted with both of them mixed.
  const [cellOwners, setCellOwners] = useState<
    ReadonlyMap<number, readonly number[]>
  >(new Map());
  const [wrongNonce, setWrongNonce] = useState(0);
  const [missedSinceFind, setMissedSinceFind] = useState(false);
  const [firstTries, setFirstTries] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
  }, []);

  const offered = sopaDifficulties(deck);
  const done = game !== null && foundIds.length === game.words.length;

  function start(level: SopaDifficulty) {
    setDifficulty(level);
    setGame(createSopaGame(deck, level));
    setAnchor(null);
    setFoundIds([]);
    setCellOwners(new Map());
    setMissedSinceFind(false);
    setFirstTries(0);
    setMistakes(0);
    combo.reset();
  }

  function restart() {
    if (difficulty !== null) {
      start(difficulty);
    }
  }

  function tap(index: number) {
    // A found cell stays tappable: shared letters belong to more than one
    // word, so a letter locked by the word already found must still be able
    // to anchor or close the next one.
    if (game === null || done) {
      return;
    }
    if (anchor === null || anchor === index) {
      setAnchor(anchor === index ? null : index);
      return;
    }
    const line = lineBetween(game.size, anchor, index);
    if (line === null) {
      // A bent pick is almost always a re-aim, not an answer — just re-anchor.
      setAnchor(index);
      return;
    }
    const word = findSopaWord(game, line, foundIds);
    setAnchor(null);
    if (word === null) {
      // combo.wrong() plays the buzzer itself; calling it here as well made
      // the sopa's miss twice as loud as every other game's.
      combo.wrong();
      setMissedSinceFind(true);
      setMistakes((n) => n + 1);
      setWrongNonce((n) => n + 1);
      return;
    }
    feedbackMatch();
    combo.correct();
    speakSpanish(word.card.spanish);
    setFoundIds((prev) => [...prev, word.card.id]);
    const owner = game.words.indexOf(word);
    setCellOwners((prev) => {
      const next = new Map(prev);
      for (const cell of line) {
        next.set(cell, [...(next.get(cell) ?? []), owner]);
      }
      return next;
    });
    if (!missedSinceFind) {
      setFirstTries((n) => n + 1);
    }
    setMissedSinceFind(false);
    const kid = getSelectedKid() ?? kidForActivity("sopa") ?? "reader";
    recordAnswer
      .execute({
        kid,
        cardId: word.card.id,
        correct: !missedSinceFind,
        activity: "sopa",
      })
      .catch((err: unknown) =>
        log.error("word-stats", "failed to record", { err }),
      );
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
          🥣
        </span>
      </header>

      {combo.racha !== null && !done && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}
      {difficulty === null || game === null ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
          <p className="pop-in text-2xl font-extrabold text-ink/70 sm:text-3xl">
            ¿Cuántas palabras?
          </p>
          <div className="flex w-full max-w-md flex-col gap-5">
            {offered.map((level, i) => {
              const meta = DIFFICULTY_META[level];
              const board = SOPA_BOARDS[level];
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => start(level)}
                  aria-label={`${meta.english} — ${board.words} words in a ${board.size} by ${board.size} grid`}
                  className="sticker pop-in flex items-center justify-between gap-4 p-4 active:translate-x-1 active:translate-y-1 active:shadow-none"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="flex items-center gap-3">
                    <span aria-hidden className="text-4xl">
                      {meta.emoji}
                    </span>
                    <span className="text-2xl font-extrabold">
                      {board.words} palabras
                    </span>
                  </span>
                  <span aria-hidden className="text-lg font-bold text-ink/40">
                    {board.size}×{board.size}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : done ? (
        <DoneScreen
          stickerDeckId={deck.id}
          deck={deck}
          activity="sopa"
          onReplay={restart}
          noAward
          firstTryCount={firstTries}
          mistakeCount={mistakes}
          totalRounds={game.words.length}
          back={{
            href: `/deck/${deck.id}`,
            emoji: deck.emoji,
            label: `More games in ${deck.nameEnglish}`,
          }}
        />
      ) : (
        <>
          <section className="flex flex-wrap items-center justify-center gap-2 py-3">
            {game.words.map((word, wordIndex) => {
              const found = foundIds.includes(word.card.id);
              const color = sopaWordColor(wordIndex);
              return (
                <span
                  key={word.card.id}
                  aria-label={
                    found
                      ? `${word.card.spanish} — found`
                      : `Find ${word.card.spanish}`
                  }
                  // The chip wears its word's colour before it is found, not
                  // only after: that is what lets the kid look at a coloured
                  // run of letters and say which word it is. Finding it fills
                  // the whole chip with the same colour.
                  className="inline-flex items-center gap-1 rounded-full border-2 border-ink px-3 py-1 text-lg font-extrabold"
                  style={{ backgroundColor: found ? color : "#fff" }}
                >
                  {!found && (
                    <span
                      aria-hidden
                      className="h-3 w-3 rounded-full border-2 border-ink"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  {found && (
                    <CardFace
                      image={word.card.image}
                      face={word.card.emoji}
                      single="text-lg"
                      wide="text-lg"
                    />
                  )}
                  {word.card.spanish}
                </span>
              );
            })}
          </section>

          <section className="flex flex-1 items-center justify-center">
            <div
              key={wrongNonce}
              className={`sticker relative w-full p-3 sm:p-4 ${wrongNonce > 0 ? "wobble" : "pop-in"}`}
            >
              <span aria-hidden className="sticker-peel" />
              <div
                role="grid"
                aria-label="The letter grid"
                className="grid gap-1 sm:gap-1.5"
                style={{ gridTemplateColumns: `repeat(${game.size}, minmax(0, 1fr))` }}
              >
                {game.grid.map((letter, index) => {
                  const isAnchor = anchor === index;
                  // Anchor wins over found: a shared letter re-selected to seed
                  // the next word must show the selection, not its own colour.
                  const owners = isAnchor ? [] : (cellOwners.get(index) ?? []);
                  // One owner paints its word's colour; two paint their mix,
                  // so a crossing letter belongs visibly to both words.
                  const found = mixSopaColors(owners.map(sopaWordColor));
                  return (
                    <button
                      type="button"
                      key={index}
                      onClick={() => tap(index)}
                      aria-label={`Letter ${letter}${isAnchor ? " (selected)" : ""}`}
                      className={`flex aspect-square items-center justify-center rounded-lg border-2 border-ink text-xl font-extrabold sm:rounded-xl sm:text-3xl ${
                        found === null && !isAnchor
                          ? "bg-white active:translate-y-0.5"
                          : ""
                      }`}
                      style={
                        found !== null
                          ? { backgroundColor: found }
                          : isAnchor
                            ? { backgroundColor: "var(--accent)" }
                            : undefined
                      }
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-center pb-2 pt-3">
            <p className="text-base font-semibold text-ink/50">
              {foundIds.length} / {game.words.length}
            </p>
          </footer>
        </>
      )}
    </main>
  );
}
