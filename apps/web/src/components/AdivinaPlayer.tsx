"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ADIVINA_GUESSES,
  ADIVINA_LEVELS,
  ADIVINA_TIPS,
  adivinaDifficulties,
  guessesLeft,
  revealTipIndex,
  type AdivinaTip,
  createAdivinaGame,
  isRealWord,
  isWon,
  keyboardMarks,
  scoreGuess,
  SPANISH_ALPHABET,
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
  /** The shelf's cards — where the answer comes from. */
  cards: readonly VocabularyCard[];
  /** Every card in the pack — what a typed guess is allowed to be. */
  packCards: readonly VocabularyCard[];
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
/** The tip tray, weakest first. Each costs one of the six guesses. */
const TIP_META: Record<AdivinaTip, { glyph: string; spanish: string; english: string }> = {
  meaning: { glyph: "💬", spanish: "En inglés", english: "the English meaning" },
  picture: { glyph: "🖼️", spanish: "La foto", english: "the picture" },
  first: { glyph: "🔤", spanish: "1ª letra", english: "the first letter" },
  letter: { glyph: "✨", spanish: "Una letra", english: "one more letter" },
};

const MARK_STYLE: Record<LetterMark, string> = {
  hit: "border-ink bg-[var(--color-lime)]",
  present: "border-ink bg-[#ffd166]",
  miss: "border-ink/40 bg-ink/20 text-ink/45",
};

/** Adivina la palabra: wordle. The kid types the word on a Spanish keyboard;
 *  a word the app doesn't know can't be submitted, so a spelling attempt is
 *  never silently wasted as one of the six guesses. */
