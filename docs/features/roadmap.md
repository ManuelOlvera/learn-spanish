# Feature roadmap — two-kid interactivity

Ideas agreed 2026-07-10 to grow ¡Palabras! from a one-mode flashcard app (built
for a 5-year-old pre-reader) into a game both kids can play:

- **Kid A (5):** pre-reader, knows a few Spanish words. Needs picture-and-audio-only
  play, huge targets, zero text dependence.
- **Kid B (8):** reads English, basic Spanish — fair vocabulary, can form simple
  sentences. Needs reading practice and sentence-level input, not just single nouns.

Design principle: **one content pack, two difficulty layers.** Every game reuses the
existing decks/words and scales along a single per-kid mode switch, so nothing is
built twice.

Status legend: ☐ not started · ◐ in progress · ☑ shipped (move write-up to shipped.md)

## The unlocking feature

1. ☐ **Kid picker (per-kid mode)** — home screen offers two big sticker avatars, no
   text. Picking one sets the difficulty mode for every deck and game. This is the
   axis all other features scale along. *(Cut from the first slice 2026-07-10 —
   until it exists, each game exposes its two difficulty modes as separate
   picture buttons instead of reading a per-kid setting.)*

## Games for both kids

2. ☑ **"¿Dónde está…?" — tap-the-right-picture quiz** — app speaks a word, kid taps
   the matching picture. Younger mode: 2 giant choices, audio → picture. Older mode:
   4 choices, written-Spanish prompt (no audio) for reading practice, or a spoken
   sentence prompt ("Toca el animal que dice muu") — sentence prompts deferred.
   *(Shipped 2026-07-10: entry via a per-deck choice screen — 📖 Las tarjetas /
   👂 Escucha / 🔤 Lee. See `shipped.md`.)*
3. ☐ **Memory match (parejas)** — flip-to-match pairs. Younger: picture ↔ picture,
   every flip speaks the word. Older: picture ↔ written Spanish word (forces reading).
4. ☐ **"Sí o no" lightning round** — picture + spoken claim, kid taps ✅/❌
   ("¿Es un gato?"). Older mode swaps in sentences ("El plátano es rojo — ¿sí o no?").
   Cheapest sentence-comprehension feature; needs no text input.
5. ☐ **Say-it-back (voice recording)** — after the card speaks, a big microphone
   button records the kid repeating the word, then plays both back. No grading —
   the comparison is the learning. Identical at both ages.

## Mainly for the older kid (younger-safe)

6. ☐ **Sentence builder** — drag 3–4 word tiles (each with a picture hint) into
   order: *el gato / come / pescado*; completing it speaks the whole sentence.
   Needs a small new deck of verbs/adjectives — the biggest content lift here.
7. ☐ **Word ↔ word matching** — connect written Spanish to a picture (younger) or
   to the English word (older, reading practice).
8. ☐ **Describe-the-card** — the flashcard, but the audio speaks a sentence
   ("La vaca es grande y blanca") instead of a single word.

## Motivation glue (shared)

9. ☐ **Sticker album progress** — each completed deck/game earns a sticker in a
   per-kid album page (fits the Sticker Book design language; delivers the deferred
   per-kid progress). Light sibling album comparison is the fuel.
10. ☐ **Daily "carta del día"** — one featured word (younger) or sentence (older)
    on the home screen each day, with a small streak of suns/stars.

## Build order

**First slice: tap-the-right-picture quiz (2), no profiles** — shaped 2026-07-10:
the kid picker (1) was cut on approval; the quiz's two modes are picked per-play
from a per-deck choice screen, so it reuses all existing content and the speech
adapter with zero persistence. Then the sticker album (9) so games have a reward
sink, then more games. Sentence builder (6) comes after the album — it's the
biggest lift (new verb/adjective content). Revisit the kid picker (1) once a
second game exists and per-play mode buttons start to sprawl.
