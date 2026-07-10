# Shipped features

## 2026-07-10 — Flashcards v1 (the founding slice)

**For:** pre-readers (ages 3–5) on a shared family tablet — no accounts, no reading required.

**What shipped:** Category picker (`/`) → flashcard loop (`/deck/[deckId]`).
Four starter decks — Los animales, Los colores, Los números, La comida — 44
words total, each card a large emoji + the Spanish word (nouns carry their
article). Tapping the card speaks the word via browser speech synthesis
(`es-MX` preferred, any `es-*` voice as fallback) and wobbles it; a lime next
button advances; finishing a deck lands on a 🎉 *¡Muy bien!* screen with
replay/home. Design: **Sticker Book** (see `docs/skills/frontend-design.md`).

**Where:** content + use cases in `packages/core`
(`StaticDeckRepository`, `ListDecksUseCase`, `GetDeckUseCase`); UI and the
speech adapter in `apps/web`; wiring in `apps/web/src/lib/container.ts`.

**Deferred (not dropped):** quizzes/games, per-kid profiles & progress,
streaks/rewards, voice recording, Supabase/auth, Android TWA shell, parent
content editing.
