# Feature roadmap — two-kid interactivity

Ideas agreed 2026-07-10 to grow ¡Palabras! from a one-mode flashcard app (built
for a 5-year-old pre-reader) into a game both kids can play:

- **Kid A (5):** pre-reader, knows a few Spanish words. Needs picture-and-audio-only
  play, huge targets, zero text dependence.
- **Kid B (8):** reads English, basic Spanish — fair vocabulary, can form simple
  sentences. Needs reading practice and sentence-level input, not just single nouns.

Design principle: **one content pack, two difficulty layers.** Every game reuses the
existing decks/words and scales along a single per-kid mode switch, so nothing is
built twice.

Status legend: ☐ not started · ◐ in progress · ☑ shipped (move write-up to shipped.md)

## The unlocking feature

1. ☑ **Kid picker (per-kid mode)** — home screen offers two big sticker avatars, no
   text. Picking one sets the difficulty mode for every deck and game. This is the
   axis all other features scale along. *(Cut from the first slice, then shipped
   2026-07-10 once three games made the per-play mode buttons sprawl: 🦖 Dino =
   listen level, 🦄 Úni = read level; per-kid albums; shared-era stickers migrated
   to both kids.)*

## Games for both kids

2. ☑ **"¿Dónde está…?" — tap-the-right-picture quiz** — app speaks a word, kid taps
   the matching picture. Younger mode: 2 giant choices, audio → picture. Older mode:
   4 choices, written-Spanish prompt (no audio) for reading practice, or a spoken
   sentence prompt ("Toca el animal que dice muu") — sentence prompts deferred.
   *(Shipped 2026-07-10: entry via a per-deck choice screen — 📖 Las tarjetas /
   👂 Escucha / 🔤 Lee. See `shipped.md`.)*
3. ☑ **Memory match (parejas)** — flip-to-match pairs. Younger: picture ↔ picture,
   every flip speaks the word. Older: picture ↔ written Spanish word (forces reading).
   *(Shipped 2026-07-10.)*
4. ☑ **"Sí o no" lightning round** — picture + spoken claim, kid taps ✅/❌
   ("¿Es un gato?"). Older mode swaps in sentences ("El plátano es rojo — ¿sí o no?").
   Cheapest sentence-comprehension feature; needs no text input. *(Shipped
   2026-07-10 with word claims — written "¿Es …?" in read mode; sentence claims
   still deferred, they need attribute content.)*
5. ☑ **Say-it-back (voice recording)** — after the card speaks, a big microphone
   button records the kid repeating the word, then plays both back. No grading —
   the comparison is the learning. Identical at both ages. *(Shipped 2026-07-11:
   🎤 on flashcards, clips ephemeral per ADR 003. Headless-verified with a
   stubbed stream — give the record→playback path one confirmation on the real
   tablet.)*

## Mainly for the older kid (younger-safe)

6. ☑ **Sentence builder** — drag 3–4 word tiles (each with a picture hint) into
   order: *el gato / come / pescado*; completing it speaks the whole sentence.
   Needs a small new deck of verbs/adjectives — the biggest content lift here.
   *(Shipped 2026-07-11 as tap-in-order tiles over a 12-sentence pack; 💬 Las
   frases 🔤.)*
