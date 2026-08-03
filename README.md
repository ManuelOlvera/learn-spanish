# ¡Palabras! — Spanish for little kids

A touch-first flashcard PWA for pre-readers (ages 3–5). A kid taps a sticker
category, sees a big picture card, and hears the Spanish word spoken aloud.
No reading, no accounts, no setup.

## Features

- **Flashcards** — 40 decks / 464 words on nine themed home-screen
  shelves (animals · numbers & colors · my home · all about me · the world ·
  play & learn · letters · verbs · calendar), plus a star-unlocked bonus deck
  **El misterio 🔮** (41 decks / 476 words total), tap-to-hear audio via
  browser speech synthesis — **Spain Spanish** (es-ES voice; coche,
  ordenador, hierba). **Los verbos 🏃** is a flashcards-only shelf:
  15 action words in three forms (infinitivo · gerundio · imperativo).
  **Las letras 🔤** is a game-enabled alphabet shelf: an A/a/Aa switch
  picks which case a kid sees (uppercase by default — one case at a time
  while learning), tapping speaks the letter's name ("la be"; Las
  vocales pairs each vowel with its accented form), and **El abecedario
  🔠** runs all 27 letters in order; **Las centenas 💯** counts 100–1000
  with digit-face cards. **El calendario 📅** is the time shelf: the week
  (day cards wear the abbreviation a Spanish calendar prints — Lun, Mar,
  Mié…), the twelve months, o'clock hours on clock faces, the shape of a
  day (mañana · mediodía · siesta · noche), and the seasons.
  **¿Cómo soy? 🧑** is the describe-yourself shelf: the body, hair and skin
  (rubio, moreno, canoso, calvo, la piel clara · morena · oscura), size and
  build (alto, bajo, gordo, delgado), las emociones, and **Mi día 🪥** — the
  daily routine in reflexive verbs (despertarse, lavarse los dientes,
  peinarse, acostarse), the first verb deck that plays the games rather than
  sitting flashcards-only. **Mi casa 🏠** opens with **La familia 👨‍👩‍👧‍👦** —
  the household in gender pairs (hermano · hermana, abuelo · abuela, tío ·
  tía), plus mamá, papá, el primo, el bebé and la mascota. Adjectives borrow the creature that *is* the word
  (alto 🦒, pequeño 🐭) and skin tone rides on a hand, not a face.
- **Games** — per deck (except the flashcards-only verbs shelf), each
  with 👂 listen / 🔤 read difficulties:
  "¿Dónde está…?" (tap the right picture), "¿Sí o no?" (judge a claim),
  "Las parejas" (memory match, with 🟢/🟡/🔴 board sizes — 3/5/8 pairs),
  "Conecta" (connect the columns),
  "Busca y toca" (I-spy scene), "El duelo" (pass-the-tablet versus),
  "El reto" (60-second lightning round), "¿Cuántos hay?" (counting, on
  the numbers deck), "Deletrea" (letter-tile spelling, reader-level),
  "La sopa de letras" (word search, both kids, 🟢/🟡/🔴 grid
  sizes, on decks whose words fit a grid), "El globo" (guess the word
  letter by letter before the balloon pops — reader-level, 🟢/🟡/🔴 word
  lengths, the 💡 tip costs a life), and "Adivina la palabra" (wordle over
  a whole shelf — type the word on a Spanish keyboard, 🟩/🟨/⬜ per letter;
  a word the app doesn't know can't be submitted and costs no guess. The
  shelf's theme stays on screen, and four tips — meaning, picture, first
  letter, one more letter — each cost one of the six guesses.
  Reader-level, 🟢/🟡/🔴 word lengths, entered from the shelf screen).
- **Game feel** — synthesized sounds (tones *and* filtered noise, so El globo
  can inflate, hiss and pop without a single audio file), haptics, confetti,
  and a ⚡ racha burst at 3/5/10 correct in a row.
- **Smart review** — per-word tallies (on-device) bias quizzes toward
  missed words; a 🔁 "El repaso" chip appears on home when ≥3 words
  struggle. Special avatars unlock by sticker count and streaks.
- **Offline** — a hand-rolled service worker (ADR 005) makes the installed
  PWA work with no network after one online visit; sync simply catches up
  later.
- **Say-it-back** — a 🎤 on every flashcard records the kid repeating the
  word and plays it straight back; clips are in-memory only (ADR 003).
- **Las frases** — 84 starter sentences: hear-them cards (👂) and a
  tap-the-tiles sentence builder (🔤).
