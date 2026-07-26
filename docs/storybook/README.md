# Storybook — image prompts for Los cuentos

One file per story, each holding six ready-to-paste image prompts. Copy a block,
paste it into ChatGPT / the Codex app / Gemini, save the result, run `pnpm art`.

| Story | Id | Art |
|---|---|---|
| [La rana y la lluvia 🐸](rana-lluvia.md) | `rana-lluvia` | ✅ illustrated |
| [El gato y el pez 🐱](gato-pez.md) | `gato-pez` | ⬜ emoji scenes |
| [El perro y la pelota 🐶](perro-pelota.md) | `perro-pelota` | ⬜ emoji scenes |
| [El elefante que quiere bailar 🐘](elefante-baila.md) | `elefante-baila` | ⬜ emoji scenes |
| [La luna es una galleta 🌙](luna-galleta.md) | `luna-galleta` | ⬜ emoji scenes |
| [El oso no puede dormir 🐻](oso-dormir.md) | `oso-dormir` | ⬜ emoji scenes |

A story with no art shows its composed emoji scenes instead, so illustrating is
never urgent and can happen one story at a time. The full pipeline lives in
[`apps/web/src/story-art/README.md`](../../apps/web/src/story-art/README.md);
the format and offline decisions are [ADR 009](../adr/009-story-art-assets.md).

## The two rules

- **The style paragraph and the character sheet are identical in every prompt
  of a story.** That repetition *is* the consistency. If a page comes out
  wrong, regenerate it with those untouched and only the scene line changed.
- **No text in the image, ever.** The audience cannot read, generators garble
  lettering, and a word baked into a picture cannot be changed later.

## The cast bible

Characters recur across stories, so each one has a single fixed description
used everywhere it appears. Keeping these stable is what makes six stories feel
like one little world rather than six unrelated books.

| Character | Appears in |
|---|---|
| The frog, the snail | `rana-lluvia` |
| The cat | `gato-pez`, `perro-pelota` |
| The fish | `gato-pez` |
| The dog | `perro-pelota` |
| The elephant | `elefante-baila` |
| The mouse | `elefante-baila`, `luna-galleta` |
| The moon | `luna-galleta`, `oso-dormir` |
| The bear, the teddy | `oso-dormir` |

Two of those are shared on purpose and were a real choice, not an accident:

- **The cat in *El gato y el pez* is the same cat as in *El perro y la
  pelota*.** It gets soaked by a fish in one story and rescues a ball from a
  tree in the other — a small continuity a child can notice on their own.
- **The mouse in *El elefante* is the same mouse as in *La luna es una
  galleta*.** The one who drums for the elephant is the one who tries to eat
  the moon.

If you ever want them to be different characters, change the sheet in **both**
files at once and say so here — the failure mode is drifting between them by
accident, not choosing either way.

## Adding a seventh story

Write the story first (`packages/core/src/infrastructure/story-pack.ts`), then
copy any file here as a template: keep the style paragraph byte-for-byte, add a
character sheet for anyone new (and reuse the sheet verbatim for anyone who
already exists), and write one scene line per page from the story's own text.
