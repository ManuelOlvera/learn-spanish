"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ALL_KIDS,
  isLearnedStat,
  levelFor,
  learnedThisWeek,
  pickShakyCards,
  type Deck,
  type KidId,
  type Streak,
  type TrendHistory,
  type VocabularyCard,
  type WordStats,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import {
  getAlbum,
  getStreak,
  getWordStats,
  sampleTrend,
} from "@/lib/client-container";
import { getAvatar, LEVEL_META } from "@/lib/kid";
import { buyFreeze, getStars, readWeekly, type WeeklySnapshot } from "@/lib/economy";
import { syncPush } from "@/lib/sync";
import {
  getStorageHealth,
  subscribeStorageHealth,
  type StorageHealth,
} from "@/lib/storage-health";
import { checkSpanishVoice, type VoiceStatus } from "@/lib/speech";
import { feedbackRacha } from "@/lib/feedback";
import { WeeklyCard } from "@/components/WeeklyCard";
import { useKidLevels } from "@/lib/use-kid-levels";

interface Props {
  decks: readonly Deck[];
}

interface KidReport {
  readonly kid: KidId;
  readonly avatar: string;
  readonly stars: number;
  readonly streak: Streak | null;
  readonly weekly: WeeklySnapshot;
  readonly stickers: number;
  readonly strong: readonly VocabularyCard[];
  readonly tricky: readonly VocabularyCard[];
  readonly trend: TrendHistory;
}

function strongWords(
  cards: readonly VocabularyCard[],
  stats: WordStats,
  max: number,
): readonly VocabularyCard[] {
  return cards
    .filter((c) => stats[c.id] !== undefined && isLearnedStat(stats[c.id]!))
    .sort(
      (a, b) =>
        (stats[b.id]!.right - stats[b.id]!.wrong) -
        (stats[a.id]!.right - stats[a.id]!.wrong),
    )
    .slice(0, max);
}

/** The per-kid trend line: total learned, this week's delta, and a tiny bar
 *  per sampled week. Parent-facing, so text is fine. */
