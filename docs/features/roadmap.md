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

1. ☑ **Kid picker (per-kid mode)** — home screen offers two big sticker avatars, no
   text. Picking one sets the difficulty mode for every deck and game. This is the
   axis all other features scale along. *(Cut from the first slice, then shipped
   2026-07-10 once three games made the per-play mode buttons sprawl: 🦖 Dino =
   listen level, 🦄 Úni = read level; per-kid albums; shared-era stickers migrated
   to both kids.)*

## Games for both kids

2. ☑ **"¿Dónde está…?" — tap-the-right-picture quiz** — app speaks a word, kid taps
   the matching picture. Younger mode: 2 giant choices, audio → picture. Older mode:
   4 choices, written-Spanish prompt (no audio) for reading practice, or a spoken
   sentence prompt ("Toca el animal que dice muu") — sentence prompts deferred.
   *(Shipped 2026-07-10: entry via a per-deck choice screen — 📖 Las tarjetas /
   👂 Escucha / 🔤 Lee. See `shipped.md`.)*
3. ☑ **Memory match (parejas)** — flip-to-match pairs. Younger: picture ↔ picture,
   every flip speaks the word. Older: picture ↔ written Spanish word (forces reading).
   *(Shipped 2026-07-10.)*
4. ☑ **"Sí o no" lightning round** — picture + spoken claim, kid taps ✅/❌
   ("¿Es un gato?"). Older mode swaps in sentences ("El plátano es rojo — ¿sí o no?").
   Cheapest sentence-comprehension feature; needs no text input. *(Shipped
   2026-07-10 with word claims — written "¿Es …?" in read mode; sentence claims
   still deferred, they need attribute content.)*
5. ☑ **Say-it-back (voice recording)** — after the card speaks, a big microphone
   button records the kid repeating the word, then plays both back. No grading —
   the comparison is the learning. Identical at both ages. *(Shipped 2026-07-11:
   🎤 on flashcards, clips ephemeral per ADR 003. Headless-verified with a
   stubbed stream — give the record→playback path one confirmation on the real
   tablet.)*

## Mainly for the older kid (younger-safe)

6. ☑ **Sentence builder** — drag 3–4 word tiles (each with a picture hint) into
   order: *el gato / come / pescado*; completing it speaks the whole sentence.
   Needs a small new deck of verbs/adjectives — the biggest content lift here.
   *(Shipped 2026-07-11 as tap-in-order tiles over a 12-sentence pack; 💬 Las
   frases 🔤.)*
7. ☑ **Word ↔ word matching** — connect written Spanish to a picture (younger) or
   to the English word (older, reading practice). *(Briefly deprioritized, then
   shipped 2026-07-11 as 🔗 Conecta — connect-the-columns per deck; the 🔤 mode
   is the app's first Spanish↔English translation reading.)*
8. ☑ **Describe-the-card** — the flashcard, but the audio speaks a sentence
   ("La vaca es grande y blanca") instead of a single word. *(Shipped 2026-07-11
   as 💬 Las frases 👂, over the same sentence pack.)*

## Motivation glue (shared)

9. ☑ **Sticker album progress** — each completed deck/game earns a sticker in a
   per-kid album page (fits the Sticker Book design language; delivers the deferred
   per-kid progress). Light sibling album comparison is the fuel. *(Shipped
   2026-07-10 as a device-shared album at `/album` — goes per-kid when the kid
   picker (1) lands.)*
10. ☑ **Daily "carta del día"** — one featured word (younger) or sentence (older)
    on the home screen each day, with a small streak of suns/stars. *(Shipped
    2026-07-10: same word for both kids, per-kid ☀️ streak; per-level sentences
    wait on sentence content.)*

## Content shelves

11. ☑ **Los verbos — a verbs shelf** — action words for pre-readers, one deck per
    verb form. *(Shipped 2026-07-12 as a flashcards-only shelf: El infinitivo /
    El gerundio / El imperativo over the same 12 verbs. Learn-only because the
    games build noun-shaped "¿Es un…?" questions. See `shipped.md`.)*
    - ☐ **Futuro / condicional decks** — sibling decks on the same shelf (comeré,
      comería). Deferred: conjugations can't be navigated by a single picture and
      read as advanced for ages 3–5; revisit if the app grows an older-kid mode.
    - ☐ **Verbs in the games** — verb-native question phrasing (e.g. "¿Está
      comiendo?") so the verbs shelf can drop `learnOnly` and join the quiz-style
      games. The real lift the learn-only cut deferred.

## Difficulty & play

12. ☑ **Difficulty levels** — 🟢/🟡/🔴 board sizes. *(Shipped 2026-07-12 for
    Las parejas: 3/5/8 pairs, a new `MemoryDifficulty` axis. See `shipped.md`.)*
    - ☐ **Difficulty for the other board-scalable games** — quiz choice count
      (2→4), sí/no round count, reto length. The pattern is proven on parejas.
    - ☐ **A timer / lose-state on Hard** — pressure mode; deliberately cut to
      keep the first slice about board size only.

13. ☑ **Drag-to-place accessories** — free creative dress-up on the mascota.
    *(Shipped 2026-07-12: per-pet `placements`, drag anywhere and it stays. See
    `shipped.md`.)*
    - ☐ **Guided placement (learning variant)** — snap to the correct spot with
      a happy cue; teaches where things go. The other half of the original idea.
    - ☐ **Resize / rotate accessories** — richer dress-up; out of the first cut.

## Streaks & retention

14. ☑ **Weekly streaks & freezes** — an active week (daily misión on 3 days)
    grows a 🔥 weekly streak; ❄️ escudos cover a missed week. *(Shipped
    2026-07-13: 3 starter escudos, buy for 30⭐ or win from the caja sorpresa,
    three rollover animations. See `shipped.md`.)*
    - ☐ **Weekly missions (richer)** — a separate set of bigger week-spanning
      goals, distinct from reusing the daily misión as the active-day signal.
    - ☐ **Weekly state in the transfer code** — carry weekly streak + escudo
      counts across devices; today they stay per-device (deferred with the rest
      of cross-device sync).
    - ☐ **More escudo sources** — mission-chest drops, streak milestones. Today
      it's the 3 starters, buying, and the surprise box only.

## Build order

**First slice: tap-the-right-picture quiz (2), no profiles** — shaped 2026-07-10:
the kid picker (1) was cut on approval; the quiz's two modes are picked per-play
from a per-deck choice screen, so it reuses all existing content and the speech
adapter with zero persistence. Then the sticker album (9) so games have a reward
sink, then more games. Sentence builder (6) comes after the album — it's the
biggest lift (new verb/adjective content). Revisit the kid picker (1) once a
second game exists and per-play mode buttons start to sprawl.
