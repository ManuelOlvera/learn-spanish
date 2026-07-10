# ¡Palabras! — Spanish for little kids

A touch-first flashcard PWA for pre-readers (ages 3–5). A kid taps a sticker
category, sees a big picture card, and hears the Spanish word spoken aloud.
No reading, no accounts, no setup.

## Features

- **Flashcards** — 6 starter decks (animals, colors, numbers to 100, food),
  64 words, tap-to-hear Spanish audio via browser speech synthesis.
- **Games** — per deck, each with 👂 listen / 🔤 read difficulties:
  "¿Dónde está…?" (tap the right picture), "¿Sí o no?" (judge a claim),
  and "Las parejas" (memory match).
- **Sticker album** — finishing any activity earns a sticker; `/album`
  tracks all 42, persisted on-device (no accounts).

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
