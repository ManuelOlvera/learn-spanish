"use client";

import { isLetterCase, type KidId, type LetterCase } from "@learn-spanish/core";
import { readDoc, writeDoc } from "./economy-store";

/**
 * Which case a kid sees on letter cards. Per-kid and device-local (like the
 * theme — a display choice, not progress, per ADR 004). Defaults to
 * uppercase: that's where letter-learning starts; a parent flips to lower or
 * both from the letters shelf as the kid grows.
 */
const LETTER_CASE_KEY = "palabras.letter-case.v1";

export function getLetterCase(kid: KidId): LetterCase {
  const stored: unknown = readDoc<LetterCase>(LETTER_CASE_KEY)[kid];
  return isLetterCase(stored) ? stored : "upper";
}

export function setLetterCase(kid: KidId, letterCase: LetterCase): void {
  writeDoc(LETTER_CASE_KEY, kid, letterCase);
}
