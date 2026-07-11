"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ALL_KIDS,
  pickReviewCards,
  weakScore,
  type Deck,
  type KidId,
  type Streak,
  type VocabularyCard,
  type WordStats,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { getAlbum, getStreak, getWordStats } from "@/lib/album";
import { getAvatar, KID_META } from "@/lib/kid";
import { getStars } from "@/lib/economy";

interface Props {
  decks: readonly Deck[];
}

interface KidReport {
  readonly kid: KidId;
  readonly avatar: string;
  readonly stars: number;
  readonly streak: Streak | null;
  readonly stickers: number;
  readonly strong: readonly VocabularyCard[];
  readonly tricky: readonly VocabularyCard[];
}

function strongWords(
  cards: readonly VocabularyCard[],
  stats: WordStats,
  max: number,
): readonly VocabularyCard[] {
  return cards
    .filter((c) => (stats[c.id]?.right ?? 0) > 0 && weakScore(stats[c.id]!) <= 0)
    .sort(
      (a, b) =>
        (stats[b.id]!.right - stats[b.id]!.wrong) -
        (stats[a.id]!.right - stats[a.id]!.wrong),
    )
    .slice(0, max);
}

/** Parent-facing summary (text is fine here): what each kid has earned and
 *  which words deserve five minutes of practice at dinner. */
export function InformeView({ decks }: Props) {
  const [reports, setReports] = useState<readonly KidReport[] | null>(null);

  useEffect(() => {
    const cards = decks.flatMap((d) => d.cards);
    Promise.all(
      ALL_KIDS.map(async (kid): Promise<KidReport> => {
        const [stats, stickers, streak] = await Promise.all([
          getWordStats.execute(kid),
          getAlbum.execute(kid),
          getStreak.execute(kid),
        ]);
        return {
          kid,
          avatar: getAvatar(kid),
          stars: getStars(kid),
          streak,
          stickers: stickers.length,
          strong: strongWords(cards, stats, 5),
          tricky: pickReviewCards(cards, stats, 5),
        };
      }),
    )
      .then(setReports)
      .catch((err: unknown) => {
        log.error("informe", "failed to build report", { err });
        setReports([]);
      });
  }, [decks]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/album"
          aria-label="Back to the album"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          📔
        </Link>
        <span aria-hidden className="text-4xl">
          📊
        </span>
      </header>

      <div className="text-center">
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          Informe para padres
        </h1>
        <p className="mt-1 text-base font-semibold text-ink/60">
          What each kid has earned, and the words worth five minutes of
          practice together.
        </p>
      </div>

      {reports === null ? (
        <p className="text-center font-semibold text-ink/50">…</p>
      ) : (
        reports.map((report) => (
          <section
            key={report.kid}
            className="sticker relative flex flex-col gap-4 p-5"
          >
            <span aria-hidden className="sticker-peel" />
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-4xl">
                {report.avatar}
              </span>
              <h2 className="text-2xl font-extrabold">
                {KID_META[report.kid].glyph} {KID_META[report.kid].english}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 text-lg font-extrabold">
              <span className="rounded-full border-2 border-ink bg-white px-3">
                ⭐ {report.stars}
              </span>
              <span className="rounded-full border-2 border-ink bg-white px-3">
                📔 {report.stickers}
              </span>
              <span className="rounded-full border-2 border-ink bg-white px-3">
                ☀️ {report.streak?.count ?? 0}
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink/70">
                💪 Palabras fuertes
              </h3>
              <p className="text-lg font-semibold">
                {report.strong.length > 0
                  ? report.strong
                      .map((c) => `${c.emoji} ${c.spanish}`)
                      .join(" · ")
                  : "Still gathering data — have them play a few quizzes."}
              </p>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink/70">
                🔁 Palabras para practicar
              </h3>
              <p className="text-lg font-semibold">
                {report.tricky.length > 0
                  ? report.tricky
                      .map((c) => `${c.emoji} ${c.spanish} (${c.english})`)
                      .join(" · ")
                  : "Nothing struggling right now. 🎉"}
              </p>
            </div>
          </section>
        ))
      )}
    </main>
  );
}
