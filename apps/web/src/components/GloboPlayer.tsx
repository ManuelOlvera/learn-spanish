"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createGloboGame,
  GLOBO_ALPHABET,
  GLOBO_LEVELS,
  GLOBO_LIVES,
  globoDifficulties,
  isSolved,
  livesLeft,
  revealed,
  type Deck,
  type GloboDifficulty,
  type GloboGame,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { recordAnswer } from "@/lib/client-container";
import { getSelectedKid } from "@/lib/kid";
import { useCombo } from "@/lib/use-combo";
import {
  feedbackAirOut,
  feedbackInflate,
  feedbackMatch,
  feedbackPop,
} from "@/lib/feedback";
import { Balloon } from "@/components/Balloon";
import { DoneScreen } from "@/components/DoneScreen";
import { RachaBurst } from "@/components/RachaBurst";
import { CardFace } from "./CardFace";

interface Props {
  deck: Deck;
  accent: string;
}

const DIFFICULTY_META: Record<
  GloboDifficulty,
  { emoji: string; english: string; spanish: string }
> = {
  easy: { emoji: "🟢", english: "Easy", spanish: "Cortas" },
  medium: { emoji: "🟡", english: "Medium", spanish: "Medianas" },
  hard: { emoji: "🔴", english: "Hard", spanish: "Largas" },
};

const CELEBRATE_MS = 1600;

/** El globo (the ahorcado mechanic): guess the word letter by letter before
 *  the balloon runs out of air. Reader-level — the picture is hidden behind
 *  a tip that costs a life, because seeing it gives the answer away. */
