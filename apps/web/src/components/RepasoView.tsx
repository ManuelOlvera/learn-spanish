"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  KID_GAME_MODES,
  MAX_QUIZ_ROUNDS,
  pickReviewCards,
  type Deck,
  type KidId,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { getWordStats } from "@/lib/album";
import { getSelectedKid } from "@/lib/kid";
import { QuizPlayer } from "@/components/QuizPlayer";

interface Props {
  decks: readonly Deck[];
}

/** El repaso: a quiz over exactly the words this kid keeps missing.
 *  No sticker — the reward is the words getting easier. */
export function RepasoView({ decks }: Props) {
  const [kid, setKid] = useState<KidId | null>(null);
  const [reviewDeck, setReviewDeck] = useState<Deck | null | undefined>(undefined);

  useEffect(() => {
    const current = getSelectedKid() ?? "listener";
    setKid(current);
    getWordStats
      .execute(current)
      .then((stats) => {
        const weak = pickReviewCards(
          decks.flatMap((d) => d.cards),
          stats,
          MAX_QUIZ_ROUNDS,
        );
        // A quiz round needs distractors too, so a tiny review set borrows
        // strong words from the same pack to fill the choices.
        if (weak.length === 0) {
          setReviewDeck(null);
          return;
        }
        const fillers = decks
          .flatMap((d) => d.cards)
          .filter((c) => !weak.some((w) => w.id === c.id))
          .slice(0, Math.max(0, 4 - weak.length));
        setReviewDeck({
          id: "repaso",
          nameSpanish: "El repaso",
          nameEnglish: "Review",
          emoji: "🔁",
          cards: [...weak, ...fillers],
        });
      })
      .catch((err: unknown) => {
        log.error("word-stats", "failed to load for repaso", { err });
        setReviewDeck(null);
      });
  }, [decks]);

  if (reviewDeck === undefined || kid === null) {
    return <main className="min-h-dvh" aria-hidden />;
  }

  if (reviewDeck === null) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 p-6 text-center">
        <span aria-hidden className="pop-in text-8xl">
          🌟
        </span>
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          ¡Nada que repasar!
        </h1>
        <p className="text-lg font-semibold text-ink/60">
          Nothing to review — keep playing!
        </p>
        <Link
          href="/"
          aria-label="Back to all decks"
          className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
      </main>
    );
  }

  return (
    <QuizPlayer
      deck={reviewDeck}
      mode={KID_GAME_MODES[kid].quiz}
      accent="#a3e635"
      review
    />
  );
}
