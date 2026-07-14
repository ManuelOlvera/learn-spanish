# ¡Palabras! — Spanish for little kids

A touch-first flashcard PWA for pre-readers (ages 3–5). A kid taps a sticker
category, sees a big picture card, and hears the Spanish word spoken aloud.
No reading, no accounts, no setup.

## Features

- **Flashcards** — 31 decks / 365 words on seven themed home-screen
  shelves (animals · numbers & colors · my home & me · the world ·
  play & learn · letters · verbs), plus a star-unlocked bonus deck
  **El misterio 🔮** (32 decks / 377 words total), tap-to-hear audio via
  browser speech synthesis — **Spain Spanish** (es-ES voice; coche,
  ordenador, hierba). **Los verbos 🏃** is a flashcards-only shelf:
  15 action words in three forms (infinitivo · gerundio · imperativo).
  **Las letras 🔤** is a game-enabled alphabet shelf: an A/a/Aa switch
  picks which case a kid sees (uppercase by default — one case at a time
  while learning), tapping speaks the letter's name ("la be"; Las
  vocales pairs each vowel with its accented form), and **El abecedario
  🔠** runs all 27 letters in order; **Las centenas 💯** counts 100–1000
  with digit-face cards.
- **Games** — per deck (except the flashcards-only verbs shelf), each
  with 👂 listen / 🔤 read difficulties:
  "¿Dónde está…?" (tap the right picture), "¿Sí o no?" (judge a claim),
  "Las parejas" (memory match, with 🟢/🟡/🔴 board sizes — 3/5/8 pairs),
  "Conecta" (connect the columns),
  "Busca y toca" (I-spy scene), "El duelo" (pass-the-tablet versus),
  "El reto" (60-second lightning round), "¿Cuántos hay?" (counting, on
  the numbers deck), "Deletrea" (letter-tile spelling, reader-level),
  and "La sopa de letras" (word search, reader-level, 🟢/🟡/🔴 grid
  sizes, on decks whose words fit a grid).
- **Game feel** — synthesized sounds, haptics, confetti, and a ⚡ racha
  burst at 3/5/10 correct in a row.
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
- **Star economy** — a treasure chest on every finish pays ⭐ per
  first-try answer, with ✨ perfect / 🔥 streak / 🆕 first-time bonuses;
  the daily misión (drawn from each kid's own pool — the reader's
  includes ✏️ Deletrea) adds a +10⭐ bonus chest. Stars feed and grow **la
  mascota** (a collection of adoptable pets, 5⭐ a meal), buy 🛍️ wardrobe
  accessories and drag them anywhere on the pet (saved per pet),
  open 🎁 surprise boxes, unlock 29 avatars, and buy 🎨 paper
  themes; album stickers tier up to
  silver/gold with replays; `/informe` gives parents each kid's strong
  and tricky words plus a 📈 weekly learned-words trend (sampled
  on-device each time the informe opens).
- **Kid picker** — a listen-level kid (pre-readers) and a read-level kid,
  each with their own chosen avatar (16 to pick from); each game menu
  shows that kid's one right difficulty.
- **Cross-device sync** — optional, local-first (ADR 004). Pair devices once
  with a capability code; progress pulls on open (and again whenever the
  app returns to view) and pushes on game-complete, additively merged so
  nothing is lost. Off unless `NEXT_PUBLIC_SUPABASE_*`
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
