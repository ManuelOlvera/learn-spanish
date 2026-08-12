"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createStoryQuiz,
  STORIES_ID,
  type QuizMode,
  type Story,
  type StoryQuiz,
  type VocabularyCard,
} from "@learn-spanish/core";
import Image from "next/image";
import { cardFace } from "@/lib/emoji";
import { storyArt } from "@/lib/story-art";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { useCombo } from "@/lib/use-combo";
import { DoneScreen } from "@/components/DoneScreen";
import { RachaBurst } from "@/components/RachaBurst";
import { CardFace } from "./CardFace";

interface Props {
  story: Story;
  cards: readonly VocabularyCard[];
  mode: QuizMode;
  accent: string;
}

const CELEBRATE_MS = 1100;

/** Where the supporting emoji sit around the hero — fixed spots rather than
 *  random ones, so a page looks composed instead of scattered (the I-spy
 *  board is the app's scattered picture; a story page is its illustration). */
const PROP_SPOTS = [
  "right-4 top-4 rotate-6",
  "bottom-6 left-4 -rotate-6",
  "left-6 top-8 rotate-3",
];

/**
 * El cuento: a story read page by page, then a handful of comprehension
 * questions. The questions come at the end, never between pages — a quiz
 * mid-narrative breaks the spell, and they exist so the chest has something
 * honest to pay on.
 */
