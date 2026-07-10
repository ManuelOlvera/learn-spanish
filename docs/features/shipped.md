# Shipped features

## 2026-07-11 — Grouped home screen: shelves instead of scrolling

**What shipped:** with 19 decks the home grid had become a long scroll, so
home now shows **six one-screen tiles**: five themed shelves — 🐾 Los
animales, 🔢 Números y colores, 🏠 Mi casa y yo, 🌍 El mundo, 🎨 Jugar y
aprender — plus 💬 Las frases. Each shelf tile previews its decks' emoji
(pre-readers can spot 🐶 on the shelf cover) and opens `/group/[groupId]`,
a single-screen page of that shelf's 3–4 deck stickers. The verify drive
asserts `scrollHeight` stays within one viewport on home and on every
shelf.

Groups are core content (`domain/deck-group.ts`, `DECK_GROUPS`) with a
test-enforced invariant: **every deck belongs to exactly one group** — an
unshelved new deck fails the build. Shelves are pinned to 3–5 decks and
home to ≤6 tiles, so the no-scroll property is also test-guarded.

**Where:** `packages/core` `domain/deck-group.ts` +
`infrastructure/deck-groups.ts` + `ListDeckGroupsUseCase`; web
`/group/[groupId]/page.tsx`, regrouped grid in `HomeView.tsx`, shelf
accents in `deck-theme.ts`.

## 2026-07-11 — Content drop: sports, bugs, zoo, jobs + 12 grammar-forward sentences

