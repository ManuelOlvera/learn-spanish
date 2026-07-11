"use client";

import type { KidId } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { spendStars } from "./economy";

/**
 * Home-screen themes are paper-colour skins bought with stars. Ink stays
 * dark on purpose so the sticker outlines and text keep their contrast —
 * a true dark mode would break the white-sticker look, so it's deferred.
 */
export interface Theme {
  readonly id: string;
  readonly nameSpanish: string;
  readonly cost: number;
  readonly paper: string;
}

export const THEMES: readonly Theme[] = [
  { id: "crema", nameSpanish: "Crema", cost: 0, paper: "#fbf3e2" },
  { id: "menta", nameSpanish: "Menta", cost: 20, paper: "#dff5e8" },
  { id: "chicle", nameSpanish: "Chicle", cost: 20, paper: "#fce1ee" },
  { id: "cielo", nameSpanish: "Cielo", cost: 20, paper: "#e2edfb" },
  { id: "sol", nameSpanish: "Sol", cost: 30, paper: "#fdf1cf" },
  { id: "lavanda", nameSpanish: "Lavanda", cost: 30, paper: "#efe5fb" },
];

const OWNED_THEMES_KEY = "palabras.owned-themes.v1";
const SELECTED_THEME_KEY = "palabras.theme.v1";

function readMap(key: string): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch (err) {
    log.warn("theme", `${key} unreadable`, { err });
    return {};
  }
}

function writeMap(key: string, kid: KidId, value: unknown): void {
  try {
    const all = readMap(key);
    all[kid] = value;
    window.localStorage.setItem(key, JSON.stringify(all));
  } catch (err) {
    log.warn("theme", `could not persist ${key}`, { err });
  }
}

export function getOwnedThemes(kid: KidId): readonly string[] {
  const value = readMap(OWNED_THEMES_KEY)[kid];
  return Array.isArray(value) ? (value as string[]) : ["crema"];
}

export function getSelectedTheme(kid: KidId): string {
  const value = readMap(SELECTED_THEME_KEY)[kid];
  return typeof value === "string" ? value : "crema";
}

export function setSelectedTheme(kid: KidId, themeId: string): void {
  writeMap(SELECTED_THEME_KEY, kid, themeId);
  applyTheme(themeId);
}

/** Buy a theme; returns the new balance, or null if unaffordable/owned. */
export function buyTheme(kid: KidId, themeId: string, cost: number): number | null {
  const owned = getOwnedThemes(kid);
  if (owned.includes(themeId)) return null;
  const stars = spendStars(kid, cost);
  if (stars === null) return null;
  writeMap(OWNED_THEMES_KEY, kid, [...owned, themeId]);
  return stars;
}

/** Retint the whole app by overriding the paper CSS variable. */
export function applyTheme(themeId: string): void {
  if (typeof document === "undefined") return;
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;
  document.documentElement.style.setProperty("--color-paper", theme.paper);
}
