"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  examKindFor,
  groupsInTrailOrder,
  passMarkFor,
  type Deck,
  type DeckGroup,
  type Exam,
  type ExamKind,
  type ExamOutcome,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { cardFace } from "@/lib/emoji";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { recordAnswer, sitExam, startExam } from "@/lib/client-container";
import { getSelectedKid } from "@/lib/kid";
import { canResitExam, getExamPractice } from "@/lib/economy";
import { useCamino } from "@/lib/use-camino";
import { useSelectedKid } from "@/lib/use-selected-kid";
import { LockedTile } from "@/components/TrailMarks";
import { CardFace } from "@/components/CardFace";
import { ExamTriumph } from "@/components/ExamTriumph";

interface Props {
  group: DeckGroup;
  allGroups: readonly DeckGroup[];
  allDecks: readonly Deck[];
  accent: string;
  /** Deck emoji by id, for naming the practice deck a failure sends them to. */
  deckEmoji: Readonly<Record<string, string>>;
  deckName: Readonly<Record<string, string>>;
}

/** Long enough to see the answer light up, short enough to keep momentum. */
const CELEBRATE_MS = 900;

/**
 * El examen — the checkpoint between two shelves of el camino (ADR 021).
 *
 * Deliberately plainer than the games it draws from: no combo racha, no
 * running star count, no replay button. An exam is a *measurement*, and the
 * celebration belongs at the end, once. It also never reveals the right
 * answer on a wrong tap — unlike the quiz, where a wrong tap wobbles and
 * lets the kid try again, here the answer is taken as given and the exam
 * moves on, because a score you can retry your way to is not a score.
 */
