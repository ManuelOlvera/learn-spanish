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

/**
 * El camino for the selected kid, or null while it's unknown (storage not read
 * yet, or no kid picked). Derived from the album on every read — there is no
 * trail state on disk — so it re-reads when the tab comes back, which is also
 * when a sync pull may have brought another device's stickers in.
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
            setCamino(buildCamino(groupsInTrailOrder(groups), decks, kid, earned));
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
