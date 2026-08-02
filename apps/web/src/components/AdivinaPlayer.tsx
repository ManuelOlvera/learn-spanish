"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ADIVINA_GUESSES,
  ADIVINA_LEVELS,
  adivinaDifficulties,
  createAdivinaGame,
  isWon,
  scoreGuess,
  type AdivinaDifficulty,
  type AdivinaGame,
  type LetterMark,
  type VocabularyCard,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { recordAnswer } from "@/lib/client-container";
import { getSelectedKid } from "@/lib/kid";
import { useCombo } from "@/lib/use-combo";
import { feedbackMatch, feedbackWrong } from "@/lib/feedback";
import { DoneScreen } from "@/components/DoneScreen";

interface Props {
  groupId: string;
  groupNameSpanish: string;
  groupNameEnglish: string;
  groupEmoji: string;
  cards: readonly VocabularyCard[];
  accent: string;
}

const DIFFICULTY_META: Record<
  AdivinaDifficulty,
  { emoji: string; english: string }
> = {
  easy: { emoji: "🟢", english: "Easy" },
  medium: { emoji: "🟡", english: "Medium" },
  hard: { emoji: "🔴", english: "Hard" },
};

/** Wordle's three states. A miss is FILLED, not merely pale: an unplayed tile
 *  is also white, and a kid must be able to tell "I tried this and it's dead"
 *  from "I haven't got here yet" at a glance. */
const MARK_STYLE: Record<LetterMark, string> = {
  hit: "border-ink bg-[var(--color-lime)]",
  present: "border-ink bg-[#ffd166]",
  miss: "border-ink/40 bg-ink/20 text-ink/45",
};

/** Adivina la palabra: the wordle mechanic over a whole category. Guesses are
 *  tapped from the category's own words — a kid can't invent Spanish probe
 *  words, so the game is deduction over a known set. */
