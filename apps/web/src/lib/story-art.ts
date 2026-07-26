import type { StaticImageData } from "next/image";
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
 * whose key is absent here falls back to its composed emoji scene, so a story
 * can be half-illustrated while the rest is still being drawn — and a story
 * with no art at all looks exactly as it always did.
 *
 * Imports (rather than `/public` paths) are deliberate: the bundler
 * content-hashes them, so a redrawn picture invalidates itself in the service
 * worker's cache-first store. A stable `/public` URL would need a `CACHE` bump
 * in `sw.js` every time art changed (ADR 005, ADR 009).
 *
 * To add art, see `apps/web/src/story-art/README.md`.
 */
const STORY_ART: Readonly<Record<string, StaticImageData>> = {
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