7. ☑ **Word ↔ word matching** — connect written Spanish to a picture (younger) or
   to the English word (older, reading practice). *(Briefly deprioritized, then
   shipped 2026-07-11 as 🔗 Conecta — connect-the-columns per deck; the 🔤 mode
   is the app's first Spanish↔English translation reading.)*
8. ☑ **Describe-the-card** — the flashcard, but the audio speaks a sentence
   ("La vaca es grande y blanca") instead of a single word. *(Shipped 2026-07-11
   as 💬 Las frases 👂, over the same sentence pack.)*

## Motivation glue (shared)

9. ☑ **Sticker album progress** — each completed deck/game earns a sticker in a
   per-kid album page (fits the Sticker Book design language; delivers the deferred
   per-kid progress). Light sibling album comparison is the fuel. *(Shipped
   2026-07-10 as a device-shared album at `/album` — goes per-kid when the kid
   picker (1) lands.)*
10. ☑ **Daily "carta del día"** — one featured word (younger) or sentence (older)
    on the home screen each day, with a small streak of suns/stars. *(Shipped
    2026-07-10: same word for both kids, per-kid ☀️ streak; per-level sentences
    wait on sentence content.)*

Engagement pass (2026-07-18) — depth over new games, aimed at emotional pull:

10a. ☑ **El regalo del día** — a free 🎁 on the home screen once a day (10–25⭐,
    sometimes a ❄️). A daily reason to open the app that never undercuts the paid
    caja sorpresa; claim-once-per-day, not synced. *(Shipped 2026-07-18.)*
10b. ☑ **A named, reactive mascota** — name your pet (free), and it cheers beside
    the celebration on every done screen. Turns the pet from dress-up into a
    companion. *(Shipped 2026-07-18.)*
10c. ☑ **Varied win cheers** — the done screen rotates eight gender-neutral
    Spanish exclamations instead of a fixed *¡Muy bien!*. *(Shipped 2026-07-18.)*
    - ☐ **Pet moods** — a happy/sad face driven by feeding & streak state (today
      only the existing hungry droop). The next step for the companion idea.
    - ☐ **Sibling head-to-head hooks** — surface "🦖 beat your parejas time" on
      home; the duelo exists but the async sibling nudge doesn't.

## Content shelves

11. ☑ **Los verbos — a verbs shelf** — action words for pre-readers, one deck per
    verb form. *(Shipped 2026-07-12 as a flashcards-only shelf: El infinitivo /
    El gerundio / El imperativo over the same 12 verbs. Learn-only because the
    games build noun-shaped "¿Es un…?" questions. See `shipped.md`.)*
    - ☐ **Futuro / condicional decks** — sibling decks on the same shelf (comeré,
      comería). Deferred: conjugations can't be navigated by a single picture and
      read as advanced for ages 3–5; revisit if the app grows an older-kid mode.
    - ◐ **Verbs in the games** — verb-native question phrasing (e.g. "¿Está
      comiendo?") so the verbs shelf can drop `learnOnly` and join the quiz-style
      games. The real lift the learn-only cut deferred. *(Half done 2026-07-29:
      **Mi día** ships the phrasing as per-card `question` / `sceneQuestion`
      overrides and plays every game. What's left is this shelf — its three
      decks teach one verb in three forms, so the gerund and imperative decks
      need their own claim shapes before the flag can come off.)*

## Difficulty & play

12. ☑ **Difficulty levels** — 🟢/🟡/🔴 board sizes. *(Shipped 2026-07-12 for
    Las parejas: 3/5/8 pairs, a new `MemoryDifficulty` axis. See `shipped.md`.)*
    - ☐ **Difficulty for the other board-scalable games** — quiz choice count
      (2→4), sí/no round count, reto length. The pattern is proven on parejas.
    - ☐ **A timer / lose-state on Hard** — pressure mode; deliberately cut to
      keep the first slice about board size only.

13. ☑ **Drag-to-place accessories** — free creative dress-up on the mascota.
    *(Shipped 2026-07-12: per-pet `placements`, drag anywhere and it stays. See
    `shipped.md`.)*
    - ☐ **Guided placement (learning variant)** — snap to the correct spot with
      a happy cue; teaches where things go. The other half of the original idea.
    - ☐ **Resize / rotate accessories** — richer dress-up; out of the first cut.

## Streaks & retention

14. ☑ **Weekly streaks & freezes** — an active week (daily misión on 3 days)
    grows a 🔥 weekly streak; ❄️ escudos cover a missed week. *(Shipped
    2026-07-13: 3 starter escudos, buy for 30⭐ or win from the caja sorpresa,
    three rollover animations. See `shipped.md`.)*
    - ☐ **Weekly missions (richer)** — a separate set of bigger week-spanning
      goals, distinct from reusing the daily misión as the active-day signal.
    - ☑ **Weekly streak + escudos across devices** — the snapshot now carries
      freezes and weekly streak/week-progress; they sync (and ride the transfer
      code) with everything else. *(Shipped 2026-07-13 with cross-device sync.)*
    - ◐ **More escudo sources** — mission-chest drops, streak milestones. As of
      2026-07-18 the free **regalo del día** occasionally grants a ❄️ too (see
      shipped.md), on top of the 3 starters, buying, and the surprise box.

## Cross-device sync

15. ☑ **Optional Supabase sync** — pair devices with a one-time capability code;
    local-first, pull-on-open / push-on-game-complete, additive merge (ADR 004).
    *(Shipped 2026-07-13. See `shipped.md`.)*
    - ☐ **Live realtime** — cross-device updates while both apps are open
      (Supabase Realtime). *Mostly covered cheaply 2026-07-13: home re-pulls
      whenever the tab becomes visible again — only two devices actively open
      side-by-side still miss mid-session updates.*
    - ☐ **Daily misión / reto state in sync** — ephemeral and daily-resetting, so
      cut from the first slice; add if drift proves annoying.
    - ☐ **Accounts & recovery** — no accounts today means a lost code + lost
      devices orphans the cloud row. Revisit only if data value rises.
    - ☐ **Multi-parent / household sharing** — one shared code is the whole model
      for now.

## Parent ideas (from docs/bugs.md, shaped 2026-07-14)

16. ☑ **Las letras — alphabet shelf** — vowels (with accented forms) + full
    alphabet as a seventh shelf, both cases on the card face ("Bb"), names
    by ear. *(Shipped 2026-07-14. See `shipped.md`.)*
    - ☑ **Letter games** — shipped same day: quiz/reto/duel speak the bare
      name, scene gets "¿Dónde está la be?" from the article rule, sí-o-no
      from per-card unique-entity overrides.
    - ☑ **Case switch + full-alphabet run** — shipped same day: A/a/Aa
      per-kid display choice (upper by default) and El abecedario, all 27
      letters in order as one flashcard run.
    - ☐ **Letter→word association** — "A de avión": pair each letter with a
      pack word starting with it.
17. ☑ **Las centenas** — 100–1000 with digit-face cards, game-enabled.
    *(Shipped 2026-07-14.)*
    - ☐ **Los miles y millones** — deferred: sparse card set, and the numbers
      shelf is full again; needs its own shelf thinking.
18. ☐ **Listener→reader upgrade path** — the parent's real "age bracket" need
    (2026-07-14): when the 5-year-old learns to read, promote her profile's
    level *without* losing her progress. Today the level is welded to the kid
    identity; an upgrade means a `level` field per kid (or a progress
    migration listener→reader). Shape when the day approaches.
19. ✗ **Rethink la caja sorpresa** — considered 2026-07-14 and deliberately
    kept as-is: yes, the 15⭐ box is the cheap path to accessories, and the
    parent decided that's fine — the box is joy, prices are theater. Don't
    re-propose without new evidence (e.g. stars stop feeling scarce).

20. ☑ **La sopa de letras** — word search over deck words, 🟢/🟡/🔴 grid
    sizes, tap-first-and-last-letter selection. *(Shipped 2026-07-14,
    reader-level; opened to both kids 2026-07-15. See `shipped.md`.)*
    - ☐ **Bent-path words (true Squaredle)** — snaking selections instead of
      straight lines; deliberately cut from the first slice.
    - ☐ **Bonus words** — finding a non-target pack word still celebrates.
21. ☐ **Sentence attribute content** — the one content pack that unblocks
    three long-deferred items at once: quiz sentence prompts ("Toca el animal
    que dice muu", item 2), sí-o-no sentence claims ("El plátano es rojo —
    ¿sí o no?", item 4), and per-level daily cards (item 10).
22. ☐ **A Duolingo-like trail** — the parent's idea (2026-07-15, from
    `bugs.md`): a path the kids work through, easy → hard, *without* losing
    what's there today. Parked, not shaped — pick it up only if free
    navigation starts feeling directionless. Run `/shape` first; the two
    questions it must settle:
    - **One trail, or one per shelf?** A single spine is simpler and always
      has an obvious "next", but the kids can't follow an interest. Per-shelf
      trails let them chase animals or letters, but progress fragments and
      every shelf needs its own difficulty ordering.
    - **How does it sit next to free play?** A trail is a *prescribed* order,
      and this app is built on navigating freely by picture — plus the daily
      misión already answers "what do I do now". A trail risks becoming a
      second, louder home screen and quietly demoting both. It has to be
      additive, or it isn't worth building.
23. ☑ **Los cuentos — short stories** — the rung above Las frases: connected
    prose, read or heard page by page, then 3–5 comprehension questions.
    Shaped 2026-07-26. *(Shipped 2026-07-26 — six stories, 📚 on home; grown
    the same day to ten, adding four reader-level cuentos — the three World
    Cups Spain won and a trip to Japan — after the first six read as babyish
    to the eight-year-old. See `shipped.md`.)* Deferred out of that slice, in
    rough order of appeal:
    - **Mid-story questions** — cut on approval: the questions all land at the
      end, so the narrative reads unbroken. Revisit only if the kids sail
      through the end-quiz without having followed the middle.
    - **Recorded narration** — ADR 001 (speech synthesis) still stands, but the
      economics *invert* for stories: 6 stories × 6 pages is ~36 clips, a single
      afternoon's recording, where 365 vocabulary words never could be. If the
      synthesized voice is what makes a kid stop listening, this is the fix —
      and it needs its own ADR plus an asset budget.
    - **Read-along highlighting** — light each word as it is spoken. Wants
      per-word timings that `speechSynthesis` boundary events only sometimes
      give; check browser support before shaping.
    - **Per-deck stories** — a cuento per deck instead of a pack-wide shelf.
      31 stories is a content project, not a feature.
    - **Branching stories** — "¿qué hace el gato?" with two paths. Charming,
      but multiplies the writing and breaks the fixed page-dot progress.
24. ◐ **Illustrated story pages** — real pictures instead of the composed
    emoji scenes. **Done for the original six 2026-07-26** — all 36 pages
    illustrated, 3.3 MB, ADR 009. The four reader-level cuentos (the Mundial
    trilogy and Japan) started on emoji scenes and are now illustrated too:
    **all 10 stories, 68 images, 6.6 MB**. ☑ Done — the emoji-scene fallback
    stays as the safety net for any new cuento. Remaining polish: *Las
    campeonas* pages 2–8 want regenerating for a pitch-level camera (see
    `docs/storybook/mundial-2023.md`).
    Illustrate them one at a time — there is no half-way state to manage, a
    page shows art when it has art. What the pilot settled, kept here for
    whoever does the rest:
    - **It is the app's first binary content asset.** Everything today is
      emoji, CSS, and one self-hosted font; that is why a new deck costs four
      lines of typing and why the offline PWA is small. Art changes the
      category of the repo. Needs an ADR.
    - **Budget it before drawing anything.** ~6 pages × 6 stories ≈ 36 images.
      At 40 KB webp that is ~1.5 MB — fine to serve, but it must be weighed
      against the service worker's precache (ADR 005) and decided explicitly:
      precache them (offline stories, bigger install) or fetch on demand
      (smaller install, no stories on a plane).
    - **Style is the hard part, not the pipeline.** Six stories illustrated by
      different hands read as six different apps. The Sticker Book language
      (`docs/skills/frontend-design.md`) has to survive contact with real
      pictures — bold outlines, flat colour, no gradients, one visual voice.
    - **Authoring slows down.** Today a story is text in a `.ts` file; after
      art, every new page blocks on a picture. Decide whether emoji scenes
      stay as the fallback for new stories (recommended) or art becomes
      mandatory.
    - **Do it when** the kids have actually sat through the emoji version more
      than once. That is the evidence that buys the art — and it tells you
      *which* stories deserve it.

## Talking & letter games (shaped 2026-08-02)

25. ⏸️ **Habla conmigo — a real conversation partner (AI)** — the app's first
    runtime LLM. The kid holds a microphone button, says something in Spanish,
    and the **mascota** answers aloud in simple Spanish, on the topic of the
    deck she entered from. Shaped 2026-08-02: voice in, voice out, real model
    behind a server route. **Parked the same day** — shaped and costed, not
    built. The terms it must be built under are already recorded in
    [ADR 010](../adr/010-runtime-llm-conversation.md) so a future session
    starts from them instead of re-deriving them: browser-side transcription
    — the kid's audio never reaches our server, though **the browser does send
    it to Apple or Google**, which is a real step down from say-it-back and is
    the trade being accepted — nothing persisted, **a
    capability code on the route** — the ADR 004 pairing pattern, so a public
    URL with no accounts still can't be drained by a stranger — with rate
    limiting behind it, and one tile that vanishes when offline. Putting the
    API key on the device instead was considered and rejected 2026-08-02; the
    ADR records why.

    **Why it's different from everything shipped:** every game so far *asks*
    and the kid *answers*. This is the first one where the kid produces
    open-ended Spanish and gets a real reply. It is also the first feature the
    **pre-reader can do better than the reader** — no letters involved.

    - **Problem & user:** both kids, listener first. Say-it-back (5) is a
      parrot loop; nothing in the app talks back. The 8-year-old can form
      sentences and has nobody to form them with.
    - **The one behavior:** tap 🎙️, say something, hear the mascota reply in
      one or two short Spanish sentences that use the current deck's words.
    - **In scope:** deck-scoped entry (🗣️ on the deck choice screen) ·
      the named mascota as the voice, so the companion (10b) earns its keep ·
      browser speech recognition for the transcript · a server route holding
      the API key · reply style scaled by kid level (listener: 3–6 words,
      concrete nouns from the deck; reader: two short sentences, one question
      back) · a hard turn cap (~6) then the normal done screen + stars ·
      graceful absence — no mic, no recognition, or no network and the tile
      simply isn't there, with nothing else in the app degraded.
    - **Out of scope (deferred):** free-roam chat with no deck and no turn cap ·
      any correction or grading of the kid's Spanish · text entry for the
      reader · conversation history, transcripts, or sync · offline
      conversations · a parent-facing log of what was said · voice cloning or
      a non-synth voice for the reply (ADR 001 still governs output).
    - **Affected layers:** `domain/` — turn model, turn cap, level→style rules,
      and a conversation port (pure, testable, no SDK). `application/` — a use
      case that builds the deck-bounded context and awards stars at the end.
      `apps/web` — the repo's **first route handler**, a speech-recognition
      adapter beside `speech.ts`, the screen, and one new server-only env var.
      `packages/core` stays SDK-free, as always.
    - **How we'll know:** core tests — the cap ends the conversation; the
      context carries only that deck's words; listener and reader styles
      differ; an empty or failed transcript does not burn a turn. Observable —
      🐴 Los animales → 🗣️ → "hola" → the pet replies aloud about animals →
      six turns → done screen with stars. Mic denied: the tile is gone and the
      deck plays normally.

    Three things that must be settled before any code (they are the feature,
    not details):
    - **ADR 003 says voice recordings are never uploaded.** Browser
      `SpeechRecognition` keeps that true in the way that matters — only the
      *transcript* crosses the wire, never the kid's audio, and nothing is
      stored either side. But Chrome's implementation does send audio to
      Google's servers to transcribe it, so the ADR needs an explicit scope
      note either way. Do not treat this as a footnote.
    - **A public route with an API key is a spend risk.** Prod is a public URL
      with no accounts (ADR 002/004). Turn caps in the client are decoration;
      the route needs server-side rate limiting and a small `max_tokens`, or
      the first scraper pays for itself with our key. This is the one item
      that cannot be deferred out of the slice.
    - **It breaks the offline promise for one tile.** Everything today works on
      a plane (ADR 005). This will not. The cut above (tile absent when
      offline) is what keeps that promise honest everywhere else.

    Needs its own ADR (runtime LLM dependency) before building — the first
    time core play depends on a paid third-party API.

26. ☑ **Juegos de letras — el globo, then adivina la palabra** — two letter
    games over the pack words, **shipped as separate slices**, each **contained
    within its category**. Shaped 2026-08-02, both shipped the same day. Both
    reader-level like la sopa (20) and Deletrea, over the same word pool
    discipline — single word, article stripped, deaccented, uppercased.

    **26a. ☑ El globo (el ahorcado)** — the word is blanks; the kid taps
    letters from the Spanish alphabet and each wrong guess lets air out of a
    balloon. Six wrong and it pops. **Per deck.**
    - **The picture is not free.** The card's emoji is *hidden* by default —
      showing it would hand an 8-year-old the answer. It is behind a 💡 tip
      button, and taking the tip costs a life. What the tip reveals is set by
      difficulty: 🟢 shows the picture, 🟡 and 🔴 show the English meaning
      instead — a real clue that still leaves the Spanish word to find.
    - **Difficulty scales the word, not the lives:** 🟢 3–5 letters · 🟡 4–7 ·
      🔴 6–10. Six lives at every level, so the balloon always has six breaths.
      A deck only offers the levels its own words can fill (4 rounds), exactly
      like `sopaDifficulties`.
    - **Accents are dropped** (á plays as A, matching la sopa) so the keyboard
      stays 27 keys and thumb-sized.
    - **Stars, no album sticker** — same reason as Deletrea and la sopa: a
      reader-only game in an album slot would un-complete every listener.
    - **Out of scope (deferred):** a timer · listener mode · a daily word ·
      streak or duel integration · more than one tip per round.
    - **The name was a real decision.** A hanged man does not belong in a
      3–5-year-old's sticker book, so the mechanic keeps the name *el
      ahorcado* only in the roadmap; the game is **🎈 El globo**. The balloon
      is drawn in **inline SVG**, sized and coloured from the lives left —
      **no image assets**, so ADR 009 stays about story art alone.

    **26b. ☑ Adivina la palabra (wordle)** — guess the hidden word in six
    tries, 🟩/🟨/⬜ per letter. **Per category, not per deck.**
    - **The kid types the word.** On-screen Spanish keyboard (27 keys, Ñ
      included), ⌫ and ✓, keys tinted by the best thing learned about each
      letter — real wordle. A first cut had guesses *tapped* from a word list;
      that was rejected on review as not-wordle, and rightly.
    - **A made-up word can't be submitted.** "A real word" means **any word in
      the pack** of that length (63/83/78 at 4/5/6 letters), not just this
      shelf's — narrower and almost every honest attempt gets refused; wider
      needs a Spanish dictionary asset the app has no other reason to carry.
      A refusal costs nothing but a shake and says so honestly: *no conozco esa
      palabra*. It never spends one of the six guesses.
    - **Why the answer is category-scoped:** it is what keeps a Mi casa game
      about casa words. A deck can't host it — **only 10 of 41 decks have 5+
      same-length words, 3 have 6+**, so the target would repeat; a shelf has
      10–13. Measured 2026-08-02 before building, and it is why the entry tile
      lives on the shelf screen.
    - **Difficulty is the word length:** 🟢 4 letters · 🟡 5 · 🔴 6, offering
      only the lengths that category can fill with ≥6 words. Six guesses.
    - **Stars, no sticker**, like every other letter game.
    - **The shelf name is on screen the whole round** (🏠 Mi casa). It was
      `sr-only` at first ship — the answer was themed and the theme was
      invisible, which is the hardest kind of bug to see in a screenshot
      because nothing looks wrong. Found by the parent, not by the tests.
    - **Four tips, each costing one of the six guesses:** 💬 meaning ·
      🖼️ picture · 🔤 first letter · ✨ one more letter. Bought letters show
      in place; a spent guess is drawn as a 💡 row eaten off the board.
    - **Its tile is 🔡, not 🟩.** The wordle green stays on the board tiles
      where it means something; as a *shelf sticker* a green square renders as
      a flat blank and reads like a broken image next to 🍎 and 👕 — fatal on a
      screen navigated by picture. Caught in the verify screenshots.
    - **Out of scope (deferred):** a daily shared word and the sibling race
      (that belongs with the head-to-head hook under 10c) · hard mode ·
      a shareable result grid · Las letras, the one shelf whose words are too
      short to host it.
    - ⏸️ **A Spanish dictionary** — shaped 2026-08-02, then dropped on the
      same reasoning that produced the theme header: with the answer scoped to
      a shelf, a wider guess vocabulary is a politeness fix (it stops MADRE
      and PADRE being refused), not a gameplay unlock. Costed before deciding:
      a curated ~1,000-word child list is ~13 KB and cheap, but wants a
      profanity pass and permanent upkeep; a *full* Spanish list is 150–300 KB
      (1.5–3× the whole app's shared JS), needs a licensed source, an offline
      generation step and its own ADR. Revisit only if the kids actually hit
      refusals often enough to complain — and then add those specific words to
      the pack, don't ship a dictionary.
    - ☐ **Pack-wide answers** — considered and rejected 2026-08-02: 63/83/78
      candidates would make it true wordle, but the parent's call is that it's
      too hard for these kids without a theme, and they're right. The theme is
      the scaffold, not a decoration.

    **Watch the crowding.** This makes four reader-only letter games (✏️
    Deletrea, 🥣 la sopa, 🎈 el globo, 🔡 adivina). La sopa opened to both
    kids a day after shipping (2026-07-15) once the pre-reader wanted in;
    expect the same pull here, and expect the deck choice screen to need
    grouping before a fifth tile lands.

## Build-later shortlist (consolidated 2026-07-14)

The queue, gathered from the sub-items above so nothing hides in history:

- **Content follow-ons:** letter→word association "A de avión" (16) ·
  los miles y millones (17) · verbs in the games so the verbs shelf drops
  learnOnly (11) · sentence attribute content (21) · more cuentos, and
  illustrated story pages (24).
- **Play & retention polish:** difficulty sizes for quiz/sí-o-no/reto —
  the proven parejas pattern (12) · hard-mode timer/lose-state (12) ·
  guided accessory placement (13) · resize/rotate accessories (13) ·
  richer weekly missions (14) · more escudo sources (14) · sopa bent paths
  and bonus words (20).
- **Infra & platform:** CI on GitHub (fable-review features #2 — the one
  gap between a bad commit and prod) · no-Spanish-voice fallback
  (fable-review features #3) · listener→reader upgrade path (18) ·
  the first route handler + server-side rate limiting, which arrives with
  Habla conmigo (25) — parked, terms already set in ADR 010.
- **Answer attribution + timestamps** — approved 2026-08-03 as step 2 of the
  per-kid report, **not yet built**. Tag each recorded answer with the game it
  came from and when it happened, unlocking accuracy-per-game ("quiz 82%, globo
  41%") and a practice calendar (when they play, how often, how long a sitting
  runs). Neither is answerable today: all 11 players call the same
  `recordAnswer(kid, cardId, correct)`. Needs a capped event log, a storage
  migration, and merge rules ADR 004's additive/max merge doesn't cover (an
  append-only log dedupes by event id) — **and its own ADR first**, because it
  creates the most detailed record this app has ever kept of a child.
  Report views deferred with it: comparing the two kids side by side · CSV /
  print / export · per-word history charts · anything predictive · server-side
  or aggregate analytics · third-party analytics SDKs (permanently rejected —
  see the shipped write-up).
- **Sharing follow-ons** (cut from the pairing QR, shipped 2026-08-03 — see
  ADR 011): in-app camera scanning (the other device's native camera does the
  job today; an in-app scanner buys a permission prompt, a scanner dependency
  and an iOS Safari failure mode) · a QR for the GitHub repo — different
  audience, different screen, nothing shared with this one · a QR for the
  one-time *Copia única* code · download / print / share-sheet for the QR
  image · deep links into a specific deck or game · a kid-facing share tile
  (it would have to survive a 3-year-old and must not expose the key).

## Build order

**First slice: tap-the-right-picture quiz (2), no profiles** — shaped 2026-07-10:
the kid picker (1) was cut on approval; the quiz's two modes are picked per-play
from a per-deck choice screen, so it reuses all existing content and the speech
adapter with zero persistence. Then the sticker album (9) so games have a reward
sink, then more games. Sentence builder (6) comes after the album — it's the
biggest lift (new verb/adjective content). Revisit the kid picker (1) once a
second game exists and per-play mode buttons start to sprawl.
