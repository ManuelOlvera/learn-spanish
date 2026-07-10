# ¡Palabras! — Spanish for little kids

A touch-first flashcard PWA for pre-readers (ages 3–5). A kid taps a sticker
category, sees a big picture card, and hears the Spanish word spoken aloud.
No reading, no accounts, no setup.

## Features

- **Flashcards** — 19 decks / 220 words on five themed home-screen
  shelves (animals · numbers & colors · my home & me · the world ·
  play & learn), tap-to-hear audio via browser speech synthesis —
  **Spain Spanish** (es-ES voice; coche, ordenador, hierba, baloncesto).
- **Games** — per deck, each with 👂 listen / 🔤 read difficulties:
  "¿Dónde está…?" (tap the right picture), "¿Sí o no?" (judge a claim),
  "Las parejas" (memory match), and "Conecta" (connect the columns).
- **Say-it-back** — a 🎤 on every flashcard records the kid repeating the
  word and plays it straight back; clips are in-memory only (ADR 003).
- **Las frases** — 48 starter sentences: hear-them cards (👂) and a
  tap-the-tiles sentence builder (🔤).
- **Kid picker** — 🦖 Dino (listen level, pre-readers) vs 🦄 Úni (read
  level); each game menu shows that kid's one right difficulty.
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
