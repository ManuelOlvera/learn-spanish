import type { ComponentType } from "react";
import { BarrigaArt } from "@/card-art/barriga";
import { BocaArt } from "@/card-art/boca";
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
import { CirculoArt } from "@/card-art/circulo";
import { CorazonFormaArt } from "@/card-art/corazon-forma";
import { CruzArt } from "@/card-art/cruz";
import { CuadradoArt } from "@/card-art/cuadrado";
import { EspiralArt } from "@/card-art/espiral";
import { EstrellaFormaArt } from "@/card-art/estrella-forma";
import { FlechaArt } from "@/card-art/flecha";
import { HexagonoArt } from "@/card-art/hexagono";
import { OvaloArt } from "@/card-art/ovalo";
import { RectanguloArt } from "@/card-art/rectangulo";
import { RomboArt } from "@/card-art/rombo";
import { TrianguloArt } from "@/card-art/triangulo";
import { AbajoArt } from "@/card-art/abajo";
import { AlLadoArt } from "@/card-art/al-lado";
import { ArribaArt } from "@/card-art/arriba";
import { CercaArt } from "@/card-art/cerca";
import { DebajoArt } from "@/card-art/debajo";
import { DelanteArt } from "@/card-art/delante";
import { DentroArt } from "@/card-art/dentro";
import { DetrasArt } from "@/card-art/detras";
import { EnMedioArt } from "@/card-art/en-medio";
import { EncimaArt } from "@/card-art/encima";
import { FueraArt } from "@/card-art/fuera";
import { LejosArt } from "@/card-art/lejos";

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
  // La cara / El cuerpo: a whole figure with one part coloured in. These keys
  // predate the key-equals-id rule, so "pelo-cara" draws "pelo".
  barriga: BarrigaArt,
  boca: BocaArt,
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
  // Las formas: one fill, one stroke, only the geometry changing.
  circulo: CirculoArt,
  "corazon-forma": CorazonFormaArt,
  cruz: CruzArt,
  cuadrado: CuadradoArt,
  espiral: EspiralArt,
  "estrella-forma": EstrellaFormaArt,
  flecha: FlechaArt,
  hexagono: HexagonoArt,
  ovalo: OvaloArt,
  rectangulo: RectanguloArt,
  rombo: RomboArt,
  triangulo: TrianguloArt,
  // ¿Dónde está?: one cat, one box, the cat moved (see posicion-scene.tsx).
  // Both decks keep key === card id, so this half of the map reads as a list
  // of the words themselves.
  abajo: AbajoArt,
  "al-lado": AlLadoArt,
  arriba: ArribaArt,
  cerca: CercaArt,
  debajo: DebajoArt,
  delante: DelanteArt,
  dentro: DentroArt,
  detras: DetrasArt,
  "en-medio": EnMedioArt,
  encima: EncimaArt,
  fuera: FueraArt,
  lejos: LejosArt,
};

export function cardArt(key: string | undefined): CardArt | null {
  return key === undefined ? null : (CARD_ART[key] ?? null);
}
