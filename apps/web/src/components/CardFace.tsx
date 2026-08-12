import { cardArt } from "@/lib/card-art";
import { emojiSizeClass } from "@/lib/emoji";

/**
 * The picture on a card, wherever a game draws one.
 *
 * Pre-readers navigate by this alone, so it has to be the *same* picture on
 * every screen: a word that is a drawing on its flashcard and an emoji in the
 * quiz teaches two pictures for one word. Every player renders through here
 * so that can't drift apart.
 *
 * `face` is the already-resolved emoji — callers pass it through `cardFace()`
 * themselves because some (the flashcard) must hold the un-cased glyph until
 * the kid's letter-case preference has hydrated.
 *
 * A drawing is sized off the text box it replaces, so every game's existing
 * sizing keeps working untouched. The factor is 1.5em rather than the ~1.15em
 * an emoji glyph occupies: a glyph fills its em box, while these drawings sit
 * in a shared 200×200 frame their subject only fills about three quarters of
 * (the frame is what makes the deck look like one hand drew it). Matched by
 * eye against an emoji card at flashcard size — under-sized art reads as a
 * smaller, less important picture, which is the wrong signal on a card whose
 * whole job is the picture.
 */
export function CardFace({
  image,
  face,
  single,
  wide,
  className = "",
}: {
  image?: string;
  face: string;
  single: string;
  wide: string;
  className?: string;
}) {
  const Art = cardArt(image);
  return (
    <span
      className={`leading-none ${emojiSizeClass(face, single, wide)} ${className}`}
      aria-hidden
    >
      {Art === null ? face : <Art className="block h-[1.5em] w-[1.5em]" />}
    </span>
  );
}