export function ExamPlayer({
  group,
  allGroups,
  allDecks,
  accent,
  deckEmoji,
  deckName,
}: Props) {
  const selected = useSelectedKid();
  const kid = selected.status === "picked" ? selected.kid : null;
  const camino = useCamino(allGroups, allDecks, kid);
  const shelf = camino?.shelves.find((s) => s.groupId === group.id);
  // Two ways to arrive here without having earned it: a bookmark to a shelf
  // that is not finished, and a re-sit before the practice a failure asked
  // for. Both are checked before a single question is dealt.
  const blocked =
    shelf !== undefined && !shelf.examPending && !shelf.examPassed;
  const mustPractise = kid !== null && !canResitExam(kid, group.id);
  // Which deck that pending practice is on, so the refusal can point at the
  // deck itself rather than at the shelf and leave the kid to find it.
  const pendingDeckId = kid !== null ? (getExamPractice(kid)?.deckId ?? null) : null;

  const [exam, setExam] = useState<Exam | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ExamOutcome | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const correct = useRef(0);
  const timer = useRef<number | null>(null);

  function currentKid() {
    return getSelectedKid() ?? "listener";
  }

  useEffect(() => {
    if (blocked || mustPractise) {
      return;
    }
    warmUpVoices();
    let cancelled = false;
    startExam
      .execute(currentKid(), group.id)
      .then((built) => {
        if (!cancelled) {
          setExam(built);
        }
      })
      .catch((err: unknown) => log.error("exam", "failed to build", { err }));
    return () => {
      cancelled = true;
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
    // currentKid reads client-only storage and is stable per mount; the deal
    // must re-run only when the shelf or the gate changes.
  }, [group.id, blocked, mustPractise]);

  const rounds = exam?.rounds ?? [];
  const round = rounds[index];
  // The shelf's own kind, known before the exam is dealt so the refusal and
  // the error fallback can speak in the right units.
  const kind: ExamKind = examKindFor(
    groupsInTrailOrder(allGroups).findIndex((g) => g.id === group.id),
  );
  const isSuper = kind === "super";

  function finish(score: number) {
    sitExam
      .execute(currentKid(), group.id, score)
      .then((result) => {
        setOutcome(result);
        setCelebrating(result.passed);
      })
      .catch((err: unknown) => {
        log.error("exam", "failed to record", { err });
        // Never strand a kid on a blank screen because a write failed: show
        // the result they earned, and let the record catch up next time.
        setOutcome({
          passed: score >= passMarkFor(kind),
          stars: 0,
          practiceDeckId: null,
          kind,
        });
      });
  }

  function choose(cardId: string) {
    if (!round || picked !== null) {
      return;
    }
    const right = cardId === round.answer.id;
    setPicked(cardId);
    if (right) {
      correct.current += 1;
      speakSpanish(round.answer.spanish);
    }
    recordAnswer
      .execute({
        kid: currentKid(),
        cardId: round.answer.id,
        correct: right,
        activity: "quiz-listen",
        review: true,
      })
      .catch((err: unknown) => log.error("exam", "failed to tally", { err }));

    timer.current = window.setTimeout(() => {
      setPicked(null);
      if (index + 1 >= rounds.length) {
        finish(correct.current);
      } else {
        setIndex((i) => i + 1);
      }
    }, CELEBRATE_MS);
  }

  // What the pass opened, for the celebration's last beat.
  const ordered = groupsInTrailOrder(allGroups);
  const nextShelf = ordered[ordered.findIndex((g) => g.id === group.id) + 1] ?? null;

  // Straight to the deck that has to be played, falling back to the shelf if
  // the nomination is somehow missing — never a dead end (ADR 021).
  const refusalHref = !mustPractise
    ? "/"
    : pendingDeckId !== null
      ? `/deck/${pendingDeckId}`
      : `/group/${group.id}`;

  // Refused entry: say why in pictures, and always point somewhere useful.
  //
  // `outcome === null` is load-bearing, not defensive. Failing an exam writes
  // the practice record, which flips `mustPractise` true on the very next
  // render — so without this the kid who just failed is thrown off their own
  // result screen and never sees the score or the deck they were sent to.
  // This guard is about *entering* an exam; a finished sitting always shows
  // its result.
  if ((blocked || mustPractise) && outcome === null) {
    return (
      <main
        style={{ "--accent": accent } as React.CSSProperties}
        className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 p-4 sm:p-6"
      >
        <LockedTile label={group.nameSpanish} className="min-h-44 w-full max-w-sm">
          <span aria-hidden className="text-7xl">
            {group.emoji}
          </span>
          <span className="text-center text-lg font-bold">
            {mustPractise ? "Practica primero" : "Termina la estantería"}
          </span>
        </LockedTile>
        <Link
          href={refusalHref}
          aria-label={mustPractise ? "Go and practise" : "Back home"}
          className="sticker flex min-h-24 items-center gap-4 px-8 py-4 text-3xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <span aria-hidden className="text-5xl">
            {mustPractise ? group.emoji : "🏠"}
          </span>
        </Link>
      </main>
    );
  }

  if (celebrating && outcome !== null) {
    return (
      <ExamTriumph
        score={correct.current}
        total={rounds.length}
        bonus={outcome.stars}
        kind={outcome.kind}
        passedEmoji={group.emoji}
        unlockedEmoji={nextShelf?.emoji ?? null}
        unlockedName={nextShelf?.nameSpanish ?? null}
        onDone={() => setCelebrating(false)}
      />
    );
  }

  return (
    <main
      style={{ "--accent": accent } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back home"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          {isSuper ? "🏅" : "🎓"} {group.emoji}
        </span>
      </header>

      {outcome !== null ? (
        <ExamResult
          outcome={outcome}
          score={correct.current}
          total={rounds.length}
          groupId={group.id}
          deckEmoji={deckEmoji}
          deckName={deckName}
        />
      ) : !round ? (
        <section className="flex-1" aria-hidden />
      ) : (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-8">
            <button
              type="button"
              onClick={() => speakSpanish(round.answer.spanish)}
              aria-label={`Hear the word (${round.answer.english})`}
              className="sticker pop-in flex h-32 w-32 items-center justify-center text-6xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              🔊
            </button>

            {/* Four picture choices for BOTH profiles (ADR 021) — pictures need
                no reading, so the harder format costs the pre-reader nothing. */}
            <div className="grid w-full max-w-md grid-cols-2 gap-5">
              {round.choices.map((choice) => {
                const isPick = picked === choice.id;
                const isAnswer = choice.id === round.answer.id;
                return (
                  <button
                    type="button"
                    key={`${round.answer.id}-${choice.id}`}
                    onClick={() => choose(choice.id)}
                    aria-label={`Pick ${choice.english}`}
                    className={`sticker relative flex aspect-square flex-col items-center justify-center gap-2 p-4 ${
                      isPick && isAnswer ? "pop-in" : isPick ? "wobble" : ""
                    }`}
                    style={
                      isPick
                        ? ({
                            "--sticker-face": isAnswer
                              ? "var(--color-lime)"
                              : "#fecaca",
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
                  </button>
                );
              })}
            </div>
          </section>

          <footer className="flex items-center justify-center pb-2">
            <div
              className="flex flex-wrap items-center gap-1.5"
              aria-label={`Pregunta ${index + 1} de ${rounds.length}`}
            >
              {rounds.map((r, i) => (
                <span
                  key={r.answer.id}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i < index ? "bg-[var(--accent)]" : "bg-white"
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

/**
 * The result screen for a sitting that did not pass (a pass goes to
 * ExamTriumph and then here only if the kid taps through).
 *
 * The failure state is the one ADR 021 cares most about: it must always point
 * at a specific deck to go and play. A dead end here is the ADR being broken.
 */
function ExamResult({
  outcome,
  score,
  total,
  groupId,
  deckEmoji,
  deckName,
}: {
  outcome: ExamOutcome;
  score: number;
  total: number;
  groupId: string;
  deckEmoji: Readonly<Record<string, string>>;
  deckName: Readonly<Record<string, string>>;
}) {
  const deckId = outcome.practiceDeckId;
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6">
      <span
        aria-hidden
        className="pop-in text-8xl drop-shadow-[4px_4px_0_var(--color-ink)]"
      >
        {outcome.passed ? "🏆" : "💪"}
      </span>
      <span className="sticker flex items-center px-8 py-3 text-5xl font-extrabold tabular-nums">
        {score}/{total}
      </span>
      <span className="text-2xl font-bold text-ink/70">
        {outcome.passed ? "¡Aprobado!" : "¡Casi! Practica un poco más."}
      </span>

      {/* Never "no" without "do this instead" — the whole failure contract. */}
      {!outcome.passed && deckId !== null && (
        <Link
          href={`/deck/${deckId}`}
          aria-label={`Practise ${deckName[deckId] ?? deckId}`}
          className="sticker flex min-h-24 items-center gap-4 px-8 py-4 text-3xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <span aria-hidden className="text-5xl">
            {deckEmoji[deckId] ?? "📚"}
          </span>
          <span>{deckName[deckId] ?? "Practicar"}</span>
        </Link>
      )}

      {outcome.passed && (
        <Link
          href="/"
          aria-label="Back home"
          className="sticker flex min-h-24 items-center gap-4 px-8 py-4 text-3xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <span aria-hidden className="text-5xl">
            🏠
          </span>
          <span>Seguir</span>
        </Link>
      )}
      <span className="sr-only">{`Examen de ${groupId}`}</span>
    </section>
  );
}
