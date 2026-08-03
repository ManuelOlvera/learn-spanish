"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Deck, DeckMastery, KidId, KidReport } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { getKidReport } from "@/lib/client-container";
import { getAvatar, KID_META } from "@/lib/kid";
import { getUnlockedDecks } from "@/lib/economy";
import { deckAccent } from "@/lib/deck-theme";
import { ACTIVITY_META } from "@/lib/activity-theme";

interface Props {
  decks: readonly Deck[];
  kid: KidId;
}

/**
 * Colours that carry meaning. Chosen by running the palette validator, not by
 * eye: dark green against orange is ΔE 0.4 under protanopia — indistinguishable
 * — while this pair separates at ΔE 17. Amber's contrast on cream is below
 * 3:1, so it never carries meaning alone: every meter is directly labelled and
 * the shaky segment is hatched.
 */
const MASTERED = "var(--color-lime-deep)";
const SHAKY = "#f59e0b";

/** Hand-drawn 45° hatch for the shaky segment — the sanctioned second channel
 *  for a colour that can't be relied on, and it reads as pencil shading. */
const HATCH =
  "repeating-linear-gradient(45deg, var(--color-ink) 0 2px, transparent 2px 5px)";

/** Spanish agrees in number; "1 flojas" reads as a bug to the parent who is
 *  the entire audience for this screen. */
function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** One deck's meter: mastered, then shaky, then empty track ("not yet").
 *  Segments are separated by a 2px surface gap so two fills never blur into
 *  one bar. */
function MasteryMeter({ mastery }: { mastery: DeckMastery }) {
  const pct = (n: number) => (mastery.total === 0 ? 0 : (n / mastery.total) * 100);
  return (
    <span
      aria-hidden
      className="flex h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-[color-mix(in_srgb,var(--color-ink)_10%,white)]"
    >
      <span style={{ width: `${pct(mastery.mastered)}%`, background: MASTERED }} />
      {mastery.shaky > 0 && (
        <span
          className="border-l-2 border-paper"
          style={{ width: `${pct(mastery.shaky)}%`, background: SHAKY }}
        >
          <span className="block h-full w-full" style={{ background: HATCH }} />
        </span>
      )}
    </span>
  );
}

/** A shelf they have actually opened. */
function ShelfSlot({ deck, mastery }: { deck: Deck; mastery: DeckMastery }) {
  return (
    <li
      className="sticker relative flex flex-col gap-2 p-3 text-left"
      style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
    >
      <span className="flex items-baseline gap-2">
        <span aria-hidden className="text-2xl">
          {deck.emoji}
        </span>
        <span className="truncate text-sm font-extrabold">{deck.nameSpanish}</span>
      </span>
      <MasteryMeter mastery={mastery} />
      <span className="text-xs font-semibold text-ink/60">
        {mastery.mastered}/{mastery.total} dominadas
        {mastery.shaky > 0 && ` · ${plural(mastery.shaky, "floja", "flojas")}`}
      </span>
    </li>
  );
}

