# Story art

Illustrations for Los cuentos. A story page shows its picture when one is
registered; otherwise it falls back to the composed emoji scene, so a story
can be half-illustrated while art is still being made.

## How to add art to a story

1. **Generate the images** with that story's prompts from
   [`docs/storybook/`](../../../../docs/storybook/README.md). Ask for **4:3
   landscape** (3:2 is fine too — the picture area crops to fit).
2. **Save them** into `apps/web/art-source/<story-id>/<page>.png` — one folder
   per story, pages numbered from 1, e.g. `art-source/rana-lluvia/1.png`. The
   folder name *is* the story id; that is what lets the output filename match
   the `image` key. `art-source/` is gitignored — it holds the originals.
3. **Run** `pnpm art` from the repo root. It resizes to 900px, encodes JPEG
   q75 into this folder as `<story-id>-<page>.jpg`, and fails if any image is
   over the per-file budget.
4. **Register** each image in `apps/web/src/lib/story-art.ts`.
5. **Point the page at it**: add `image: "rana-lluvia-1"` to that page in
   `packages/core/src/infrastructure/story-pack.ts`.

An `image` key with no registered art quietly falls back to the emoji scene —
the story keeps working. A *filename* typo fails the build immediately, because
the art map imports the file directly.

## The prompts

Ready-to-paste prompts live in
[`docs/storybook/`](../../../../docs/storybook/README.md) — one file per story,
six complete blocks each, plus the cast bible that keeps recurring characters
identical across stories. They are kept there, not here, so there is only ever
one copy to keep true.

Two rules from that file worth repeating where the files land:

- **No text in the image.** The audience cannot read, generators garble
  lettering, and any word baked into a picture is untranslatable noise.
- **Regenerate a bad page with the style paragraphs untouched.** Those
  paragraphs are the consistency; only the scene line should change.

## Why JPEG, and why these live in `src/`

JPEG because it was measured, not assumed. This art *looks* flat but is
rendered with soft gradients, and `sips` writes 24-bit PNG with no palette
quantization — a 900px page came out at 700–900 KB, about **5 MB for one
six-page story**. The same pages at JPEG q75 are 62–118 KB (609 KB for the
story) with no ringing visible in a 384px-wide card, which is the only size a
child ever sees. WebP would be smaller still, but `sips` can only *read* it and
this repo has no `cwebp` or ImageMagick — a build must never depend on a tool
the machine might not have.

They live in `src/` (not `public/`) so the bundler gives them **content-hashed
URLs**. Per ADR 005 the service worker is cache-first for same-origin
subresources: a hashed asset self-invalidates when it changes, while a stable
`/public` URL would be pinned in the cache until someone remembered to bump
`CACHE` in `sw.js`. See `docs/adr/009-story-art-assets.md`.
