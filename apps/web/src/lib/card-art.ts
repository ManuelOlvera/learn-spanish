import type { ComponentType } from "react";
import { BarrigaArt } from "@/card-art/barriga";
import { CabezaArt } from "@/card-art/cabeza";
import { CejasArt } from "@/card-art/cejas";
import { CodoArt } from "@/card-art/codo";
import { CuelloArt } from "@/card-art/cuello";
import { EspaldaArt } from "@/card-art/espalda";
import { HombroArt } from "@/card-art/hombro";
import { LabiosArt } from "@/card-art/labios";
import { MejillasArt } from "@/card-art/mejillas";
import { PeloArt } from "@/card-art/pelo";
import { PestanasArt } from "@/card-art/pestanas";
import { RodillaArt } from "@/card-art/rodilla";

/**
 * Card art — presentation-only, like `story-art.ts` and `deck-theme.ts`, so
 * `packages/core` never learns what a drawing is. A card carries an `image`
 * *key*; this module maps that key to the component that draws it.
 *
 * Registering art is two lines: import the component, add it to the map. A
 * card whose key is absent here falls back to its emoji — a missing picture
 * must never be a broken screen for a child (ADR 009, ADR 015).
 *
 * Inline components rather than imported files: the CSP is `img-src 'self'
 * data:` and `next/image` would need `dangerouslyAllowSVG`, while an inline
 * drawing costs no request, no CSP exception, and rides the already-hashed
 * JS bundle instead of needing its own cache invalidation.
 */
export type CardArt = ComponentType<{ className?: string }>;

const CARD_ART: Readonly<Record<string, CardArt>> = {
  barriga: BarrigaArt,
  cabeza: CabezaArt,
  cejas: CejasArt,
  codo: CodoArt,
  cuello: CuelloArt,
  espalda: EspaldaArt,
  hombro: HombroArt,
  labios: LabiosArt,
  mejillas: MejillasArt,
  pelo: PeloArt,
  pestanas: PestanasArt,
  rodilla: RodillaArt,
};

export function cardArt(key: string | undefined): CardArt | null {
  return key === undefined ? null : (CARD_ART[key] ?? null);
}
