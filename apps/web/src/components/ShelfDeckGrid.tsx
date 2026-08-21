"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Deck, DeckGroup, KidId } from "@learn-spanish/core";
import { deckAccent } from "@/lib/deck-theme";
import { getSelectedKid } from "@/lib/kid";
import { useCamino } from "@/lib/use-camino";
import { TrailBadge, TrailPips } from "@/components/TrailMarks";

interface Props {
  /** This shelf's decks, in the order the pack lists them — the camino's order. */
  decks: readonly Deck[];
  groupId: string;
  /** The whole pack, needed to work out where this shelf sits on the route. */
  allGroups: readonly DeckGroup[];
  allDecks: readonly Deck[];
}

/**
 * The deck tiles of one shelf, with el camino drawn on them: pips for how many
 * of this deck's activities are done, a 👉 on the next one, a ⭐ on the
 * finished ones. Client-side because the route is derived from the album,
 * which lives in the browser — the tiles themselves are unchanged otherwise,
 * and nothing is ever locked.
 */
export function ShelfDeckGrid({ decks, groupId, allGroups, allDecks }: Props) {
  const [kid, setKid] = useState<KidId | null | undefined>(undefined);
  useEffect(() => {
    setKid(getSelectedKid());
  }, []);
  const camino = useCamino(allGroups, allDecks, kid);
  const shelf = camino?.shelves.find((s) => s.groupId === groupId);

  return (
    <>
      {decks.map((deck, i) => {
        const step = shelf?.steps.find((s) => s.deckId === deck.id);
        return (
          <Link
            key={deck.id}
            href={`/deck/${deck.id}`}
            style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
            className="sticker pop-in relative flex min-h-44 flex-col items-center justify-center gap-2 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
          >
            <span aria-hidden className="sticker-peel" />
            {deck.id === camino?.nextDeckId && <TrailBadge state="next" />}
            {step?.complete === true && <TrailBadge state="done" />}
            <span
              aria-hidden
              className="text-6xl sm:text-7xl"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {deck.emoji}
            </span>
            <span className="text-center text-xl font-bold sm:text-2xl">
              {deck.nameSpanish}
            </span>
            <span className="text-sm font-semibold text-ink/50">
              {deck.nameEnglish}
            </span>
            {step !== undefined && (
              <TrailPips
                filled={step.done}
                total={step.target}
                label={`${deck.nameSpanish}, juegos terminados`}
              />
            )}
          </Link>
        );
      })}
    </>
  );
}