export function AdivinaPlayer({
  groupId,
  groupNameSpanish,
  groupNameEnglish,
  groupEmoji,
  cards,
  accent,
}: Props) {
  const [difficulty, setDifficulty] = useState<AdivinaDifficulty | null>(null);
  // The target is random — drawn client-side only (hydration).
  const [game, setGame] = useState<AdivinaGame | null>(null);
  const [guesses, setGuesses] = useState<readonly string[]>([]);
  const [finished, setFinished] = useState(false);

  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
  }, []);

  const offered = adivinaDifficulties(cards);
  const rows = guesses.map((guess) => ({
    guess,
    marks: game ? scoreGuess(guess, game.target.word) : [],
  }));
  const won = rows.some((row) => isWon(row.marks));
  const over = won || guesses.length >= ADIVINA_GUESSES;

  function start(level: AdivinaDifficulty) {
    setDifficulty(level);
    setGame(createAdivinaGame(groupId, cards, level));
    setGuesses([]);
    setFinished(false);
    combo.reset();
  }

  function restart() {
    if (difficulty !== null) {
      start(difficulty);
    }
  }

  function guess(word: string) {
    if (game === null || over || guesses.includes(word)) {
      return;
    }
    const next = [...guesses, word];
    setGuesses(next);
    const marks = scoreGuess(word, game.target.word);
    const kid = getSelectedKid() ?? "reader";

    if (isWon(marks)) {
      feedbackMatch();
      combo.correct();
      speakSpanish(game.target.card.spanish);
      recordAnswer
        .execute(kid, game.target.card.id, next.length <= 3)
        .catch((err: unknown) =>
          log.error("word-stats", "failed to record", { err }),
        );
      return;
    }

    feedbackWrong();
    combo.wrong();
    if (next.length >= ADIVINA_GUESSES) {
      // Out of guesses: say the answer, so a loss still teaches the word.
      speakSpanish(game.target.card.spanish);
      recordAnswer
        .execute(kid, game.target.card.id, false)
        .catch((err: unknown) =>
          log.error("word-stats", "failed to record", { err }),
        );
    }
  }

  const backHref = `/group/${groupId}`;

  return (
    <main
      style={{ "--accent": accent } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href={backHref}
          aria-label={`Back to ${groupNameEnglish}`}
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          🔡
        </span>
      </header>

      {difficulty === null || game === null ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
          <p className="pop-in text-2xl font-extrabold text-ink/70 sm:text-3xl">
            ¿De cuántas letras?
          </p>
          <div className="flex w-full max-w-md flex-col gap-5">
            {offered.map((level, i) => (
              <button
                key={level}
                type="button"
                onClick={() => start(level)}
                aria-label={`${DIFFICULTY_META[level].english} — words of ${ADIVINA_LEVELS[level]} letters`}
                className="sticker pop-in flex items-center justify-between gap-4 p-4 active:translate-x-1 active:translate-y-1 active:shadow-none"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="flex items-center gap-3">
                  <span aria-hidden className="text-4xl">
                    {DIFFICULTY_META[level].emoji}
                  </span>
                  <span className="text-2xl font-extrabold">
                    {ADIVINA_LEVELS[level]} letras
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : finished ? (
        <DoneScreen
          stickerDeckId={groupId}
          activity="adivina"
          onReplay={restart}
          noAward
          firstTryCount={won ? ADIVINA_GUESSES - guesses.length + 1 : 0}
          mistakeCount={won ? 0 : 1}
          totalRounds={ADIVINA_GUESSES}
          back={{
            href: backHref,
            emoji: groupEmoji,
            label: `More in ${groupNameEnglish}`,
          }}
        />
      ) : (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-5 py-4">
            <h1 className="sr-only">
              Adivina la palabra — {groupNameSpanish}
            </h1>

            {/* The board: one row per guess made, then empty rows. */}
            <div className="flex flex-col gap-2" aria-label="Your guesses">
              {Array.from({ length: ADIVINA_GUESSES }, (_, row) => {
                const played = rows[row];
                return (
                  <div key={row} className="flex gap-2">
                    {Array.from(
                      { length: ADIVINA_LEVELS[difficulty] },
                      (_, col) => {
                        const letter = played?.guess[col];
                        const mark = played?.marks[col];
                        return (
                          <span
                            key={col}
                            aria-label={
                              played
                                ? `${letter}: ${
                                    mark === "hit"
                                      ? "right letter, right place"
                                      : mark === "present"
                                        ? "right letter, wrong place"
                                        : "not in the word"
                                  }`
                                : undefined
                            }
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border-4 text-2xl font-extrabold sm:h-14 sm:w-14 sm:text-3xl ${
                              played
                                ? `pop-in ${MARK_STYLE[mark ?? "miss"]}`
                                : "border-dashed border-ink/25 bg-white"
                            }`}
                          >
                            {letter ?? ""}
                          </span>
                        );
                      },
                    )}
                  </div>
                );
              })}
            </div>

            {over ? (
              <div className="pop-in flex flex-col items-center gap-3">
                <p className="text-3xl font-extrabold">
                  {won ? "¡Sí!" : game.target.word}
                </p>
                <button
                  type="button"
                  onClick={() => speakSpanish(game.target.card.spanish)}
                  aria-label={`Hear the word (${game.target.card.english})`}
                  className="sticker flex items-center gap-3 px-5 py-3 text-2xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <span aria-hidden className="text-4xl">
                    {game.target.card.emoji}
                  </span>
                  🔊
                </button>
                <button
                  type="button"
                  onClick={() => setFinished(true)}
                  aria-label="Finish and collect your stars"
                  className="sticker flex h-20 w-20 items-center justify-center text-4xl active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  ⭐
                </button>
              </div>
            ) : (
              /* The guess list: the category's own words, tapped not typed. */
              <div
                className="flex w-full max-w-lg flex-wrap items-center justify-center gap-2"
                aria-label="Words you can guess"
              >
                {game.pool.map((entry) => {
                  const used = guesses.includes(entry.word);
                  return (
                    <button
                      type="button"
                      key={entry.word}
                      onClick={() => guess(entry.word)}
                      disabled={used}
                      aria-label={`Guess ${entry.word}${used ? " (already tried)" : ""}`}
                      className={`sticker px-3 py-2 text-lg font-extrabold sm:text-xl ${
                        used
                          ? "opacity-25"
                          : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                      }`}
                    >
                      {entry.word}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="flex items-center justify-center pb-2">
            <span className="text-sm font-bold text-ink/40">
              {guesses.length}/{ADIVINA_GUESSES}
            </span>
          </footer>
        </>
      )}
    </main>
  );
}
