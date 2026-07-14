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
  { id: "menta", nameSpanish: "Menta", cost: 60, paper: "#dff5e8" },
  { id: "chicle", nameSpanish: "Chicle", cost: 60, paper: "#fce1ee" },
  { id: "cielo", nameSpanish: "Cielo", cost: 60, paper: "#e2edfb" },
  { id: "sol", nameSpanish: "Sol", cost: 90, paper: "#fdf1cf" },
  { id: "lavanda", nameSpanish: "Lavanda", cost: 90, paper: "#efe5fb" },
  { id: "durazno", nameSpanish: "Durazno", cost: 130, paper: "#fde5d2" },
  { id: "aguamarina", nameSpanish: "Aguamarina", cost: 130, paper: "#dcf4ef" },
  { id: "limon", nameSpanish: "Limón", cost: 170, paper: "#f2f9d6" },
  { id: "coral", nameSpanish: "Coral", cost: 200, paper: "#fcdcd4" },
  { id: "nube", nameSpanish: "Nube", cost: 250, paper: "#eaedf6" },
  { id: "miel", nameSpanish: "Miel", cost: 300, paper: "#fbe8c0" },
  { id: "salvia", nameSpanish: "Salvia", cost: 300, paper: "#e3ede2" },
  { id: "hielo", nameSpanish: "Hielo", cost: 350, paper: "#e7f4f9" },
  { id: "malva", nameSpanish: "Malva", cost: 400, paper: "#f3e0ec" },
  { id: "perla", nameSpanish: "Perla", cost: 450, paper: "#f4f1ec" },
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
