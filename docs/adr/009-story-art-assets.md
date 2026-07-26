# ADR 009: Story art — committed JPEGs imported from `src/`, no precache

- **Date:** 2026-07-26
- **Status:** accepted (first content art in the app; extends ADR 005)

## Decision

Illustrated story pages carry **committed JPEG files under
`apps/web/src/story-art/`**, imported by a presentation-only map
(`lib/story-art.ts`) that resolves a page's `image` *key* to an asset. Art is
resized to 800px and encoded at quality 68 by
`apps/web/scripts/optimize-story-art.sh` (`pnpm art`) using macOS's built-in
`sips`, capped at 200 KB per image. Originals live in a gitignored
`art-source/<story-id>/<page>.png`. Story art is **not precached** by the
service worker: it ships as an ordinary hashed asset and is cached on first
view like everything else.

## Context

Los cuentos shipped with composed emoji scenes. Emoji cost nothing and stay
consistent, but a storybook for a pre-reader lives on its pictures, so the page
model always reserved an optional `image`. Actually filling it makes this the
first time the repo carries **content art** — every asset until now was emoji,
CSS, one self-hosted font, and two SVG icons. That is a category change worth
recording, because four separate forces pull on it:

- **No build-time network** (a standing rule). Whatever the art is, it is
  committed, and the toolchain must be something a machine already has.
- **JPEG, decided by measurement — not the format this ADR first assumed.**
  The original draft said PNG, reasoning that lossless keeps bold marker
  outlines crisp. That was right in principle and wrong in fact: the generated
  art *looks* flat but is rendered with soft gradients and continuous tone, and
  `sips` writes 24-bit PNG with no palette quantization, so a 900px page landed
  at **700–900 KB — about 5 MB for one six-page story**. The same pages at JPEG
  q75 are 62–118 KB (609 KB for the story, an 8× saving) with no ringing
  visible in a 384px-wide card, which is the only size a child ever sees. WebP
  would beat both, but `sips` can only *read* it and this repo has no `cwebp`
  or ImageMagick — requiring one would make the build depend on a tool that may
  be absent.
- **`src/`, not `public/`.** ADR 005 makes same-origin subresources
  **cache-first**. A hashed asset self-invalidates when the picture is redrawn;
  a stable `/public/stories/…` URL would be pinned in the service worker's
  cache until someone remembered to bump `CACHE` in `sw.js` — exactly the trap
  ADR 005 warns about for shell assets.
- **Core stays ignorant of files.** `packages/core` may not know what a PNG is,
  so `StoryPage.image` is a key and the app owns the mapping — the same shape
  as `deck-theme.ts` mapping a deck id to a colour.

Precaching was considered and rejected for now. It would make every story work
offline from install, including ones never opened, at the cost of install size
and of putting art on the `CACHE`-bump treadmill. Cache-first already gives the
property that matters: a story read once is available on the next flight.

## Consequences

- A **filename** typo fails the build (the import doesn't resolve). A **key**
  mismatch between the story pack and the art map does not — that page quietly
  falls back to its emoji scene. Chosen deliberately: a missing picture must
  never be a broken screen for a child. A core test pins keys to the
  `<storyId>-<pageNumber>` convention, which is what catches the mismatch.
- A story never opened online has no pictures offline. Acceptable while the
  pack is part-illustrated; revisit if every story gets art and road trips are
  a real use case.
- Adding art is: generate → `pnpm art` → register in the map → set the page's
  `image`. Emoji scenes remain the default and the fallback, so new stories are
  never blocked on pictures.
- **Sizing was retuned once, by measurement.** The first pass used 900px/q75
  with a 150 KB ceiling, tuned on quiet scenes. A stadium crowd — thousands of
  tiny distinct shapes, the worst case for JPEG — blew straight through it at
  190–265 KB while being perfectly on-style. 800px covers the 384 CSS-px
  picture area at 2× with headroom, and q68 is indistinguishable there, so the
  busiest page now fits in 184 KB and every quiet page got smaller too.
- The ceiling is therefore **no longer a style guard**. A breach means "look at
  this image", not "this image is wrong": busy is legitimate, photographic is
  not.
- **Budget the whole pack, not the page.** A quiet six-page story is ~300–450 KB
  and a busy eight-page one ~1.3 MB; seven illustrated stories are 3.6 MB of
  cached art today, and all ten would be near 6 MB. Fine on demand, which is
  another reason precaching stays rejected — precaching would put that on every
  install.
- JPEG has no alpha. Story art is a full-bleed rectangle in a framed box, so
  this costs nothing today; a page wanting a cut-out subject would need to
  revisit the format.
- If a WebP encoder ever lands, it is a one-line change in the script and the
  budget can drop again; nothing else moves.