export function KidReportView({ decks, kid }: Props) {
  const [report, setReport] = useState<KidReport | null>(null);
  const [shown, setShown] = useState<readonly Deck[]>([]);
  // Avatars live in browser storage, so they are read after mount — reading
  // during render throws on the prerender and swaps the emoji on hydration.
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    setAvatar(getAvatar(kid));
    // Secret decks only exist for a kid who unlocked one; the report must not
    // reveal the others by listing them as "sin abrir".
    const unlocked = getUnlockedDecks(kid);
    const visible = decks.filter((d) => d.secret !== true || unlocked.includes(d.id));
    setShown(visible);
    getKidReport
      .execute(kid, visible)
      .then(setReport)
      .catch((err: unknown) => {
        log.error("informe", "failed to build the kid report", { err });
      });
  }, [decks, kid]);

  const byId = new Map(shown.map((d) => [d.id, d]));
  const meta = KID_META[kid];
  // Most-mastered first, so the shelves with something to say lead the page.
  const opened = [...(report?.decks ?? [])]
    .filter((d) => d.everOpened)
    .sort((a, b) => b.mastered - a.mastered || b.plays - a.plays);
  const untouched = (report?.decks ?? []).filter((d) => !d.everOpened);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/informe"
          aria-label="Back to the parent report"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          📊
        </Link>
        <span aria-hidden className="text-4xl">
          {avatar ?? ""}
        </span>
      </header>

      <div className="text-center">
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          {meta.glyph} {meta.english}
        </h1>
        {report !== null && (
          <p className="mt-1 text-base font-semibold text-ink/60">
            <strong className="text-2xl font-extrabold text-ink">
              {report.mastered}
            </strong>{" "}
            de {report.totalWords} palabras dominadas ·{" "}
            {plural(report.totalPlays, "juego terminado", "juegos terminados")}
          </p>
        )}
      </div>

      {report === null ? (
        <p className="text-center font-semibold text-ink/50">…</p>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-extrabold">📔 Sus estantes</h2>
            {/* Identity is never colour-alone: each state is spelled out here
                and repeated as text under every meter. */}
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-ink/60">
              <span className="flex items-center gap-1">
                <span
                  aria-hidden
                  className="h-3 w-5 rounded-full border-2 border-ink"
                  style={{ background: MASTERED }}
                />
                dominadas
              </span>
              <span className="flex items-center gap-1">
                <span
                  aria-hidden
                  className="h-3 w-5 rounded-full border-2 border-ink"
                  style={{ background: SHAKY, backgroundImage: HATCH }}
                />
                flojas
              </span>
              <span className="flex items-center gap-1">
                <span
                  aria-hidden
                  className="h-3 w-5 rounded-full border-2 border-ink bg-[color-mix(in_srgb,var(--color-ink)_10%,white)]"
                />
                aún no
              </span>
            </p>
            {opened.length === 0 ? (
              <p className="text-sm font-semibold text-ink/60">
                Todavía no ha abierto ningún estante.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {opened.map((mastery) => {
                  const deck = byId.get(mastery.deckId);
                  return deck === undefined ? null : (
                    <ShelfSlot key={mastery.deckId} deck={deck} mastery={mastery} />
                  );
                })}
              </ul>
            )}
            {/* The untouched shelves are a count and a list, not 38 identical
                grey cards — as cards they buried the handful with real data,
                which is the opposite of the point. */}
            {untouched.length > 0 && (
              <div className="flex flex-col gap-2 border-t-4 border-dashed border-ink/20 pt-3">
                <h3 className="text-base font-extrabold text-ink/70">
                  📭 Sin abrir ({untouched.length})
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {untouched.map((mastery) => {
                    const deck = byId.get(mastery.deckId);
                    return deck === undefined ? null : (
                      <li
                        key={mastery.deckId}
                        className="flex items-center gap-1 rounded-full border-2 border-ink/30 px-2 py-1 text-xs font-semibold text-ink/60"
                      >
                        <span aria-hidden>{deck.emoji}</span>
                        {deck.nameSpanish}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          <GamesPlayed report={report} />
          <Struggling report={report} byId={byId} />
        </>
      )}
    </main>
  );
}

/** Play counts. One measure, one series — so one hue, and identity comes from
 *  the game's own glyph rather than from colour. */
function GamesPlayed({ report }: { report: KidReport }) {
  const played = report.games.filter((g) => g.plays > 0);
  const never = report.games.filter((g) => g.plays === 0);
  const max = Math.max(...played.map((g) => g.plays), 1);

  return (
    <section className="sticker relative flex flex-col gap-3 p-5">
      <span aria-hidden className="sticker-peel" />
      <h2 className="text-2xl font-extrabold">🎮 Qué juega</h2>
      {played.length === 0 ? (
        <p className="text-sm font-semibold text-ink/60">
          Todavía no ha terminado ningún juego.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {played.map(({ activity, plays }) => (
            <li key={activity} className="flex items-center gap-2 text-sm">
              <span aria-hidden className="w-12 shrink-0 text-lg">
                {ACTIVITY_META[activity].game}
                {ACTIVITY_META[activity].mode}
              </span>
              <span className="w-32 shrink-0 truncate font-semibold text-ink/70">
                {ACTIVITY_META[activity].english}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  aria-hidden
                  className="h-4 rounded-r-md border-2 border-ink"
                  style={{
                    width: `${Math.max(4, (plays / max) * 100)}%`,
                    background: MASTERED,
                  }}
                />
                <span className="shrink-0 font-extrabold">{plays}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {never.length > 0 && (
        <p className="text-xs font-semibold text-ink/60">
          <strong className="font-extrabold">Sin estrenar:</strong>{" "}
          {never.map((g) => ACTIVITY_META[g.activity].english).join(" · ")}
        </p>
      )}
    </section>
  );
}

/** The dinner-table list: every struggling word, not the top five. */
function Struggling({
  report,
  byId,
}: {
  report: KidReport;
  byId: Map<string, Deck>;
}) {
  const total = report.struggling.reduce((n, g) => n + g.cards.length, 0);
  return (
    <section className="sticker relative flex flex-col gap-3 p-5">
      <span aria-hidden className="sticker-peel" />
      <h2 className="text-2xl font-extrabold">🔁 Para practicar</h2>
      {total === 0 ? (
        <p className="text-sm font-semibold text-ink/60">
          Nada atorado ahora mismo. 🎉
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold text-ink/60">
            {plural(total, "palabra", "palabras")}, la más atorada primero.
          </p>
          {report.struggling.map((group) => (
            <div key={group.deckId}>
              <h3 className="text-base font-extrabold text-ink/70">
                {byId.get(group.deckId)?.emoji}{" "}
                {byId.get(group.deckId)?.nameSpanish}
              </h3>
              <p className="text-lg font-semibold">
                {group.cards
                  .map((c) => `${c.emoji} ${c.spanish} (${c.english})`)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