- **Los cuentos** — 10 short stories (📚), read or heard a page at a time,
  ending in 3–5 comprehension questions (2 picture choices for the pre-reader,
  4 for the reader). Six are little-kid stories and four are
  reader-level — eight pages, longer sentences, the simple past — including
  the three World Cups Spain won (2010, 2023, 2026) and a Halloween trip
  to Universal Studios Japan.
  All ten are illustrated — 68 pages of art, one picture per page. Built from pack vocabulary, and the
  only place the flashcards-only verbs shelf is seen in action.
- **Star economy** — a treasure chest on every finish pays ⭐ per
  first-try answer, less one per wrong tap (so guessing can't farm the
  chest; floored at 1), with ✨ perfect / 🔥 streak / 🆕 first-time bonuses.
  Opening it is the celebration, not the toll gate: the ways off the screen
  dim while it is shut, and an un-opened chest still banks on the way out;
  the daily misión (drawn from each kid's own pool — the reader's
  includes ✏️ Deletrea) adds a +10⭐ bonus chest, and every finish rotates a
  spoken cheer with the pet cheering along. Stars feed and grow **la
  mascota** (a collection of adoptable pets, 5⭐ a meal; name it too), buy 🛍️
  wardrobe accessories and drag them anywhere on the pet (saved per pet),
  open 🎁 surprise boxes, unlock 29 avatars, and buy 🎨 paper
  themes — every purchase behind a picture-only ✅/❌ confirm so a stray
  tap can't spend the stars (the 5⭐ meal aside); album stickers tier up to
  silver/gold with replays.
- **Parent report** — `/informe` summarises both kids (strong and tricky
  words, a 📈 weekly learned-words trend sampled on every game complete);
  tapping a kid opens their own report: a mastery meter per shelf with the
  never-opened ones counted, plays per game with the untouched ones named,
  accuracy per game, a 12-week practice calendar, and every struggling word
  grouped by deck. A word counts as learned at two correct answers, not one
  (ADR 012). Answers carry their game and a timestamp in a 90-day on-device
  log that never syncs (ADR 013). No third-party analytics, ever.
- **Kid picker** — a listen-level kid (pre-readers) and a read-level kid,
  each with their own chosen avatar (16 to pick from); each game menu
  shows that kid's one right difficulty.
- **Cross-device sync** — optional, local-first (ADR 004). Pair devices once
  by scanning a QR (or typing the capability code) — one scan opens the app
  and pairs it, after a confirm on the new device (ADR 011); progress pulls on
  open (and again whenever the app returns to view) and pushes on
  game-complete, additively merged so nothing is lost. Off unless `NEXT_PUBLIC_SUPABASE_*`
  are set, in which case the app stays pure-local.
- **Device transfer** — a one-time copy-able code (album footer) moves
  progress to another device by merge; the no-connection fallback to sync.
- **Sticker album** — finishing any activity earns a sticker; `/album`
  shows only the games a kid can actually play (so a category is completable),
  persisted on-device (no accounts). Filling a whole category — and levelling it
  to silver, then gold — stamps a 🥉/🥈/🥇 medal and opens an escalating
  completion chest (+15 / +30 / +50⭐).
- **Carta del día** — a daily featured word on the home screen with a
  per-kid ☀️ streak.
- **El regalo del día** — a free 🎁 on the home screen once a day (10–25⭐,
  sometimes a ❄️), claimable once per calendar day.
- **Weekly streaks** — finishing the daily misión on 3 days makes an
  active 🔥 week; each active week bumps the weekly streak, celebrated by
  a first-open-of-the-week animation (grew / an ❄️ escudo saved it / start
  again). Kids start with 3 escudos, buy more for 30⭐ on home, or win one
  from the 🎁 caja sorpresa; a missed week spends an escudo before the
  streak resets. `/informe` shows each kid's 🔥 and ❄️ counts.

**Live:** https://learn-spanish-manuelolveras-projects.vercel.app
(deploy/rollback: `docs/runbooks.md`)

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # core unit tests (coverage floor: 80%)
pnpm typecheck
pnpm build
```

## Layout

- `apps/web` — Next.js App Router PWA (presentation only)
- `packages/core` — framework-agnostic business logic (domain → application → infrastructure)
- `packages/config` — zod-validated env access + JSON logger

See `.claude/CLAUDE.md` for architecture rules and `docs/README.md` for the
documentation index.
