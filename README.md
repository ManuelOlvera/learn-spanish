# ¡Palabras! — Spanish for little kids

A touch-first flashcard PWA for pre-readers (ages 3–5). A kid taps a sticker
category, sees a big picture card, and hears the Spanish word spoken aloud.
No reading, no accounts, no setup.

## Features

- **Flashcards** — 4 starter decks (animals, colors, numbers, food), 44 words,
  tap-to-hear Spanish audio via browser speech synthesis.

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
