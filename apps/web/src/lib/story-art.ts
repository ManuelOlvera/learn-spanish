import type { StaticImageData } from "next/image";
import elefanteBaila1 from "@/story-art/elefante-baila-1.jpg";
import elefanteBaila2 from "@/story-art/elefante-baila-2.jpg";
import elefanteBaila3 from "@/story-art/elefante-baila-3.jpg";
import elefanteBaila4 from "@/story-art/elefante-baila-4.jpg";
import elefanteBaila5 from "@/story-art/elefante-baila-5.jpg";
import elefanteBaila6 from "@/story-art/elefante-baila-6.jpg";
import gatoPez1 from "@/story-art/gato-pez-1.jpg";
import gatoPez2 from "@/story-art/gato-pez-2.jpg";
import gatoPez3 from "@/story-art/gato-pez-3.jpg";
import gatoPez4 from "@/story-art/gato-pez-4.jpg";
import gatoPez5 from "@/story-art/gato-pez-5.jpg";
import gatoPez6 from "@/story-art/gato-pez-6.jpg";
import halloweenJapon1 from "@/story-art/halloween-japon-1.jpg";
import halloweenJapon2 from "@/story-art/halloween-japon-2.jpg";
import halloweenJapon3 from "@/story-art/halloween-japon-3.jpg";
import halloweenJapon4 from "@/story-art/halloween-japon-4.jpg";
import halloweenJapon5 from "@/story-art/halloween-japon-5.jpg";
import halloweenJapon6 from "@/story-art/halloween-japon-6.jpg";
import halloweenJapon7 from "@/story-art/halloween-japon-7.jpg";
import halloweenJapon8 from "@/story-art/halloween-japon-8.jpg";
import lunaGalleta1 from "@/story-art/luna-galleta-1.jpg";
import lunaGalleta2 from "@/story-art/luna-galleta-2.jpg";
import lunaGalleta3 from "@/story-art/luna-galleta-3.jpg";
import lunaGalleta4 from "@/story-art/luna-galleta-4.jpg";
import lunaGalleta5 from "@/story-art/luna-galleta-5.jpg";
import lunaGalleta6 from "@/story-art/luna-galleta-6.jpg";
import mundial20101 from "@/story-art/mundial-2010-1.jpg";
import mundial20102 from "@/story-art/mundial-2010-2.jpg";
import mundial20103 from "@/story-art/mundial-2010-3.jpg";
import mundial20104 from "@/story-art/mundial-2010-4.jpg";
import mundial20105 from "@/story-art/mundial-2010-5.jpg";
import mundial20106 from "@/story-art/mundial-2010-6.jpg";
import mundial20107 from "@/story-art/mundial-2010-7.jpg";
import mundial20108 from "@/story-art/mundial-2010-8.jpg";
import mundial20231 from "@/story-art/mundial-2023-1.jpg";
import mundial20232 from "@/story-art/mundial-2023-2.jpg";
import mundial20233 from "@/story-art/mundial-2023-3.jpg";
import mundial20234 from "@/story-art/mundial-2023-4.jpg";
import mundial20235 from "@/story-art/mundial-2023-5.jpg";
import mundial20236 from "@/story-art/mundial-2023-6.jpg";
import mundial20237 from "@/story-art/mundial-2023-7.jpg";
import mundial20238 from "@/story-art/mundial-2023-8.jpg";
import mundial20261 from "@/story-art/mundial-2026-1.jpg";
import mundial20262 from "@/story-art/mundial-2026-2.jpg";
import mundial20263 from "@/story-art/mundial-2026-3.jpg";
import mundial20264 from "@/story-art/mundial-2026-4.jpg";
import mundial20265 from "@/story-art/mundial-2026-5.jpg";
import mundial20266 from "@/story-art/mundial-2026-6.jpg";
import mundial20267 from "@/story-art/mundial-2026-7.jpg";
import mundial20268 from "@/story-art/mundial-2026-8.jpg";
import osoDormir1 from "@/story-art/oso-dormir-1.jpg";
import osoDormir2 from "@/story-art/oso-dormir-2.jpg";
import osoDormir3 from "@/story-art/oso-dormir-3.jpg";
import osoDormir4 from "@/story-art/oso-dormir-4.jpg";
import osoDormir5 from "@/story-art/oso-dormir-5.jpg";
import osoDormir6 from "@/story-art/oso-dormir-6.jpg";
import perroPelota1 from "@/story-art/perro-pelota-1.jpg";
import perroPelota2 from "@/story-art/perro-pelota-2.jpg";
import perroPelota3 from "@/story-art/perro-pelota-3.jpg";
import perroPelota4 from "@/story-art/perro-pelota-4.jpg";
import perroPelota5 from "@/story-art/perro-pelota-5.jpg";
import perroPelota6 from "@/story-art/perro-pelota-6.jpg";
import ranaLluvia1 from "@/story-art/rana-lluvia-1.jpg";
import ranaLluvia2 from "@/story-art/rana-lluvia-2.jpg";
import ranaLluvia3 from "@/story-art/rana-lluvia-3.jpg";
import ranaLluvia4 from "@/story-art/rana-lluvia-4.jpg";
import ranaLluvia5 from "@/story-art/rana-lluvia-5.jpg";
import ranaLluvia6 from "@/story-art/rana-lluvia-6.jpg";