export function StoryPlayer({ story, cards, mode, accent }: Props) {
  const [phase, setPhase] = useState<"reading" | "questions">("reading");
  const [pageIndex, setPageIndex] = useState(0);
  // Distractors are shuffled, so the quiz is built client-side only —
  // building it during SSR would hydrate against a different deal.
  const [quiz, setQuiz] = useState<StoryQuiz | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [wrongTap, setWrongTap] = useState<{ id: string; nonce: number } | null>(
    null,
  );
  const [wobbleKey, setWobbleKey] = useState(0);
  const advanceTimer = useRef<number | null>(null);
  const roundMissed = useRef(false);
  const firstTries = useRef(0);
  const mistakes = useRef(0);
  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
    setQuiz(createStoryQuiz(story, cards, mode));
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, [story, cards, mode]);

  const rounds = quiz?.rounds ?? [];
  const round = rounds[questionIndex];
  const done = phase === "questions" && quiz !== null && questionIndex >= rounds.length;
  const page = story.pages[pageIndex];
  // An illustrated page replaces its emoji scene outright: a drawn picture
  // with emoji stickers floating on top reads as a mistake, not a style.
  const art = storyArt(page?.image);

  // Read each question aloud as it arrives. Allowed to auto-speak here: the
  // tap that answered the previous question (or turned the last page) is the
  // user gesture browsers require.
  useEffect(() => {
    if (phase === "questions" && round !== undefined) {
      speakSpanish(round.question.ask);
    }
  }, [phase, round]);

  function hearPage() {
    if (page !== undefined) {
      speakSpanish(page.text);
      setWobbleKey((k) => k + 1);
    }
  }

  // Silent on turn, like the flashcards: audio only on the page's own tap.
  function turnPage() {
    setWobbleKey(0);
    if (pageIndex < story.pages.length - 1) {
      setPageIndex((i) => i + 1);
    } else {
      setPhase("questions");
    }
  }

  function restart() {
    setQuiz(createStoryQuiz(story, cards, mode));
    setPhase("reading");
    setPageIndex(0);
    setQuestionIndex(0);
    setCorrectId(null);
    setWrongTap(null);
    setWobbleKey(0);
    roundMissed.current = false;
    firstTries.current = 0;
    mistakes.current = 0;
    combo.reset();
  }

  function choose(cardId: string) {
    if (!round || correctId !== null) {
      return;
    }
    if (cardId === round.answer.id) {
      setCorrectId(cardId);
      setWrongTap(null);
      combo.correct();
      if (!roundMissed.current) {
        firstTries.current += 1;
      }
      roundMissed.current = false;
      speakSpanish(round.answer.spanish);
      advanceTimer.current = window.setTimeout(() => {
        setQuestionIndex((i) => i + 1);
        setCorrectId(null);
      }, CELEBRATE_MS);
    } else {
      roundMissed.current = true;
      mistakes.current += 1;
      combo.wrong();
      setWrongTap((prev) => ({ id: cardId, nonce: (prev?.nonce ?? 0) + 1 }));
    }
  }

  // Deliberately no word-stats tally here (unlike the quizzes): missing "¿quién
  // sube al árbol?" means the kid lost the thread of the story, not that they
  // can't recognise "el gato". Feeding that into El repaso would flag words
  // the kid actually knows.

  return (
    <main
      style={{ "--accent": accent } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href="/cuento"
          aria-label="Back to all stories"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          {story.emoji}
        </span>
      </header>

      {combo.racha !== null && !done && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}

      {done ? (
        <DoneScreen
          stickerDeckId={STORIES_ID}
          activity={mode === "listen" ? "cuento-listen" : "cuento-read"}
          onReplay={restart}
          firstTryCount={firstTries.current}
          mistakeCount={mistakes.current}
          totalRounds={rounds.length}
          back={{ href: "/cuento", emoji: "📚", label: "More stories" }}
        />
      ) : phase === "reading" && page !== undefined ? (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-6">
            <button
              type="button"
              key={`${story.id}-${pageIndex}-${wobbleKey}`}
              onClick={hearPage}
              aria-label={`Hear this page (${page.english})`}
              className={`sticker relative flex w-full max-w-md flex-col items-center gap-4 p-6 ${
                wobbleKey > 0 ? "wobble" : "pop-in"
              }`}
            >
              <span aria-hidden className="sticker-peel" />
              {art !== null ? (
                <span
                  aria-hidden
                  className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border-4 border-ink"
                >
                  <Image
                    src={art}
                    alt=""
                    fill
                    sizes="(max-width: 448px) 100vw, 448px"
                    // Pre-sized by scripts/optimize-story-art.sh, so the
                    // optimizer would only add a round trip — and offline
                    // (ADR 005) a plain hashed file is what we want cached.
                    unoptimized
                    priority={pageIndex === 0}
                    className="object-cover"
                  />
                  <span className="absolute bottom-1 right-2 text-3xl">🔊</span>
                </span>
              ) : (
                <span
                  aria-hidden
                  className="relative flex h-52 w-full items-center justify-center sm:h-64"
                >
                  <span className="text-[6rem] leading-none sm:text-[8rem]">
                    {page.scene.hero}
                  </span>
                  {page.scene.props.map((prop, i) => (
                    <span
                      key={`${prop}-${i}`}
                      className={`absolute text-4xl sm:text-5xl ${
                        PROP_SPOTS[i] ?? PROP_SPOTS[0]
                      }`}
                    >
                      {prop}
                    </span>
                  ))}
                  {/* Inside the picture, not the card corner: the longest
                      sentences wrap to two lines and would run into it there. */}
                  <span className="absolute bottom-0 right-0 text-3xl">🔊</span>
                </span>
              )}
              <span className="text-2xl font-extrabold leading-snug sm:text-3xl">
                {page.text}
              </span>
            </button>
          </section>

          <footer className="flex items-center justify-between gap-4 pb-2">
            <div
              className="flex flex-wrap items-center gap-1.5"
              aria-label={`Page ${pageIndex + 1} of ${story.pages.length}`}
            >
              {story.pages.map((p, i) => (
                <span
                  key={p.text}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i <= pageIndex ? "bg-[var(--accent)]" : "bg-white"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={turnPage}
              aria-label={
                pageIndex < story.pages.length - 1
                  ? "Next page"
                  : "Finish the story"
              }
              className="sticker flex h-20 w-28 items-center justify-center text-5xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
              style={
                {
                  "--sticker-face": "var(--color-lime)",
                  "--accent": "var(--color-ink)",
                } as React.CSSProperties
              }
            >
              →
            </button>
          </footer>
        </>
      ) : round !== undefined ? (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => speakSpanish(round.question.ask)}
              aria-label={`Hear the question again (${round.question.english})`}
              className="sticker pop-in relative flex w-full max-w-md items-center justify-center gap-3 px-6 py-5 active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <span aria-hidden className="sticker-peel" />
              {mode === "read" ? (
                <span className="text-2xl font-extrabold sm:text-3xl">
                  {round.question.ask}
                </span>
              ) : (
                <span aria-hidden className="text-6xl">
                  ❓
                </span>
              )}
              <span aria-hidden className="text-3xl">
                🔊
              </span>
            </button>

            <div className="grid w-full max-w-md grid-cols-2 gap-5">
              {round.choices.map((choice) => {
                const isCorrectPick = correctId === choice.id;
                const isWrongPick = wrongTap?.id === choice.id;
                return (
                  <button
                    type="button"
                    key={`${round.question.id}-${choice.id}-${
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
                    <CardFace
                      image={choice.image}
                      face={cardFace(choice.emoji)}
                      single="text-7xl sm:text-8xl"
                      wide="text-4xl sm:text-5xl"
                    />
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
              aria-label={`Question ${questionIndex + 1} of ${rounds.length}`}
            >
              {rounds.map((r, i) => (
                <span
                  key={r.question.id}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i < questionIndex || (i === questionIndex && correctId !== null)
                      ? "bg-[var(--accent)]"
                      : "bg-white"
                  }`}
                />
              ))}
            </div>
          </footer>
        </>
      ) : (
        // One frame while the client builds the deal.
        <section className="flex-1" aria-hidden />
      )}
    </main>
  );
}