**What shipped:** four more es-ES decks — **Los deportes 🏅** (el baloncesto,
el esquí), **Los bichos 🐝** (la mariquita, el saltamontes), **El zoo 🐵**
(el pingüino, la ballena), **Las profesiones 🧑‍🚒** (la médica, el bombero;
mixed genders on purpose) — for **19 decks / 220 words**; albums are now
173 per kid. Las frases grew to **48 sentences**, deliberately stretching
grammar: negation ("el pingüino no vuela"), *tener* + a number ("la araña
tiene ocho patas", the first 4-tile sentence), *querer* ("yo quiero un
helado"), *ir* ("el astronauta va a la luna"), *vivir*, and Spain's
*jugar al* ("yo juego al fútbol").

**Where:** `starter-pack.ts`, `sentence-pack.ts`, `deck-theme.ts`,
re-pinned content tests (category list, 40–60 sentence pool).

## 2026-07-11 — Spain Spanish (es-ES) + 4 more decks and 12 more sentences

**What shipped:** the app now speaks and writes **castellano**. The voice
preference flipped to `es-ES` (note appended to ADR 001; fallback chain
unchanged) and the content was audited: *el carro* → **el coche**, *pasto* →
**hierba**, deck *El clima* → **El tiempo**; everything else (marrón,
plátano, autobús, bañera…) was already Spain-standard. Four new decks lean
into Spain vocabulary — **El colegio 🎒** (el ordenador, el imán), **Las
emociones 😀** (enfadado — bare adjectives like the colors deck), **La
naturaleza 🌳** (la seta), **Los juguetes 🧸** (el puzle, la cometa) — for
**15 decks / 172 words**; albums are now 137 per kid. Las frases grew to
**36 sentences**, adding more first-person verbs (yo juego, yo leo, yo toco,
yo nado, yo estoy feliz) and *estar* for states ("el gato está dormido").

**Where:** `apps/web/src/lib/speech.ts` (voice order),
`packages/core/src/infrastructure/starter-pack.ts` + `sentence-pack.ts`,
`deck-theme.ts` accents, re-pinned content tests, ADR 001 note.

## 2026-07-11 — Content drop: 5 new decks (+60 words) and 12 new sentences

**What shipped:** the pack grows from 6 decks / 64 words to **11 decks /
124 words**, and Las frases from 12 to **24 sentences** — every existing
game, quiz, album slot, and the carta del día picks the new content up
automatically. New decks (12 cards each, es-MX-friendly wording like *el
carro*): **El cuerpo 🖐️, La ropa 👕, La casa 🏠, Los vehículos 🚗, El clima
⛅**. New sentences reuse the new vocabulary ("el mar es azul", "yo duermo
en la cama", "el avión vuela alto") and introduce first-person *yo veo /
yo duermo*. Albums are now 101 stickers per kid.

**Supabase considered and declined** — ADR 002's "no database until
cross-device progress" decision was revisited and upheld (note appended to
the ADR): content ships in git, progress is deliberately device-local, and
a backend would cost offline support for zero benefit.

**Where:** `packages/core/src/infrastructure/starter-pack.ts` +
`sentence-pack.ts`; accents in `apps/web/src/lib/deck-theme.ts`; content
tests re-pinned (category list, 20–30 sentence pool).

## 2026-07-11 — Say-it-back recording + Conecta (roadmap slices 9–10, the last two)

**What shipped:**

- **Say-it-back (🎤 on flashcards)** — after hearing the model, the kid taps
  🎤 in the footer, speaks (red ⏺ sticker, tap to stop, 5-second cap), and
  the clip plays straight back. **Recordings are ephemeral — in-memory only,
  never persisted or transmitted (ADR 003)**; the mic stream stops the moment
  recording ends, advancing a card discards mid-flight clips, and if
  recording is unsupported or denied the button hides and flashcards work as
  before. Adapter: `apps/web/src/lib/recorder.ts`. *Verified headless via a
  stubbed stream (macOS headless getUserMedia hangs) — the record → playback
  audio path still wants one real-tablet confirmation.*
- **Conecta (🔗, word↔word matching)** — per-deck connect-the-columns, 2
  boards × 5 pairs (`domain/connect.ts`; sides never dealt pre-aligned). 👂:
  Spanish words (tap = hear it) ↔ pictures. 🔤: Spanish ↔ English — the
  app's first explicit translation reading. Matches lock lime and speak the
  word; misses wobble. Activities `connect-listen`/`connect-read` grow each
  kid's album to 56.

**Where:** `packages/core` `domain/connect.ts`; web `ConnectPlayer.tsx`,
route `…/connect/[mode]`, 🎤 states in `FlashcardPlayer.tsx`,
`lib/recorder.ts`, `docs/adr/003-ephemeral-voice-recordings.md`.

## 2026-07-11 — Las frases: sentence pack, builder, and describe-the-card

**What shipped:** the first sentence-level content and the two features it
unlocks, packaged as a pack-wide **💬 Las frases** area (home-screen row that
links straight to the current kid's mode; `/frases` chooser on kid-less deep
links):

- **Sentence pack** — 12 authored subject-verb-complement sentences
  (`infrastructure/sentence-pack.ts`), three tiles each, articles glued to
  nouns, reusing pack vocabulary ("el gato bebe leche"); content tests pin
  the 2–4-tile shape and kid-sized pack bounds.
- **Sentence builder (🔤, frases-read)** — hear the sentence via 🔊 + picture
  hint, tap word tiles into order; right tiles speak and stick, wrong tiles
  wobble back, the finished sentence speaks whole on a lime flash. 6 rounds,
  tiles never dealt already-in-order (`createSentenceGame`).
- **Describe-the-card (👂, frases-listen)** — the flashcard pattern over
  sentences: picture card whose tap speaks the full sentence, richer input
  for the pre-reader.

Both earn stickers under a new album section (44 per kid). DoneScreen was
generalized off `Deck` (sticker scope + back-link props) to host non-deck
activities.

**Where:** `packages/core` `domain/sentence.ts` (+ repository port,
`ListSentencesUseCase`, `StaticSentenceRepository`); web
`FrasesListenPlayer.tsx`, `FrasesBuildPlayer.tsx`, routes `/frases` +
`/frases/[mode]`, home row in `HomeView.tsx`, album section in
`AlbumView.tsx`.

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
