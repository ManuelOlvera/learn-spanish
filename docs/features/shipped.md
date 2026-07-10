# Shipped features

## 2026-07-10 — Kid picker + carta del día (roadmap slices 5–6)

**What shipped:**

- **Kid picker** — first visit asks *¿Quién juega?* with two avatar stickers:
  🦖 **Dino** (listen level) and 🦄 **Úni** (read level). Core models them
  semantically (`KidId = "listener" | "reader"`, `domain/kid.ts`); avatars are
  presentation. Picking a kid collapses every game row to its one right
  difficulty button (deep links with no kid ever picked still show both), the
  album becomes per-kid (*El álbum de Dino/Úni*, 42 slots each, avatar chip
  flips between them), and awards go to the selected kid — or, on mode-specific
  deep links, to the kid the mode implies. Shared-era stickers are migrated to
  **both** kids on load (`upgradeLegacyStickers`). Avatar chip on home reopens
  the picker.
- **La carta del día** — a deterministic date-hashed word of the day
  (`domain/daily.ts`, FNV-1a over the UTC day key, computed client-side so
  static builds don't freeze it) on a wide sticker under the home header.
  Tapping speaks it and feeds a per-kid streak (☀️ n badge): same day
  idempotent, next day +1, gap resets — `advanceStreak` + `FeedStreakUseCase`
  behind a `StreakStore` port, localStorage-backed.

**Where:** `packages/core` `domain/kid.ts`, `domain/daily.ts`, album per-kid
ids + migration, `application/feed-streak.ts` / `get-streak.ts`; web
`HomeView.tsx` + `KidPicker.tsx` (home went client-driven), `GameMenu.tsx`
(replaces the static choice screen), per-kid `AlbumView.tsx` / `DoneScreen.tsx`,
adapters `lib/kid.ts`, `lib/streak-store.ts`.

## 2026-07-10 — Sticker album, ¿Sí o no?, and Las parejas (roadmap slices 2–4)

**What shipped:** three features from `docs/features/roadmap.md`, all reusing
the existing 64-word pack with the 👂 listen / 🔤 read difficulty axis:

- **Sticker album** — finishing any activity earns a per-deck sticker, awarded
  on the shared 🎉 *¡Muy bien!* screen (`DoneScreen.tsx`, the one award call
  site) with a *¡Nueva pegatina!* chip the first time. `/album` shows every
  deck's 7 slots (earned = accent sticker, unearned = dashed ghost) and an
  x/42 count. Device-shared (profiles still deferred), persisted in
  `localStorage` behind the `AlbumStore` port; storage failures degrade to an
  empty album, never break play. 📔 buttons on home and done screens.
- **¿Sí o no?** — a picture plus a claim ("¿Es el gato?"), spoken (👂) or
  written (🔤); kid taps ✅/❌. Correct always speaks the picture's true name;
  8 rounds, ~50/50 true/false, no repeated picture.
- **Las parejas (memory match)** — 🖼️ mode: 4 same-picture pairs, every flip
  speaks the word; 🔤 mode: 6 picture↔word pairs, the word speaks only on a
  match (read first). Misses wobble and flip back.

The per-deck choice screen became a row-per-game layout (📖 Las tarjetas /
🔍 ¿Dónde está? / ✅ ¿Sí o no? / 🧩 Las parejas) with the mode glyphs as
buttons — the same glyphs the album slots use.

**Where:** game assembly + album use cases in `packages/core` (`domain/si-no.ts`,
`domain/memory.ts`, `domain/album.ts`, shared `domain/random.ts`,
`application/award-sticker.ts`, `application/get-album.ts`); web adapters in
`apps/web/src/lib/album-store.ts` (+ `album.ts`, the client-side composition
root) and UI in `SiNoPlayer.tsx`, `MemoryPlayer.tsx`, `AlbumView.tsx`,
`DoneScreen.tsx`; routes `…/si-no/[mode]`, `…/match/[mode]`, `/album`.

## 2026-07-10 — "¿Dónde está…?" quiz + per-deck choice screen

**For:** both kids — the 5-year-old pre-reader *and* the 8-year-old early
reader (first slice of `docs/features/roadmap.md`; kid profiles were cut,
so difficulty is picked per-play).

**What shipped:** Tapping a deck now lands on a picture-only choice screen —
📖 *Las tarjetas* (flashcards, moved to `/deck/[id]/learn`), 👂 *Escucha*
(hear the word, tap the right picture from 2 giant choices), 🔤 *Lee* (read
the word, tap the right picture from 4). Right answer speaks the word, turns
the sticker lime, and advances; wrong answer wobbles and lets the kid retry.
Quizzes are 8 rounds (shuffled, no repeated answer, same-deck distractors),
end on the 🎉 *¡Muy bien!* screen, and reshuffle on replay.

**Where:** quiz assembly is a pure domain service in `packages/core`
(`domain/quiz.ts`: `createQuiz`, injectable `RandomSource`, typed
`QuizDeckTooSmallError`); UI in `apps/web` (`QuizPlayer.tsx`, routes
`/deck/[deckId]` → choice, `…/learn`, `…/quiz/[listen|read]`). Content tests
now also pin per-deck emoji uniqueness (quiz choices are picture-only).

## 2026-07-10 — Numbers to 100

Two new decks extend counting past ten: **Los números 11–20** (once → veinte,
complete) and **Las decenas** (diez → cien by tens — the age-appropriate way to
"count to 100"; in-between numbers are compositional in Spanish and deferred).
Visuals are composed keycap emoji (4️⃣0️⃣), cien gets 💯. The 1–10 deck was
renamed "Los números 1–10". Pack is now 6 decks / 64 words; content tests pin
both sequences and a 10–15 cards-per-deck kid-sized bound.

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
