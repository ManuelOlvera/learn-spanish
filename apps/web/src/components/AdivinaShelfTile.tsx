"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { KidId } from "@learn-spanish/core";
import { getSelectedKid } from "@/lib/kid";
import { deckAccent } from "@/lib/deck-theme";

interface Props {
  groupId: string;
}

/**
 * The 🔡 Adivina la palabra tile on a shelf. It lives beside the decks
 * because the game is played over the whole category, not one deck — the
 * same slot El abecedario takes on the letters shelf.
 *
 * Client-side only because it is reader-level: the pre-reader's shelf must
 * not show it, and the selected kid is a browser-storage value.
 */
export function AdivinaShelfTile({ groupId }: Props) {
  const [kid, setKid] = useState<KidId | null | undefined>(undefined);

  useEffect(() => {
    setKid(getSelectedKid());
  }, []);

  if (kid === "listener" || kid === undefined) {
    return null;
  }

  return (
    <Link
      href={`/group/${groupId}/adivina`}
      style={{ "--accent": deckAccent(groupId) } as React.CSSProperties}
      className="sticker pop-in relative flex min-h-44 flex-col items-center justify-center gap-2 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
    >
      <span aria-hidden className="sticker-peel" />
      <span aria-hidden className="text-6xl sm:text-7xl">
        🔡
      </span>
      <span className="text-center text-xl font-bold sm:text-2xl">
        Adivina la palabra
      </span>
      <span className="text-sm font-semibold text-ink/50">Guess the word</span>
    </Link>
  );
}
