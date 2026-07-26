# Storybook — image prompts for Los cuentos

One file per story, each holding a ready-to-paste image prompt per page (six for
the little-kid stories, eight for the reader-level ones). Copy a block, paste it
into ChatGPT / the Codex app / Gemini, save the result, run `pnpm art`.

| Story | Id | Art |
|---|---|---|
| [La rana y la lluvia 🐸](rana-lluvia.md) | `rana-lluvia` | ✅ illustrated |
| [El gato y el pez 🐱](gato-pez.md) | `gato-pez` | ✅ illustrated |
| [El perro y la pelota 🐶](perro-pelota.md) | `perro-pelota` | ✅ illustrated |
| [El elefante que quiere bailar 🐘](elefante-baila.md) | `elefante-baila` | ✅ illustrated |
| [La luna es una galleta 🌙](luna-galleta.md) | `luna-galleta` | ✅ illustrated |
| [El oso no puede dormir 🐻](oso-dormir.md) | `oso-dormir` | ✅ illustrated |
| [El gol de Iniesta 🏆](mundial-2010.md) | `mundial-2010` | ✅ illustrated |
| [Las campeonas 🥇](mundial-2023.md) | `mundial-2023` | ✅ illustrated |
| [La segunda estrella ⭐](mundial-2026.md) | `mundial-2026` | ✅ illustrated |
| [Halloween en Japón 🎃](halloween-japon.md) | `halloween-japon` | ⬜ emoji scenes |

The last four are **reader-level**: eight pages, longer sentences, and the
simple past tense, which the decks never teach. They are not gated or tiered —
the shelf is picked by picture and an eight-year-old reliably picks the
football — but they are what stops the shelf reading as babyish to an older
kid. The three Mundial stories are **true**, so their details (the minute, the
scorer, the score) are the real ones; check any change against the record
rather than the story.

A story with no art shows its composed emoji scenes instead, so illustrating is
never urgent and can happen one story at a time. The full pipeline lives in
[`apps/web/src/story-art/README.md`](../../apps/web/src/story-art/README.md);
the format and offline decisions are [ADR 009](../adr/009-story-art-assets.md).

## Camera: pitch level, always

The football stories learned this the hard way. An early prompt asked for a
stadium "seen from high up"; the generator kept that aerial camera for the rest
of the story and then tried to show close action inside it, producing players
larger than the grandstand standing on top of a distant stadium. Every football
prompt now carries an explicit **pitch-level camera rule** — the players are the
subject and fill the frame, the crowd is only a band of colour behind them.

The lesson generalises: **the first picture in a set fixes the camera for all of
them.** If page 1 or 2 establishes a wide or aerial view, expect every later
page to inherit it.

## The three rules

- **The style paragraph and the character sheet are identical in every prompt
  of a story.** That repetition *is* the consistency. If a page comes out
  wrong, regenerate it with those untouched and only the scene line changed.
- **No text in the image, ever.** The audience cannot read, generators garble
  lettering, and a word baked into a picture cannot be changed later.
- **No white border.** The picture area already has its own ink frame, so an
  image that draws its own mat reads as a double frame. The prompts now say
  this explicitly — an earlier wording ("a generous empty margin around the
  subject") was taken literally by one batch, which came back with a 164px
  white mat on every page. If it happens again, crop it before running
  `pnpm art`; the fix is a `sips -c <h> <w> --cropOffset <y> <x>` away.

## The cast bible

Characters recur across stories, so each one has a single fixed description
used everywhere it appears. Keeping these stable is what makes the stories feel
like one little world rather than ten unrelated books — and it works: the cat
and the mouse each came back identical across two separately generated batches.

| Character | Appears in |
|---|---|
| The Spanish players (generic, in red) | `mundial-2010`, `mundial-2023`, `mundial-2026` |
| Noah (5) and Ava (8), siblings | `halloween-japon` |
| The frog, the snail | `rana-lluvia` |
| The cat | `gato-pez`, `perro-pelota` |
| The fish | `gato-pez` |
| The dog | `perro-pelota` |
| The elephant | `elefante-baila` |
| The mouse | `elefante-baila`, `luna-galleta` |
| The moon | `luna-galleta`, `oso-dormir` |
| The bear, the teddy | `oso-dormir` |

**The football stories deliberately have no real people in them.** The prose
names Iniesta, Olga Carmona and Ferran Torres — that is the point of telling a
true story — but the *art* prompts ask for generic cartoon footballers in plain
red shirts, with no faces of real people and no names or numbers on the kit.
Two reasons: image generators are unreliable and often refuse at real
likenesses, and a recognisable player's face is not ours to put in an app.
Same for the Japan story: Universal Studios is **named in the prose** — that is
where the kids actually went — but its prompts ask for a generic cheerful theme
park with no logos, brand marks or recognisable film characters, so nothing
trademarked turns up in the pictures. Its Halloween is drawn jolly rather than
frightening; the audience starts at three.

Two of the animal characters are shared on purpose and were a real choice, not
an accident:

- **The cat in *El gato y el pez* is the same cat as in *El perro y la
  pelota*.** It gets soaked by a fish in one story and rescues a ball from a
  tree in the other — a small continuity a child can notice on their own.
- **The mouse in *El elefante* is the same mouse as in *La luna es una
  galleta*.** The one who drums for the elephant is the one who tries to eat
  the moon.

If you ever want them to be different characters, change the sheet in **both**
files at once and say so here — the failure mode is drifting between them by
accident, not choosing either way.

## Adding another story

Write the story first (`packages/core/src/infrastructure/story-pack.ts`), then
copy any file here as a template: keep the style paragraph byte-for-byte, add a
character sheet for anyone new (and reuse the sheet verbatim for anyone who
already exists), and write one scene line per page from the story's own text.
