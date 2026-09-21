"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Deck, DeckGroup } from "@learn-spanish/core";
import { useSelectedKidOr } from "@/lib/use-selected-kid";
import { useCamino } from "@/lib/use-camino";
import { CaminoMap } from "@/components/CaminoMap";
import { getAvatar } from "@/lib/kid";

/**
 * The camino screen. Everything it draws is derived — the route holds no state
 * of its own (ADR 016's rule survives) — so this is a view over the album, the
 * exam ledger and la llave, exactly as the strip is.
 */
export function CaminoView({
  decks,
  groups,
}: {
  decks: readonly Deck[];
  groups: readonly DeckGroup[];
}) {
  const kid = useSelectedKidOr("listener");
  // Memoized for the same reason HomeView memoizes it: a fresh array identity
  // every render is what made this screen spin.
  const publicDecks = useMemo(() => decks.filter((d) => !d.secret), [decks]);
  const camino = useCamino(groups, publicDecks, kid);

  const passed = camino?.shelves.filter((s) => s.complete).length ?? 0;
  const total = camino?.shelves.length ?? 0;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4 sm:p-6">
      {/* Sticky, unlike every other screen's header: the map is the one page
          that scrolls far enough to strand a kid — twelve stops is ~1950px
          against a phone viewport, so a header pinned to the top of the
          document leaves no way back once you have scrolled past it. The
          paper background is what stops the cards showing through. */}
      <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between bg-paper px-4 py-2 sm:-mx-6 sm:px-6">
        <Link
          href="/"
          aria-label="Back to all decks"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          {kid ? getAvatar(kid) : ""}
        </span>
      </header>

      <div className="text-center">
        <h1 className="text-4xl font-extrabold sm:text-5xl">🧭 Tu camino</h1>
        {camino !== null && (
          <p className="mt-1 text-base font-semibold text-ink/60">
            {camino.complete ? (
              <strong className="text-ink">¡El camino completo!</strong>
            ) : (
              <>
                <strong className="text-2xl font-extrabold text-ink">{passed}</strong>
                {" "}de {total} estanterías
              </>
            )}
          </p>
        )}
      </div>

      {camino === null ? (
        <p className="text-center font-semibold text-ink/50">…</p>
      ) : (
        <CaminoMap camino={camino} groups={groups} />
      )}
    </main>
  );
}
