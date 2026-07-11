# ¡Palabras! — Spanish for little kids

A touch-first flashcard PWA for pre-readers (ages 3–5). A kid taps a sticker
category, sees a big picture card, and hears the Spanish word spoken aloud.
No reading, no accounts, no setup.

## Features

- **Flashcards** — 23 decks / 268 words on five themed home-screen
  shelves (animals · numbers & colors · my home & me · the world ·
  play & learn), plus a star-unlocked bonus deck **El misterio 🔮**
  (24 decks / 280 words total), tap-to-hear audio via browser speech
  synthesis — **Spain Spanish** (es-ES voice; coche, ordenador, hierba).
- **Games** — per deck, each with 👂 listen / 🔤 read difficulties:
  "¿Dónde está…?" (tap the right picture), "¿Sí o no?" (judge a claim),
  "Las parejas" (memory match), "Conecta" (connect the columns),
  "Busca y toca" (I-spy scene), "El duelo" (pass-the-tablet versus),
  "El reto" (60-second lightning round), "¿Cuántos hay?" (counting, on
  the numbers deck), and "Deletrea" (letter-tile spelling, reader-level).
- **Game feel** — synthesized sounds, haptics, confetti, and a ⚡ racha
  burst at 3/5/10 correct in a row.
- **Smart review** — per-word tallies (on-device) bias quizzes toward
  missed words; a 🔁 "El repaso" chip appears on home when ≥3 words
  struggle. Special avatars unlock by sticker count and streaks.
- **Say-it-back** — a 🎤 on every flashcard records the kid repeating the
  word and plays it straight back; clips are in-memory only (ADR 003).
- **Las frases** — 72 starter sentences: hear-them cards (👂) and a
  tap-the-tiles sentence builder (🔤).
- **Star economy** — a treasure chest on every finish pays ⭐ per
  first-try answer, with ✨ perfect / 🔥 streak / 🆕 first-time bonuses;
  the daily misión adds a +10⭐ bonus chest. Stars feed and grow **la
  mascota** (a collection of adoptable pets, 5⭐ a meal), buy 🛍️ wardrobe
  accessories, open 🎁 surprise boxes, unlock 29 avatars, and buy 🎨 paper
  themes; album stickers tier up to
  silver/gold with replays; `/informe` gives parents each kid's strong
  and tricky words.
- **Kid picker** — a listen-level kid (pre-readers) and a read-level kid,
  each with their own chosen avatar (16 to pick from); each game menu
  shows that kid's one right difficulty.
- **Device transfer** — a one-time copy-able code (album footer) moves
  stickers, streaks, and avatars to another device by merge; no accounts,
  no backend (ADR 002).
- **Sticker album** — finishing any activity earns a sticker; `/album`
  tracks 42 per kid, persisted on-device (no accounts).
- **Carta del día** — a daily featured word on the home screen with a
  per-kid ☀️ streak.

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