/**
 * Story page art — presentation-only, like `deck-theme.ts`, so `packages/core`
 * never learns what a file is. A story page carries an `image` *key*; this
 * module maps that key to the imported asset.
 *
 * Registering art is two lines: import the file, add it to the map. A page
 * whose key is absent here falls back to its composed emoji scene — every
 * cuento is illustrated today, but that fallback is what let the pack ship
 * and grow one story at a time, and it stays the safety net for new ones.
 *
 * Imports (rather than `/public` paths) are deliberate: the bundler
 * content-hashes them, so a redrawn picture invalidates itself in the service
 * worker's cache-first store. A stable `/public` URL would need a `CACHE` bump
 * in `sw.js` every time art changed (ADR 005, ADR 009).
 *
 * To add art, see `apps/web/src/story-art/README.md`.
 */
const STORY_ART: Readonly<Record<string, StaticImageData>> = {
  "elefante-baila-1": elefanteBaila1,
  "elefante-baila-2": elefanteBaila2,
  "elefante-baila-3": elefanteBaila3,
  "elefante-baila-4": elefanteBaila4,
  "elefante-baila-5": elefanteBaila5,
  "elefante-baila-6": elefanteBaila6,
  "gato-pez-1": gatoPez1,
  "gato-pez-2": gatoPez2,
  "gato-pez-3": gatoPez3,
  "gato-pez-4": gatoPez4,
  "gato-pez-5": gatoPez5,
  "gato-pez-6": gatoPez6,
  "halloween-japon-1": halloweenJapon1,
  "halloween-japon-2": halloweenJapon2,
  "halloween-japon-3": halloweenJapon3,
  "halloween-japon-4": halloweenJapon4,
  "halloween-japon-5": halloweenJapon5,
  "halloween-japon-6": halloweenJapon6,
  "halloween-japon-7": halloweenJapon7,
  "halloween-japon-8": halloweenJapon8,
  "luna-galleta-1": lunaGalleta1,
  "luna-galleta-2": lunaGalleta2,
  "luna-galleta-3": lunaGalleta3,
  "luna-galleta-4": lunaGalleta4,
  "luna-galleta-5": lunaGalleta5,
  "luna-galleta-6": lunaGalleta6,
  "mundial-2010-1": mundial20101,
  "mundial-2010-2": mundial20102,
  "mundial-2010-3": mundial20103,
  "mundial-2010-4": mundial20104,
  "mundial-2010-5": mundial20105,
  "mundial-2010-6": mundial20106,
  "mundial-2010-7": mundial20107,
  "mundial-2010-8": mundial20108,
  "mundial-2023-1": mundial20231,
  "mundial-2023-2": mundial20232,
  "mundial-2023-3": mundial20233,
  "mundial-2023-4": mundial20234,
  "mundial-2023-5": mundial20235,
  "mundial-2023-6": mundial20236,
  "mundial-2023-7": mundial20237,
  "mundial-2023-8": mundial20238,
  "mundial-2026-1": mundial20261,
  "mundial-2026-2": mundial20262,
  "mundial-2026-3": mundial20263,
  "mundial-2026-4": mundial20264,
  "mundial-2026-5": mundial20265,
  "mundial-2026-6": mundial20266,
  "mundial-2026-7": mundial20267,
  "mundial-2026-8": mundial20268,
  "oso-dormir-1": osoDormir1,
  "oso-dormir-2": osoDormir2,
  "oso-dormir-3": osoDormir3,
  "oso-dormir-4": osoDormir4,
  "oso-dormir-5": osoDormir5,
  "oso-dormir-6": osoDormir6,
  "perro-pelota-1": perroPelota1,
  "perro-pelota-2": perroPelota2,
  "perro-pelota-3": perroPelota3,
  "perro-pelota-4": perroPelota4,
  "perro-pelota-5": perroPelota5,
  "perro-pelota-6": perroPelota6,
  "rana-lluvia-1": ranaLluvia1,
  "rana-lluvia-2": ranaLluvia2,
  "rana-lluvia-3": ranaLluvia3,
  "rana-lluvia-4": ranaLluvia4,
  "rana-lluvia-5": ranaLluvia5,
  "rana-lluvia-6": ranaLluvia6,
};

export function storyArt(key: string | undefined): StaticImageData | null {
  return key === undefined ? null : (STORY_ART[key] ?? null);
}
