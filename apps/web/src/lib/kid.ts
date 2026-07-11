"use client";

import { AVATAR_CATALOG, isKidId, type KidId } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

const STORAGE_KEY = "palabras.kid.v1";
const AVATAR_STORAGE_KEY = "palabras.avatars.v1";

/** How each kid profile is drawn — avatars are presentation, levels are core. */
export const KID_META: Record<
  KidId,
  { defaultAvatar: string; glyph: string; english: string }
> = {
  listener: { defaultAvatar: "🦖", glyph: "👂", english: "listen level" },
  reader: { defaultAvatar: "🦄", glyph: "🔤", english: "read level" },
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