export function GloboPlayer({ deck, accent }: Props) {
  const [difficulty, setDifficulty] = useState<GloboDifficulty | null>(null);
  // Word choice is random — built client-side only (hydration).
  const [game, setGame] = useState<GloboGame | null>(null);
  const [index, setIndex] = useState(0);
  const [guessed, setGuessed] = useState<readonly string[]>([]);
  const [tipTaken, setTipTaken] = useState(false);
  /** Set while the round's outcome is on screen, before the next word. */
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);
  /** One entry per finished round — drives the footer dots. */
  const [results, setResults] = useState<readonly ("won" | "lost")[]>([]);
  const [cleanCount, setCleanCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  /** Bumped per run so replaying the same level still re-inflates. */
  const [runId, setRunId] = useState(0);
  const advanceTimer = useRef<number | null>(null);
  // The balloon does the talking: air escaping, then the pop.
  const combo = useCombo({ wrongSound: false });

  useEffect(() => {
    warmUpVoices();
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, []);

  const offered = globoDifficulties(deck);
  const rounds = game?.rounds ?? [];
  const round = rounds[index];
  const done = game !== null && index >= rounds.length;
  const lives = round ? livesLeft(round.word, guessed, tipTaken) : GLOBO_LIVES;

  // A fresh balloon fills at the start of every round — null on the picker
  // and the done screen, so neither makes a sound.
  const roundKey = round ? `${runId}-${index}` : null;
  useEffect(() => {
    if (roundKey !== null) {
      feedbackInflate();
    }
  }, [roundKey]);

  function start(level: GloboDifficulty) {
    setDifficulty(level);
    setRunId((n) => n + 1);
    setGame(createGloboGame(deck, level));
    setIndex(0);
    setGuessed([]);
    setTipTaken(false);
    setOutcome(null);
    setResults([]);
    setCleanCount(0);
    setMistakes(0);
    combo.reset();
  }

  function restart() {
    if (difficulty !== null) {
      start(difficulty);
    }
  }

  function finishRound(result: "won" | "lost", card: { id: string }) {
    setOutcome(result);
    setResults((prev) => [...prev, result]);
    const kid = getSelectedKid() ?? "reader";
    recordAnswer
      .execute({
        kid,
        cardId: card.id,
        correct: result === "won",
        activity: "globo",
      })
      .catch((err: unknown) =>
        log.error("word-stats", "failed to record", { err }),
      );
    advanceTimer.current = window.setTimeout(() => {
      setIndex((i) => i + 1);
      setGuessed([]);
      setTipTaken(false);
      setOutcome(null);
    }, CELEBRATE_MS);
  }

  function guess(letter: string) {
    if (!round || outcome !== null || guessed.includes(letter)) {
      return;
    }
    const next = [...guessed, letter];
    setGuessed(next);

    if (!round.word.includes(letter)) {
      combo.wrong();
      setMistakes((n) => n + 1);
      if (livesLeft(round.word, next, tipTaken) === 0) {
        feedbackPop();
        speakSpanish(round.card.spanish);
        finishRound("lost", round.card);
      } else {
        feedbackAirOut();
      }
      return;
    }

    feedbackMatch();
    if (isSolved(round.word, next)) {
      combo.correct();
      // "Clean" = solved on the letters alone: no wrong guess, no tip taken.
      if (livesLeft(round.word, next, tipTaken) === GLOBO_LIVES) {
        setCleanCount((n) => n + 1);
      }
      speakSpanish(round.card.spanish);
      finishRound("won", round.card);
    }
  }

  function takeTip() {
    if (!round || tipTaken || outcome !== null) {
      return;
    }
    setTipTaken(true);
    // The tip costs the last breath only if it was the last one available;
    // spending it into a pop still reveals the word, like a wrong letter.
    if (livesLeft(round.word, guessed, true) === 0) {
      feedbackPop();
      speakSpanish(round.card.spanish);
      finishRound("lost", round.card);
    } else {
      feedbackAirOut();
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
          🎈
        </span>
      </header>

      {combo.racha !== null && !done && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}

      {difficulty === null || game === null ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
          <p className="pop-in text-2xl font-extrabold text-ink/70 sm:text-3xl">
            ¿Palabras cortas o largas?
          </p>
          <div className="flex w-full max-w-md flex-col gap-5">
            {offered.map((level, i) => {
              const meta = DIFFICULTY_META[level];
              const band = GLOBO_LEVELS[level];
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => start(level)}
                  aria-label={`${meta.english} — words of ${band.min} to ${band.max} letters, tip shows the ${band.tip}`}
                  className="sticker pop-in flex items-center justify-between gap-4 p-4 active:translate-x-1 active:translate-y-1 active:shadow-none"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="flex items-center gap-3">
                    <span aria-hidden className="text-4xl">
                      {meta.emoji}
                    </span>
                    <span className="text-2xl font-extrabold">
                      {meta.spanish}
                    </span>
                  </span>
                  <span aria-hidden className="text-lg font-bold text-ink/40">
                    {band.min}–{band.max}
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
          activity="globo"
          onReplay={restart}
          noAward
          firstTryCount={cleanCount}
          mistakeCount={mistakes}
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
          <section className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className={outcome === "lost" ? "wobble" : ""}>
              <Balloon lives={lives} />
            </div>

            {/* The word: blanks until guessed, fully revealed once the
                balloon pops so the kid still learns the answer. */}
            <div
              aria-label="The word so far"
              className={`sticker relative flex min-h-20 w-full max-w-md flex-wrap items-center justify-center gap-2 px-5 py-4 ${
                outcome === "won" ? "pop-in" : ""
              }`}
              style={
                outcome === "won"
                  ? ({
                      "--sticker-face": "var(--color-lime)",
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <span aria-hidden className="sticker-peel" />
              {revealed(round.word, guessed).map((letter, slot) => {
                const show = letter ?? (outcome === "lost" ? round.word[slot] : null);
                return show ? (
                  <span
                    key={slot}
                    className={`text-4xl font-extrabold sm:text-5xl ${
                      letter === null ? "text-ink/40" : "pop-in"
                    }`}
                  >
                    {show}
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

            {/* The tip: the picture on easy, the English meaning otherwise.
                Costs a breath of air, so it is a trade, not a freebie. */}
            {tipTaken ? (
              <p className="pop-in flex items-center gap-3 text-2xl font-extrabold">
                {game.tip === "picture" ? (
                  <span role="img" aria-label={`Picture tip: ${round.card.english}`}>
                    <CardFace
                      image={round.card.image}
                      face={round.card.emoji}
                      single="text-6xl"
                      wide="text-6xl"
                    />
                  </span>
                ) : (
                  <span aria-label={`Meaning tip: ${round.card.english}`}>
                    💡 {round.card.english}
                  </span>
                )}
              </p>
            ) : (
              <button
                type="button"
                onClick={takeTip}
                disabled={outcome !== null}
                aria-label={
                  game.tip === "picture"
                    ? "Tip: show the picture — costs one breath of air"
                    : "Tip: show what it means in English — costs one breath of air"
                }
                className={`sticker flex items-center gap-2 px-5 py-3 text-xl font-extrabold ${
                  outcome !== null
                    ? "opacity-40"
                    : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                }`}
              >
                <span aria-hidden>💡</span> Una pista
                <span aria-hidden className="text-base text-ink/40">
                  −1 💨
                </span>
              </button>
            )}

            {/* Dimmed while the round's outcome is on screen: the keys are
                disabled then, and they must look it. */}
            <div
              className={`flex w-full max-w-md flex-wrap items-center justify-center gap-2 ${
                outcome !== null ? "opacity-40" : ""
              }`}
            >
              {GLOBO_ALPHABET.map((letter) => {
                const used = guessed.includes(letter);
                const hit = used && round.word.includes(letter);
                return (
                  <button
                    type="button"
                    key={letter}
                    onClick={() => guess(letter)}
                    disabled={used || outcome !== null}
                    aria-label={`Letter ${letter}${
                      used ? (hit ? " (in the word)" : " (not in the word)") : ""
                    }`}
                    className={`sticker flex h-12 w-12 items-center justify-center text-2xl font-extrabold sm:h-14 sm:w-14 ${
                      used
                        ? hit
                          ? "opacity-40"
                          : "opacity-20"
                        : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                    }`}
                    style={
                      hit
                        ? ({
                            "--sticker-face": "var(--color-lime)",
                          } as React.CSSProperties)
                        : undefined
                    }
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
                    results[i] === "won"
                      ? "bg-[var(--accent)]"
                      : results[i] === "lost"
                        ? "bg-ink/25"
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
