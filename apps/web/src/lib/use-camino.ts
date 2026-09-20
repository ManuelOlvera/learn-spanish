"use client";

import { useEffect, useState } from "react";
import {
  buildCamino,
  groupsInTrailOrder,
  type Camino,
  type Deck,
  type DeckGroup,
  type KidId,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { getAlbum } from "@/lib/client-container";
import {
  getExamRecords,
  getLevels,
  getStickerCounts,
  getUnlockedShelves,
} from "@/lib/economy";

/**
 * El camino for the selected kid, or null while it's unknown (storage not read
 * yet, or no kid picked). Shelf progress is derived from the album on every
 * read, so it re-reads when the tab comes back — which is also when a sync
 * pull may have brought another device's stickers, or another device's exam
 * passes, in. A pass landing from the tablet must open the phone's next shelf
 * on the same pass, so the exam ledger is read here too and never cached
 * separately.
 */
export function useCamino(
  groups: readonly DeckGroup[],
  decks: readonly Deck[],
  kid: KidId | null | undefined,
  /** Bump to force a re-read — home passes its sync nonce, so a cross-device
   *  pull that lands after the tab is already visible still moves the pips. */
  nonce = 0,
): Camino | null {
  const [camino, setCamino] = useState<Camino | null>(null);

  useEffect(() => {
    if (!kid) {
      setCamino(null);
      return;
    }
    let cancelled = false;
    const read = () => {
      getAlbum
        .execute(kid)
        .then((earned) => {
          if (!cancelled) {
            setCamino(
              buildCamino(
                groupsInTrailOrder(groups),
                decks,
                kid,
                earned,
                getStickerCounts(),
                // The gate: which shelves are open is decided here, so this
                // must be read on the same pass as the album (ADR 021).
                getExamRecords(kid),
                getUnlockedShelves(kid),
                // Read on the same pass as the album: a promotion changes
                // which activities count toward a shelf, so a stale level
                // would draw the route against the wrong bar.
                getLevels(),
              ),
            );
          }
        })
        .catch((err: unknown) => log.error("camino", "failed to load", { err }));
    };
    read();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        read();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [groups, decks, kid, nonce]);

  return camino;
}
