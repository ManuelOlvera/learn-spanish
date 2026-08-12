# ADR 015: Card art — inline SVG components, keyed from core, emoji as the fallback

- **Date:** 2026-08-12
- **Status:** accepted (extends ADR 009; first art on a vocabulary card)

## Decision

A `VocabularyCard` may carry an **`image` key**. `apps/web` maps that key to a
**hand-written SVG React component** in `src/card-art/` via `lib/card-art.ts` —
presentation-only, the same shape as `story-art.ts` and `deck-theme.ts`, so
`packages/core` never learns what a drawing is. `emoji` stays **required** on
every card as a fallback that should never render. One `CardFace` component
draws the picture everywhere a card picture appears, sizing a drawing at
`1.5em` of the text box it replaces.

## Context

Emoji has no glyph for most body vocabulary. *La mejilla, la pestaña, el
cuello, el codo, la rodilla, la espalda* are not depictable in isolation at
all — what makes them teachable is a whole figure with one part highlighted,
which is how children's body-part books have always done it. Half of **La
cara** could not exist until a card could carry a picture of its own.

- **Inline components, not imported files.** ADR 009 chose committed JPEGs for
  story art, decided by measurement on continuous-tone generated pictures.
  These are flat vector diagrams — a different decision, not a silent extension
  of that one. The CSP is `img-src 'self' data:` and `next/image` would need
  `dangerouslyAllowSVG`; an inline component needs neither, costs no request,
  and rides the already-hashed JS bundle instead of needing its own cache
  invalidation. At ~2 KB each, twelve drawings are ~24 KB of bundle.
- **A key, not a path.** Same reason as `StoryPage.image`: core is
  framework-agnostic and must not know that assets exist.
- **`emoji` stays required.** A card whose key is missing from the map falls
  back to its emoji, because a missing picture must never be a broken screen
  for a child (ADR 009). The cost is that a drawn card carries an emoji that is
  often a poor approximation (`🦾` for *el codo*, `🔙` for *la espalda*) and
  which no kid should ever see.
- **The invariant moved.** "No repeated emoji within a deck" became **no
  repeated *picture*** — `image ?? emoji`, in `cardPicture`. Fallbacks may
  therefore repeat; what a game deals may not.
- **One `CardFace`.** Roughly fifteen components drew `{card.emoji}` directly.
  A word that is a drawing on its flashcard and an emoji in the quiz teaches a
  pre-reader two pictures for one word, so the choke point is the point.

## Consequences

- Adding art is: draw the component, register the key, set `image` on the card.
  A key absent from the map degrades to emoji rather than failing the build —
  the same deliberate trade as story art, and the same blind spot.
- **A deck can now mix drawn and emoji cards, and both new decks do.** It is
  visibly two styles in one book. Accepted deliberately to ship the words that
  had no picture at all; the way out is drawing the rest, not reverting.
- Card art is **not** themed. Drawings carry their own ink, skin and accent
  colours and sit on a white card face in both light and dark, because that is
  what the app already draws a card as.
- The drawing scale (`1.5em`) is matched by eye to an emoji's visual weight, not
  derived: a glyph fills its em box while these fill about three quarters of a
  shared 200×200 frame. Retuning it is one number in `CardFace`.
- Art is **not** precached, and needs no `CACHE` bump in `sw.js` — being part
  of the JS bundle, it is already covered by whatever the shell caches.
- The pack's picture vocabulary is no longer capped by what Unicode happens to
  encode. The cap is now whether two cards in a deck reduce to the same
  silhouette at the ~96px a picture-choice tile gives them.
