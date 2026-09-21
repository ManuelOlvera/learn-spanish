"use client";

import { useEffect, useMemo, useState } from "react";
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

  // Keyed on *content*, not on array identity. A caller that filters inline —
  // `decks.filter(d => !d.secret)` — mints a fresh array every render, and
  // with the arrays themselves as dependencies this effect re-ran, set state,
  // and re-rendered, forever: /camino read the album ~4,700 times a second and
  // nothing on the page was ever stable enough to tap. HomeView had memoized
  // around it and left a comment; the second caller did not, so the guard
  // belongs here rather than in each caller.
  const deckKey = decks.map((d) => d.id).join(",");
  const groupKey = groups.map((g) => g.id).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pack = useMemo(() => ({ groups, decks }), [groupKey, deckKey]);

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
                groupsInTrailOrder(pack.groups),
                pack.decks,
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
  }, [pack, kid, nonce]);

  return camino;
}
