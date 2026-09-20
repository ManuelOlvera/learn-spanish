"use client";

import {
  AVATAR_CATALOG,
  isKidId,
  type KidId,
  type KidLevel,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

const STORAGE_KEY = "palabras.kid.v1";
const AVATAR_STORAGE_KEY = "palabras.avatars.v1";

/** How each kid profile is drawn — avatars are presentation, levels are core. */
/**
 * How a *level* is labelled — 👂 and 🔤, the glyphs the games already use.
 *
 * This used to hang off `KidId`, which was fine while the id *was* the level.
 * Since roadmap 18 a profile's level can change, so anything naming a level
 * has to read it from `levelFor(kid, levels)` rather than from the id, or a
 * promoted kid is labelled "listen level" on the screen her parent just
 * promoted her on.
 */
export const LEVEL_META: Record<
  KidLevel,
  { readonly glyph: string; readonly english: string }
> = {
  listen: { glyph: "👂", english: "listen level" },
  read: { glyph: "🔤", english: "read level" },
};

/** A profile's default avatar, plus the label of the level its id implies.
 *  Prefer `LEVEL_META[levelFor(kid, levels)]` wherever the level is known. */
export const KID_META: Record<
  KidId,
  { defaultAvatar: string; glyph: string; english: string }
> = {
  listener: { defaultAvatar: "🦖", ...LEVEL_META.listen! },
  reader: { defaultAvatar: "🦄", ...LEVEL_META.read! },
};

/** The avatars a kid can pick from — the core catalog carries their star costs. */
export const AVATAR_CHOICES: readonly string[] = AVATAR_CATALOG.map((a) => a.emoji);

function readAvatars(): Partial<Record<KidId, string>> {
  try {
    const raw = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }
    const result: Partial<Record<KidId, string>> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isKidId(key) && typeof value === "string" && value !== "") {
        result[key] = value;
      }
    }
    return result;
  } catch (err) {
    log.warn("kid", "avatar storage unreadable", { err });
    return {};
  }
}

export function getAvatar(kid: KidId): string {
  return readAvatars()[kid] ?? KID_META[kid].defaultAvatar;
}

export function getAvatars(): Partial<Record<KidId, string>> {
  return readAvatars();
}

export function setAvatar(kid: KidId, avatar: string): void {
  try {
    const all = readAvatars();
    all[kid] = avatar;
    window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    log.warn("kid", "could not persist avatar", { err });
  }
}

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
