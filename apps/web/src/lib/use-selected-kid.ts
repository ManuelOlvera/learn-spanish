"use client";

import { useEffect, useState } from "react";
import type { KidId } from "@learn-spanish/core";
import { getSelectedKid } from "./kid";

/**
 * Which kid is playing, read after mount.
 *
 * The read has to happen in an effect: the kid lives in browser storage, and
 * every route here is prerendered, so reading during render would throw on the
 * server and swap the screen out from under the kid on hydration.
 *
 * That forces a three-state answer, and the states are not interchangeable —
 * **"still reading" is not "nobody picked"**. Ten components used to spell this
 * out for themselves and landed on three different conventions between them;
 * six collapsed the first two states into one `null`, which is what lets a
 * screen flash its no-kid branch for a frame before the real answer arrives.
 * Naming the states here is the point of the hook, not saving the three lines.
 */
export type SelectedKid =
  | { readonly status: "loading" }
  | { readonly status: "none" }
  | { readonly status: "picked"; readonly kid: KidId };

const LOADING: SelectedKid = { status: "loading" };

/** The full three-state answer, for screens that treat "nobody picked" as its
 *  own case (a kid picker, a tile that hides itself until a kid is chosen). */
export function useSelectedKid(): SelectedKid {
  const [state, setState] = useState<SelectedKid>(LOADING);
  useEffect(() => {
    const picked = getSelectedKid();
    setState(picked === null ? { status: "none" } : { status: "picked", kid: picked });
  }, []);
  return state;
}

/**
 * The same read for screens that have a sensible default and do not care
 * whether the kid was chosen or assumed — most game screens. `null` means
 * *still reading*, and callers render their blank frame for it; after that it
 * is always a real kid.
 */
export function useSelectedKidOr(fallback: KidId): KidId | null {
  const state = useSelectedKid();
  if (state.status === "loading") {
    return null;
  }
  return state.status === "picked" ? state.kid : fallback;
}