export function AdivinaPlayer({
  groupId,
  groupNameSpanish,
  groupNameEnglish,
  groupEmoji,
  cards,
  packCards,
  accent,
}: Props) {
  const [difficulty, setDifficulty] = useState<AdivinaDifficulty | null>(null);
  // The target is random — drawn client-side only (hydration).
  const [game, setGame] = useState<AdivinaGame | null>(null);
  const [guesses, setGuesses] = useState<readonly string[]>([]);
  /** The word being typed, not yet submitted. */
  const [typed, setTyped] = useState("");
  /** Bumped to replay the "I don't know that word" shake. */
  const [rejected, setRejected] = useState(0);
  /** Tips bought this round, in order — each one costs a guess. */
  const [tips, setTips] = useState<readonly AdivinaTip[]>([]);
  /** Positions of the answer uncovered by the 🔤 and ✨ tips. */
  const [shown, setShown] = useState<readonly number[]>([]);
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
  // Tips are paid for out of the same six, so buying four leaves two tries.
  const left = guessesLeft(guesses.length, tips.length);
  const over = won || left === 0;

  const length = difficulty === null ? 0 : ADIVINA_LEVELS[difficulty];
  const keys = game === null ? new Map() : keyboardMarks(guesses, game.target.word);

  function start(level: AdivinaDifficulty) {
    setDifficulty(level);
    setGame(createAdivinaGame(groupId, cards, packCards, level));
    setGuesses([]);
    setTyped("");
    setRejected(0);
    setTips([]);
    setShown([]);
    setFinished(false);
    combo.reset();
  }

  /** Buy a hint. Costs one of the six guesses, and each kind only once. */
  function takeTip(tip: AdivinaTip) {
    if (game === null || over || tips.includes(tip)) {
      return;
    }
    if (tip === "first" && !shown.includes(0)) {
      setShown([...shown, 0]);
    }
    if (tip === "letter") {
      const index = revealTipIndex(game.target.word, shown);
      if (index === null) {
        return;
      }
      setShown([...shown, index]);
    }
    feedbackWrong();
    setTips([...tips, tip]);
  }

  function restart() {
    if (difficulty !== null) {
      start(difficulty);
    }
  }

  function type(letter: string) {
    if (over || typed.length >= length) {
      return;
    }
    // Any edit clears the refusal — it belongs to the word that was refused,
    // not to the screen.
    setRejected(0);
    setTyped(typed + letter);
  }

  function backspace() {
    setRejected(0);
    setTyped(typed.slice(0, -1));
  }

  /** Submit the typed word — refusing anything the app doesn't know, which
   *  costs the kid nothing but a shake. Only real words spend a guess. */
  function submit() {
    if (game === null || over || typed.length !== length) {
      return;
    }
    if (!isRealWord(typed, game.dictionary) || guesses.includes(typed)) {
      feedbackWrong();
      setRejected((n) => n + 1);
      return;
    }
    setTyped("");
    setRejected(0);
    guess(typed);
  }

  function guess(word: string) {
    if (game === null) {
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

    // combo.wrong() already plays the buzzer — calling it here too just
    // doubled the volume of a sound meant to be soft.
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
          /* Stars for what's left in the budget — so spending guesses AND
             buying tips both cost the same thing. */
          firstTryCount={won ? left + 1 : 0}
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
            {/* The theme, visible the whole time. Knowing the answer is a
                *casa* word is the scaffolding that makes this guessable at
                all — it lived in an sr-only heading and might as well not
                have existed. */}
            <h1 className="pop-in flex items-center gap-2 text-center">
              <span aria-hidden className="text-4xl">
                {groupEmoji}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-2xl font-extrabold sm:text-3xl">
                  {groupNameSpanish}
                </span>
                <span className="text-sm font-semibold text-ink/50">
                  {groupNameEnglish}
                </span>
              </span>
            </h1>

            {/* What the bought tips revealed. */}
            {(tips.includes("picture") || tips.includes("meaning")) && (
              <div className="pop-in flex items-center gap-4">
                {tips.includes("picture") && (
                  <span
                    aria-label={`Picture tip: ${game.target.card.english}`}
                    className="text-6xl"
                  >
                    {game.target.card.emoji}
                  </span>
                )}
                {tips.includes("meaning") && (
                  <span
                    aria-label={`Meaning tip: ${game.target.card.english}`}
                    className="text-2xl font-extrabold"
                  >
                    💬 {game.target.card.english}
                  </span>
                )}
              </div>
            )}

            {/* Letters bought with 🔤 / ✨, shown in place so they read as
                part of the answer rather than as another guess. */}
            {shown.length > 0 && (
              <div
                className="flex items-center gap-2"
                aria-label="Letters revealed by tips"
              >
                {[...game.target.word].map((letter, i) => (
                  <span
                    key={i}
                    aria-label={
                      shown.includes(i) ? `Letter ${i + 1} is ${letter}` : undefined
                    }
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border-4 text-lg font-extrabold ${
                      shown.includes(i)
                        ? "pop-in border-ink bg-[var(--color-lime)]"
                        : "border-dashed border-ink/25 bg-white"
                    }`}
                  >
                    {shown.includes(i) ? letter : ""}
                  </span>
                ))}
              </div>
            )}

            {/* The board: played rows, then the row being typed, then empty
                rows. The typing row shakes when a word is refused. */}
            <div className="flex flex-col gap-2" aria-label="Your guesses">
              {Array.from({ length: ADIVINA_GUESSES }, (_, row) => {
                const played = rows[row];
                const typing = !over && row === guesses.length;
                // Tips eat rows from the bottom, so the cost is visible on
                // the board rather than hidden in a counter.
                const spent = row >= ADIVINA_GUESSES - tips.length;
                if (spent) {
                  return (
                    <div
                      key={`spent-${row}`}
                      aria-label="A guess spent on a tip"
                      className="flex h-6 items-center justify-center gap-2 opacity-40"
                    >
                      <span aria-hidden className="text-2xl">
                        💡
                      </span>
                      <span aria-hidden className="h-1 w-24 rounded-full bg-ink/30" />
                    </div>
                  );
                }
                return (
                  <div
                    key={typing ? `typing-${rejected}` : row}
                    className={`flex gap-2 ${typing && rejected > 0 ? "wobble" : ""}`}
                  >
                    {Array.from({ length }, (_, col) => {
                      const letter = typing
                        ? (typed[col] ?? "")
                        : (played?.guess[col] ?? "");
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
                              : typing && letter
                                ? "pop-in border-ink bg-white"
                                : "border-dashed border-ink/25 bg-white"
                          }`}
                        >
                          {letter}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Says what the shake means, since the word IS spelled fine —
                the app just hasn't taught it. */}
            {!over && rejected > 0 && (
              <p
                key={rejected}
                role="status"
                className="pop-in text-lg font-extrabold text-ink/50"
              >
                No conozco esa palabra
              </p>
            )}

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
              /* The keyboard. Its own on-screen keys, not the device's: this
                 runs on a tablet in a PWA, the taps must be thumb-sized, and
                 the keys carry what's been learned about each letter. */
              <div
                className="flex w-full max-w-lg flex-col items-center gap-2"
                aria-label="Keyboard"
              >
                {/* The tip tray. Every one costs a guess, so it's a trade the
                    kid makes — the same deal el globo strikes with air. */}
                <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
                  {ADIVINA_TIPS.map((tip) => {
                    const bought = tips.includes(tip);
                    const exhausted =
                      tip === "letter" &&
                      revealTipIndex(game.target.word, shown) === null;
                    return (
                      <button
                        type="button"
                        key={tip}
                        onClick={() => takeTip(tip)}
                        disabled={bought || exhausted || left <= 1}
                        aria-label={`Tip: show ${TIP_META[tip].english} — costs one guess${
                          bought ? " (already used)" : ""
                        }`}
                        className={`sticker flex items-center gap-1.5 px-3 py-2 text-base font-extrabold ${
                          bought || exhausted || left <= 1
                            ? "opacity-30"
                            : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                        }`}
                      >
                        <span aria-hidden>{TIP_META[tip].glyph}</span>
                        {TIP_META[tip].spanish}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[...SPANISH_ALPHABET].map((letter) => {
                    const mark = keys.get(letter) as LetterMark | undefined;
                    return (
                      <button
                        type="button"
                        key={letter}
                        onClick={() => type(letter)}
                        aria-label={`Type ${letter}${
                          mark === "hit"
                            ? " (in the word, right place found)"
                            : mark === "present"
                              ? " (in the word)"
                              : mark === "miss"
                                ? " (not in the word)"
                                : ""
                        }`}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border-4 text-xl font-extrabold active:translate-x-0.5 active:translate-y-0.5 sm:h-12 sm:w-12 ${
                          mark
                            ? MARK_STYLE[mark]
                            : "border-ink bg-white shadow-[3px_3px_0_var(--color-ink)]"
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={backspace}
                    disabled={typed.length === 0}
                    aria-label="Delete the last letter"
                    className={`sticker flex h-16 w-20 items-center justify-center text-3xl ${
                      typed.length === 0
                        ? "opacity-30"
                        : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                    }`}
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={typed.length !== length}
                    aria-label={
                      typed.length === length
                        ? `Submit ${typed}`
                        : `Type ${length} letters to submit`
                    }
                    className={`sticker flex h-16 w-28 items-center justify-center text-3xl ${
                      typed.length !== length
                        ? "opacity-30"
                        : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                    }`}
                    style={
                      typed.length === length
                        ? ({
                            "--sticker-face": "var(--color-lime)",
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    ✓
                  </button>
                </div>
              </div>
            )}
          </section>

          <footer className="flex items-center justify-center pb-2">
            <span
              className="text-sm font-bold text-ink/40"
              aria-label={`${left} of ${ADIVINA_GUESSES} tries left`}
            >
              {left}/{ADIVINA_GUESSES}
            </span>
          </footer>
        </>
      )}
    </main>
  );
}
