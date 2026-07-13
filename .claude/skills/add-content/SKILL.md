---
name: add-content
description: Use when adding or editing vocabulary content — a new deck, new words in an existing deck, new sentences for Las frases, or a new home-screen shelf. Walks the full invariant map (pack file, shelf partition, accent color, album completability, tests, README counts) so content lands consistent everywhere it surfaces. Not for new game mechanics — that's a feature (/shape).
---

# Add or edit vocabulary content

Content is TypeScript data in `packages/core/src/infrastructure/` — types check
it and the pack tests enforce its invariants, so most mistakes fail the build.
This skill is the map of everything one content change touches.

## The invariants (enforced by `packages/core/test/starter-pack.test.ts` and `deck-group.test.ts`)

- **Deck size 10–15 cards** — kid-sized; split a bigger topic into two decks.
- **Every card**: non-empty `id`, `spanish` (nouns carry their article — `el
  perro`, teaching gender), `english`, `emoji`.
- **No repeated emoji within a deck** — quiz choices are picture-only; two
  cards with one picture make an unanswerable round.
- **No repeated card id across the whole pack.**
- **Every non-secret deck sits on exactly one shelf** (`deck-groups.ts`
  partition); shelves hold 3–5 decks; home fits at most 6 shelves.
- **Spain Spanish** (coche, ordenador, hierba) — match the existing voice.

## Checklist for a new deck

1. **Cards** in `packages/core/src/infrastructure/starter-pack.ts` — copy an
   existing deck's shape. Flags: `secret`/`unlockCost` for a star-gated bonus
   deck (stays off shelves, out of daily/review pools); `learnOnly` ONLY for
   content that can't answer noun-shaped game questions (today: the verbs
   shelf).
2. **Shelf** — add the deck id to a group in
   `packages/core/src/infrastructure/deck-groups.ts` (skip for secret decks).
3. **Accent color** — add the deck id to `apps/web/src/lib/deck-theme.ts`
   (unknown ids fall back to lime, so this is easy to forget — the tests can't
   catch a color).
4. **Tests** — extend the expected-ids list in `starter-pack.test.ts`; add a
   deck-specific test if the deck carries structure (see the numbers/verbs
   tests). New invariants you relied on get their own test.
5. **README counts** — the Features section states deck/word totals
   ("27 decks / 323 words…"); recount and update.
6. **Verify** — `/verify` including the new deck: its shelf tile, first card,
   one game round, and the album section (completability per kid).

## For new sentences (Las frases)

`packages/core/src/infrastructure/sentence-pack.ts` — keep the pool within the
60–84 range `sentence.test.ts` expects (raise the test deliberately if the pack
outgrows it). Every token a tile game deals must be readable alone.

## For new words in an existing deck

Steps 1, 4 (if the ids list is asserted), 5, 6 — and stay ≤ 15 cards.

Album note: sticker slots derive from activities, not content — adding a deck
automatically gives it album slots and a completion chest; nothing to wire.
