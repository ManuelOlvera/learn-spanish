"use client";

import { isKidId, type KidId } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

const STORAGE_KEY = "palabras.kid.v1";

/** How each kid profile is drawn — avatars are presentation, levels are core. */
export const KID_META: Record<
  KidId,
  { avatar: string; name: string; glyph: string; english: string }
> = {
  listener: { avatar: "🦖", name: "Dino", glyph: "👂", english: "listen level" },
  reader: { avatar: "🦄", name: "Úni", glyph: "🔤", english: "read level" },
};

export function getSelectedKid(): KidId | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw !== null && isKidId(raw) ? raw : null;
  } catch (err) {
    log.warn("kid", "kid selection unreadable", { err });
    return null;
  }
}

export function setSelectedKid(kid: KidId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, kid);
  } catch (err) {
    log.warn("kid", "could not persist kid selection", { err });
  }
}