function TrendBlock({ trend }: { trend: TrendHistory }) {
  const newest = trend[trend.length - 1];
  if (newest === undefined) {
    return null;
  }
  const delta = learnedThisWeek(trend);
  const max = Math.max(...trend.map((s) => s.learned), 1);
  return (
    <div>
      <h3 className="text-base font-extrabold text-ink/70">📈 Progreso</h3>
      <p className="text-lg font-semibold">
        {newest.learned} palabras aprendidas
        {delta !== null ? (
          <span className="ml-2 rounded-full border-2 border-ink bg-[var(--color-lime)] px-2 text-base font-extrabold">
            {delta > 0 ? `+${delta}` : "="} esta semana
          </span>
        ) : (
          <span className="ml-2 text-base font-semibold text-ink/50">
            primera semana registrada
          </span>
        )}
      </p>
      {trend.length > 1 && (
        <div
          aria-label={`Learned words by week: ${trend
            .map((s) => `${s.week}: ${s.learned}`)
            .join(", ")}`}
          className="mt-2 flex h-12 items-end gap-1"
        >
          {trend.map((sample) => (
            <span
              key={sample.week}
              aria-hidden
              title={`${sample.week}: ${sample.learned}`}
              className="w-4 rounded-t-md border-2 border-ink bg-[var(--color-lime)]"
              style={{ height: `${Math.max(12, (sample.learned / max) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Parent-facing summary (text is fine here): what each kid has earned and
 *  which words deserve five minutes of practice at dinner. */
/**
 * The one screen that says "this device stopped saving".
 *
 * Every local store swallows a failed write by design, so a full quota is
 * invisible: the kids keep earning stickers that are never persisted, and the
 * app looks perfectly healthy right up until a reload loses the session. This
 * belongs on the parent's screen and nowhere else — a pre-reader can neither
 * read it nor act on it, and putting a failure state in front of the kids
 * would break the picture-only rule for no gain.
 */
function StorageWarning() {
  // Read after mount (the record is in-memory — see lib/storage-health.ts) and
  // then *keep listening*: this screen loads its data after it mounts, so the
  // write that fails usually fails after the first read. Reading once left the
  // banner permanently silent on exactly the device it exists for.
  const [health, setHealth] = useState<StorageHealth | null>(null);
  useEffect(() => {
    const read = () => setHealth(getStorageHealth());
    read();
    return subscribeStorageHealth(read);
  }, []);
  if (health === null || !health.full) {
    return null;
  }
  return (
    <p
      role="alert"
      className="sticker flex flex-col gap-1 p-4 text-sm font-bold"
    >
      <span>
        <span aria-hidden>⛔ </span>
        El almacenamiento de este dispositivo está lleno.
      </span>
      <span className="font-semibold text-ink/70">
        Lo que los niños ganen ahora mismo puede perderse al recargar. Libera
        espacio en el navegador (o en el dispositivo) y vuelve a abrir la app.
      </span>
    </p>
  );
}

/**
 * The device cannot speak Spanish, and the kid cannot tell you.
 *
 * ADR 001 puts every word through the browser's own voices. Where none of them
 * is Spanish, the platform reads the Spanish text in whatever voice it has —
 * on Android, an English one — so a pre-reader who navigates by sound is being
 * taught the wrong pronunciation with complete confidence, and is far too
 * young to report it. Installing a voice is a grown-up, one-time settings
 * task, so the message belongs on the grown-up screen.
 *
 * Only shown for "missing", never for "unknown": a device we could not measure
 * must not be accused of a fault it may not have.
 */
function VoiceWarning() {
  const [status, setStatus] = useState<VoiceStatus>("unknown");
  useEffect(() => {
    let cancelled = false;
    void checkSpanishVoice().then((result) => {
      if (!cancelled) {
        setStatus(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (status !== "missing") {
    return null;
  }
  return (
    <p role="alert" className="sticker flex flex-col gap-1 p-4 text-sm font-bold">
      <span>
        <span aria-hidden>🔇 </span>
        Este dispositivo no tiene una voz en español instalada.
      </span>
      <span className="font-semibold text-ink/70">
        Las palabras se leen con una voz de otro idioma, así que la
        pronunciación que oyen los niños no es la correcta. Instala una voz en
        español en los ajustes del dispositivo (Ajustes → Accesibilidad →
        Texto a voz) y vuelve a abrir la app.
      </span>
    </p>
  );
}

export function InformeView({ decks }: Props) {
  // Each card names the level that profile is at now (roadmap 18).
  const levels = useKidLevels();
  const [reports, setReports] = useState<readonly KidReport[] | null>(null);

  useEffect(() => {
    const cards = decks.filter((d) => !d.secret).flatMap((d) => d.cards);
    Promise.all(
      ALL_KIDS.map(async (kid): Promise<KidReport> => {
        const [stats, stickers, streak, trend] = await Promise.all([
          getWordStats.execute(kid),
          getAlbum.execute(kid),
          getStreak.execute(kid),
          // Opening the informe takes (or refreshes) this week's trend sample.
          sampleTrend.execute(kid, new Date()),
        ]);
        return {
          kid,
          avatar: getAvatar(kid),
          stars: getStars(kid),
          streak,
          weekly: readWeekly(kid),
          stickers: stickers.length,
          strong: strongWords(cards, stats, 5),
          tricky: pickShakyCards(cards, stats, 5),
          trend,
        };
      }),
    )
      .then(setReports)
      .catch((err: unknown) => {
        log.error("informe", "failed to build report", { err });
        setReports([]);
      });
  }, [decks]);

  /** Buy one ❄️ for a kid; false lets the WeeklyCard play its denied wobble. */
  function handleBuyFreeze(kid: KidId): boolean {
    const result = buyFreeze(kid);
    if (result === null) {
      return false;
    }
    feedbackRacha();
    setReports((current) =>
      (current ?? []).map((r) =>
        r.kid === kid
          ? { ...r, stars: result.stars, weekly: { ...r.weekly, freezes: result.freezes } }
          : r,
      ),
    );
    void syncPush();
    return true;
  }

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

      <StorageWarning />
      <VoiceWarning />

      {reports === null ? (
        <p className="text-center font-semibold text-ink/50">…</p>
      ) : (
        reports.map((report) => (
          <section
            key={report.kid}
            className="sticker relative flex flex-col gap-4 p-5"
          >
            <span aria-hidden className="sticker-peel" />
            <Link
              href={`/informe/${report.kid}`}
              className="flex items-center gap-3"
            >
              <span aria-hidden className="text-4xl">
                {report.avatar}
              </span>
              <h2 className="text-2xl font-extrabold">
                {LEVEL_META[levelFor(report.kid, levels)].glyph}{" "}
                {LEVEL_META[levelFor(report.kid, levels)].english}
              </h2>
              <span className="ml-auto text-sm font-semibold text-ink/50 underline underline-offset-4">
                Ver todo →
              </span>
            </Link>
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
            {/* La racha semanal: shown and shopped here rather than on a kid's
                screen. A ❄️ is bought with the kid's stars but is a parent's
                call — it forgives a missed week — and home keeps the one
                thing it says. Read-only for the streak itself: only home may
                roll the week, which is what fires the ¡Semana N! moment. */}
            <WeeklyCard
              weekly={report.weekly}
              stars={report.stars}
              onBuyFreeze={() => handleBuyFreeze(report.kid)}
            />
            <TrendBlock trend={report.trend} />
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
