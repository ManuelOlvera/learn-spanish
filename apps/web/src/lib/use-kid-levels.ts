"use client";

import { useEffect, useState } from "react";
import { gameModesFor, levelFor, type KidId, type KidLevels } from "@learn-spanish/core";
import { getLevels } from "@/lib/economy";

/**
 * Every profile's difficulty level, read after mount.
 *
 * Same constraint as `useSelectedKid`: levels live in browser storage and
 * every route here is prerendered, so reading during render would throw on the
 * server. Unlike the kid there is no "nobody picked" state — an absent level
 * means the one its profile id has always implied, so `{}` is a correct answer
 * rather than a loading one, and a screen that renders with it renders exactly
 * as it did before roadmap 18.
 *
 * `nonce` re-reads: the parent screen changes a level and needs its own view
 * to catch up without a navigation, the same way la llave de papá does.
 */
export function useKidLevels(nonce = 0): KidLevels {
  const [levels, setLevels] = useState<KidLevels>({});
  useEffect(() => {
    setLevels(getLevels());
  }, [nonce]);
  return levels;
}

/** The modes this kid's games play at — the level's answer, not the id's. */
export function useGameModes(kid: KidId | null | undefined) {
  const levels = useKidLevels();
  return gameModesFor(levelFor(kid ?? "listener", levels));
}
