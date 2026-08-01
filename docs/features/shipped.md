# Shipped features

## 2026-08-01 — La familia: the people of the house

One deck / 12 words — **La familia 👨‍👩‍👧‍👦**: la mamá, el papá, el hermano, la
hermana, el abuelo, la abuela, el tío, la tía, el primo, el bebé, la mascota,
la familia.

**On Mi casa, not ¿Cómo soy?** ¿Cómo soy? is about one person — the body, the
hair, the size, the mood — while the family is the people *around* that person,
and they live in the house. Mi casa had exactly one seat free (it was cut to
four decks in July when "…y yo" moved out), so La familia takes it and the
shelf is full again at 5. Home stays at nine shelves; the 9-shelf cap did not
have to move.

**Gender pairs are the lesson.** hermano/hermana, abuelo/abuela and tío/tía sit
adjacent so a kid meets each pair together and hears the -o/-a swap; a test
asserts the adjacency and that both halves share a stem, so a later edit can't
quietly split them.

**No question overrides.** Unlike the ¿Cómo soy? adjectives — where the built
scene question turned a description into a nickname ("¿Dónde está el gordo?") —
a relative is a countable person who is *somewhere*, so both built questions
already read native: "¿Es una abuela?", "¿Dónde está la abuela?". The deck test
asserts the overrides stay absent rather than letting one creep in.

**Faces that don't collide.** Quiz choices are picture-only, so two adult women
differing only by hair color make a coin-flip round: la tía is 👩‍🦰 and el tío
🧔, and el primo is 🧑‍🦱 rather than a second 👦. `bebe` was already taken by the
imperative ¡bebe! on the verbs shelf, hence the card id `bebe-familia`.

**Where:** `starter-pack.ts`, `deck-groups.ts`, accent in `deck-theme.ts`. No
domain change — album slots derive from activities, so the deck gets its
stickers and completion chest for free. Pack is now 40 decks / 464 words
public, 41 / 476 with El misterio.

## 2026-08-01 — Fix: the chest nobody opened

Kids' report: they sometimes forget to open the chest and never get the stars,
"especially in el reto". Real bug, not a misremembering. `StarChest` credited
the balance from its click handler alone, so any exit taken with the chest still
shut silently dropped the round's entire haul.

El reto was the loud case for four stacking reasons: 🔁 sits directly under the
chest and `start()` re-enters play immediately, unmounting the un-tapped chest;
a 60-second récord chase is the one mode kids replay back to back; the record is
banked automatically (`saveRetoBest` + confetti fire before any tap), so the
screen already looks like it paid out; and at one star per correct answer the
reto haul is the biggest on offer.

Two changes, both presentation-layer:

- **The safety net.** `StarChest` now banks on unmount as well as on tap,
  guarded by a ref so `onOpen` fires exactly once per chest. Covers every exit
  — replay, the header 🏠, browser back. The tap stays the celebration; it is
  no longer the paywall. (In dev, StrictMode's remount fires the cleanup once at
  mount, banking early but rendering identically; prod is unaffected.)
- **The visual cue.** The closed chest marks itself `data-chest="closed"`, and
  a `:has()` rule in `globals.css` fades the exit cluster to 40% and flattens
  its shadow, so the wiggling chest is the only thing on screen that still looks
  pressable. Nothing is disabled — a kid who leaves anyway keeps the stars. The
  exits opt in via `data-chest-exit` rather than being inferred from the DOM,
  because the duel's score cards are `.sticker` siblings that must not dim.

**Where:** `StarChest.tsx`, the gate rules in `globals.css`, and the
`data-chest-exit` tag on the three done screens (`RetoPlayer`, `DuelPlayer`,
`DoneScreen`). No core changes.

**Verified** end-to-end (prod build + headless Chromium): exits paint
`opacity 0.40 / saturate(0.35) / no shadow` while closed and return to full
color on open; replaying a reto round without opening credited all 383 stars;
opening then leaving credited exactly once; the duel paid both kids (6 / 3)
on the way out with its score cards undimmed; the header 🏠 exit is covered by
the net.

**Also fixed:** reto and duel didn't `syncPush()` when their chest opened —
only `DoneScreen` did — so those stars sat on the device until some other
activity happened to push, the same shape as the 2026-07-14 accessories-not-
syncing report. Both now push on open (a no-op when unpaired), which the
unmount net covers too.

## 2026-07-30 — Fix: the misión's blank tile

Parent report: a kid got a blank slot in one of the day's three activities, two
days running. `MissionCard`'s `KIND_EMOJI` was `Partial<Record<MissionKind,
string>>`, so when `cuento` joined both kids' pools (2026-07-19, Los cuentos) it
drew with no icon and no compile error — an empty dashed square a pre-reader
can't act on, on roughly 30% of days. 2026-07-29 (listener) and 2026-07-30
(reader) both drew it, exactly as reported.

Fixed at the type level, not by adding one emoji: `MissionKind` is now derived
from an exported `MISSION_KINDS` array in `domain/mission.ts`, and the icon map
is a **total** `Record` — a kind without an icon is a build failure. Added the
two that were missing: `cuento` 📚 (matching `activity-theme.ts`; 📖 already
means flashcards) and `reto` ⏱️ (never drawn, but now required). A core test
pins the set of kinds the daily draw can produce against `MISSION_KINDS`, so a
kind that becomes drawable can't slip past unnoticed.

Sibling of the 2026-07-14 counting-icon fix below: same map, same audience cost.
That one added the "icons must match the menu" comment; a comment can't fail a
build, and `Partial` is what let this through.

## 2026-07-29 — Mi día: the routine, and the first verb deck that plays

**Mi día 🪥** (11) on the ¿Cómo soy? shelf — the day a kid actually lives, in
infinitives: despertarse, vestirse, desayunar, lavarse los dientes, lavarse las
manos, peinarse, merendar, ver la tele, bañarse, cenar, acostarse. The shelf is
now full at 5 decks (body · hair · size · mood · day).

**It plays the games.** Los verbos is `learnOnly` because the built sí-o-no
claim — "¿Es un desayunar?" — is nonsense, and that costs the shelf every game.
This deck keeps the games instead, by overriding both built questions to the
progressive: `question: "¿Está desayunando?"`, `sceneQuestion: "¿Quién se está
peinando?"` — how you'd actually talk about a picture of someone mid-action.
That is roadmap 11's open sub-item proven on real content, though the verbs
shelf itself still can't drop the flag: its three decks teach one verb in three
forms, and the gerund/imperative decks would need their own phrasing pass.

**Reflexives keep their pronoun.** Seven of the eleven are reflexive, and the
"se" survives into every phrasing the games build — dropping it is the mistake
the deck exists to prevent, so a test asserts it card by card.

**No new words for things that existed.** *comer* (plus *comiendo* / *¡come!*)
was already on the verbs shelf, and *el desayuno · la comida · la cena* are
nouns in El día y la noche — this deck adds the actions only, and reuses those
pictures (🥞 desayunar, 🍲 cenar, 🛁 bañarse) the way the pack already reuses
⚽ for la pelota / el fútbol / jugar. Deletrea and la sopa skip the multi-word
and over-8-letter cards on their own (`spellingWord` / `gridWord` return null),
so five cards carry those two games.

**Where:** `starter-pack.ts`, `deck-groups.ts`, accent in `deck-theme.ts`. No
domain change. Pack is now 39 decks / 452 words public, 40 / 464 with El
misterio.

## 2026-07-28 — ¿Cómo soy?: describing a person

Two decks / 21 words for hair, skin, size and build, on a new ninth home shelf
**¿Cómo soy? 🧑** — the shelf a kid uses to describe themselves.

- **El pelo y la piel 💇** (11) — rubio, moreno, pelirrojo, canoso, calvo,
  rizado, la barba, el bigote, and three skin tones (la piel clara · morena ·
  oscura).
- **Alto o bajo 📏** (10) — alto, bajo, grande, pequeño, gordo, delgado,
  fuerte, joven, mayor, guapo.

**The shelf had to be made, not filled.** Mi casa y yo was already at the
5-deck cap, so its "…y yo" half moved out: that shelf is now **Mi casa 🏠**
(food, house, clothes, fruit) and **El cuerpo 🖐️** joins the new one.
**Las emociones 😀** moved off Jugar y aprender too — a feeling is something a
kid *is*, not something a kid plays — so ¿Cómo soy? reads body · hair · size ·
mood. Home seats nine shelves (the cap test moved 8 → 9); the ninth tile ends
a row alone, accepted over cramming hair onto a shelf about the house.

**Pictures for words that have none.** An adjective has no picture of its own,
so each size card borrows the creature that *is* the word — alto 🦒, pequeño
🐭, gordo 🐷 — the same one-picture-many-words reuse the pack already does with
⚽ (la pelota / el fútbol / jugar). Skin tone rides on a hand (✋🏻 ✋🏽 ✋🏿), not
a face: one word per tone, every kid included.

**Grammar the content had to carry.** These are *ser* adjectives, so the
sí-o-no claim reads bare ("¿Es rubio?" — "¿Está rubio?" would mean dyed). But
the scene hunt's bare-word fallback turns a description into a nickname
("¿Dónde está el gordo?"), so every adjective card overrides `sceneQuestion` to
"¿Quién es …?", matching what `usesEstar` already does for las emociones. Skin
cards are noun phrases and take a `question` override, because the built "¿Es
una piel clara?" is not something a Spanish speaker says. **Spain Spanish:**
*delgado*, not *flaco*.

**Where:** `starter-pack.ts`, `deck-groups.ts`, accents in `deck-theme.ts`. No
domain change — the existing `question` / `sceneQuestion` overrides carried it.
Pack is now 38 decks / 441 words public, 39 / 453 with El misterio.

## 2026-07-28 — El calendario: the eighth shelf

Calendar and time vocabulary, five decks / 55 words on a new home shelf
**El calendario 📅** — home now seats eight shelves (four even rows of two;
the cap test moved 7 → 8).

- **Los días de la semana 📆** (10) — lunes → domingo, plus la semana, el fin
  de semana, el calendario.
- **Los meses del año 🗓️** (12) — enero → diciembre.
- **La hora 🕐** (12) — o'clock only, la una → las doce, on clock faces.
- **El día y la noche 🌗** (11) — el día, la noche, mañana/tarde, mediodía,
  medianoche, the three meals, la siesta, las estrellas.
- **Las estaciones 🍂** (10) — the four seasons plus el año, el mes, el
  cumpleaños, la fiesta, las vacaciones, la Navidad.

**Pictures for words that have none.** Days wear the three-letter
abbreviation a Spanish calendar prints (Lun · Mar · Mié…) — the letters and
centenas precedent, where text *is* the art, and it means a day is findable on
a real wall calendar. Months wear the thing that happens in them (octubre 🎃,
diciembre 🎄), hours wear clock faces.

**Grammar the content had to carry.** A day and a month name are spoken bare:
"el lunes" means *on Monday*, and "el enero" is not Spanish at all. So day
cards keep their article in `article` (the scene hunt still asks "¿Dónde está
el lunes?"), and month cards — which take no article in any position — needed
a new `sceneQuestion` override on `VocabularyCard`, mirroring the existing
sí-o-no `question` override. Hours fix their own claim, because one o'clock is
singular and every other hour is plural: "¿Es la una?" but "¿Son las dos?".

**Where:** `starter-pack.ts`, `deck-groups.ts`, accents in `deck-theme.ts`;
`domain/card.ts` + `domain/scene.ts` for the override. Pack is now 36 decks /
420 words public, 37 / 432 with El misterio.

## 2026-07-27 — The confirm gate now covers every purchase

The ❄️ freeze was the only buy behind a confirm; everything else spent on the
first touch. A stray tap in La mascota adopted a 5500⭐ pet, and there was no
take-back. Now **every star spend meets the same gate** — pets, accessories,
themes, the caja sorpresa, avatars in the picker, and secret decks on the home
shelf — with the one deliberate exception of the 5⭐ meal, which is the repeated
core loop and would be tedious to confirm.

`FreezeConfirm` became `BuyConfirm`: same picture-only card (the thing being
bought shown huge, its price, green ✅ / red ❌), now on a sticker panel so it
reads as one object over the dense shop grids, with the backdrop dimmed harder.
Backdrop tap cancels, and it still auto-cancels after ~6s.

The affordability rule is unchanged and applied *before* the gate: a kid who
can't afford something still just gets the wobble and never sees a dialog they
couldn't complete. Nothing leaves the wallet until the ✅ — the purchase call
itself only runs on confirm, and each use case re-checks the balance, so the
gate adds no new spend path. Purely a UI change; no core logic touched.

Buy sites now gated: `MascotaView` (pet, accessory, theme, surprise),
`KidPicker` (avatar), `SecretDeckTile` (deck), `WeeklyCard` (freeze).

## 2026-07-26 — Every cuento illustrated, and the Mundial art fixed

All ten stories now carry a picture on every page: **68 images, 6.5 MB.**

*Halloween en Japón* completes the set. Ava reads as the older, taller sibling
in every frame — the standalone "Ava must look older and taller than Noah in
every single picture" line after the character sheet did that work — and the
park is generic throughout (pumpkin arch, ferris wheel, rollercoaster, no logos
or recognisable characters). Its smiling crescent moon matches the one in *La
luna es una galleta* and *El oso no puede dormir* unprompted, because the cast
bible description is identical. One page arrived with a drawn white frame and
rounded corners and was cropped inside the corner radius rather than
regenerated.

All three Mundial defects are fixed, each from the corrected prompt:

- ***Las campeonas*** — the whole aerial-scale fault is gone. Pages are now
  pitch level with the players large in frame, after the camera rule was made
  an explicit paragraph in every football prompt.
- ***El gol de Iniesta*** page 8 — a pitch-level trophy lift under floodlights,
  clearly different from the street celebration before it.
- ***La segunda estrella*** page 7 — the ball is unmistakably inside the net.

The trophy is now **the real World Cup trophy** in all three finals — two gold
figures spiralling up to hold a globe, on a green base — rather than the
generic two-handled cup the first attempts produced. It lives in the character
sheet, so it stays identical across the trilogy.

## 2026-07-26 — Mundial art review: three defects found, prompts fixed

Reviewing all 24 football pages at full size turned up three problems the
per-page checks had missed, and the biggest one was **our own prompt's fault**.

- ***Las campeonas*, pages 2–8 — a scale fault across the whole story.** Page
  2's scene line asked for the stadium "seen from high up". That anchored an
  aerial camera for the rest of the set, so pages 3–6 drew close-up players
  floating *on top of* a distant stadium — larger than the grandstand, with
  footballs outside the pitch — and pages 7–8 stayed so far away the players
  are specks at card size. The generator did what it was told; the brief was
  wrong.
- ***El gol de Iniesta*, page 8** — a second street celebration nearly
  identical to page 7 (already known, now prompted to be the trophy lift on
  the pitch).
- ***La segunda estrella*, page 7** — on the climactic "¡GOL!" page the ball
  ended up in the keeper's gloves outside the goal, reading as a save.

Fixes are in the prompts, not the code: every football block now carries an
explicit **pitch-level camera rule** (players large in frame, crowd a band
behind, never an aerial or whole-stadium view), and the affected scene lines
were rewritten. `mundial-2026` is the reference — pitch-level throughout, right
kits — and its look is what the other two should match.

The general lesson is recorded in the storybook README: **the first picture in
a set fixes the camera for every later one**, so an establishing shot early in a
story is expensive.

The current art still ships; these are improvements, not breakages.

## 2026-07-26 — The Mundial trilogy illustrated

*Las campeonas* and *La segunda estrella* get their eight pages each, finishing
the football trilogy. **60 images, 5.8 MB across nine illustrated stories.**

The two pages most likely to come back wrong both landed: England's keeper
diving full-stretch to push away Spain's penalty (a save, not a goal — the
easy thing to get backwards), and the 2026 ending with **two gold stars** over
the lifted trophy, which is the whole point of that story's title.

Crowd scenes again pushed hard against the ceiling — 149–168 KB a page against
the 200 KB budget set when *El gol de Iniesta* landed — confirming that retune
was the right call rather than a one-off.

Only *Halloween en Japón* is still on emoji scenes.

## 2026-07-26 — The Japan cuento becomes Halloween en Japón

Reworked on request: Legoland is gone, the story now centres on **Universal
Studios at Halloween**, and the two children are **Noah and Ava, siblings**
(they were Lucas and Sofía, invented placeholders). Renamed `viaje-japon` → `halloween-japon`
— free to do, since no art existed for it and nothing persists per story id
(the album is pack-wide under `cuento`, and word stats are per card).

**The cast is public cards only.** The obvious Halloween vocabulary — 👻
fantasma, 🦇 murciélago, 💀 calavera — all lives in **El misterio**, the
star-gated secret deck, and the app deliberately keeps that deck out of the
album, daily and review pools until a kid unlocks it. Casting it in a story
would leak the surprise to every kid, so the cast uses 🕷️ araña and 🕸️
telaraña (both public, both genuinely spooky) plus the travel words. The
Halloween atmosphere lives in the prose and the pictures, which cost nothing.

A seasonal deck (calabaza, disfraz, caramelo, bruja) would open this up
further and none of those words exist yet — worth a `/add-content` pass if
Halloween becomes an annual thing.

**Universal Studios is named in the prose but not drawn.** The art prompts ask
for a generic cheerful theme park with no logos or recognisable film
characters, for the same reason the football stories have no real faces.
Halloween is specified as jolly rather than frightening — the audience starts
at three.

## 2026-07-26 — El gol de Iniesta illustrated, and the art budget retuned

The first reader-level cuento gets pictures: eight pages of packed stadium,
the goal, and the streets afterwards. Page 4 is the one that could have gone
wrong — it needed a nil-nil scoreboard without any text, and came back with two
round zero shapes and a dash exactly as asked.

**The budget check fired, and this time it was wrong to blame the art.** A
stadium crowd is thousands of tiny distinct shapes — the worst case for JPEG —
so these pages cost 190–265 KB at the old 900px/q75 against a 150 KB ceiling,
while being perfectly on-style. Rather than special-case them, the pipeline was
retuned: **800px at q68**, because the picture area is only 384 CSS px wide so
900px was over-provisioned, and q68 is indistinguishable from q75 at that size.
The busiest page now lands at 184 KB under a 200 KB ceiling, and re-encoding
the existing library shrank it too (*La rana y la lluvia* went 607 → 427 KB).
44 images, 3.6 MB total. The script's advice changed with it: an over-budget
page is no longer proof of an off-style image, so look before regenerating.

**Known flaw, left in deliberately:** page 8 came back as a second street
celebration nearly identical to page 7, so a child turning the page sees almost
no change. The trophy is visible and the comprehension question still works, so
it ships — regenerating one page is cheap and it is noted in the story's prompt
file.

## 2026-07-26 — All six little-kid cuentos illustrated

*El perro y la pelota*, *La luna es una galleta* and *El oso no puede dormir*
finish the original six. **36 pages, 3.3 MB**, every page 54–118 KB and inside
budget.

Two things this batch proved rather than assumed:

- **The reworded prompt fixed the white mat.** All 18 pages came back
  full-bleed on the first try (checked with the same canvas scan that caught
  the cat batch), so the "fill the entire frame edge to edge" wording works and
  the earlier mat really was our own "generous empty margin" phrasing.
- **The cast bible holds across separately generated batches.** The orange
  tabby in *El perro* is recognisably the cat from *El gato y el pez*, and the
  grey mouse in *La luna* is the one who drums for the elephant — generated
  days apart, from nothing but a repeated character sheet. The singing crescent
  moon matches between *La luna* and *El oso* too.

The four reader-level cuentos (the Mundial trilogy, Japan) still show emoji
scenes and rely on the per-page fallback. The football ones look sparsest that
way — a goal page is a net, a ball and confetti — so they are the ones worth
illustrating next.

## 2026-07-26 — Four reader-level cuentos: three World Cups and a trip to Japan

The six original stories are pitched at the four-year-old, which left the
eight-year-old with nothing on that shelf — "kind of babyish", accurately. Four
new stories fix that: **El gol de Iniesta** (2010), **Las campeonas** (2023),
**La segunda estrella** (2026) and **El viaje a Japón**.

They are longer and harder on purpose: eight pages instead of six, a new
`STORY_MAX_PAGE_CHARS` of 110 (was a bare 72 in the test) so a page can carry a
sentence with a clause in it, and the **simple past** — a tense the decks never
teach, since the verbs shelf only has infinitive, gerund and imperative. A
story is the only place in the app a kid meets it.

**Not tiered, deliberately.** No reading-level field, no gating: the shelf is
picked by picture and an older kid reliably picks the football. Tiering would
have meant a domain change and two half-empty shelves; a picture book works at
both ages when the pictures carry the plot.

**Zero new vocabulary.** Every cast word already existed — `futbol`, `pelota`,
`trofeo`, `camiseta`, `estrella`, `avion`, `tren`, `torre` (🗼), `volcan` (🌋),
`castillo`, `robot`, `helado` — so no deck, shelf, album or README-count
invariants moved. That was the deciding factor in what these stories could be
about.

**The three Mundial stories are true**, so they carry the real details: Iniesta
in the 116th minute in Johannesburg; Olga Carmona in the 29th in Sydney, and
England's keeper saving Spain's second-half penalty; Ferran Torres off the
bench in the 106th at MetLife, beating Messi's Argentina 1–0. The 2026 final
post-dates the assistant's training data and was looked up rather than guessed
— getting a family's own memory wrong is worse than not telling it.

**No real people in the pictures.** The prose names the scorers; the art
prompts ask for generic cartoon footballers in plain red shirts with no faces,
names or numbers. Generators are unreliable at real likenesses, and a
recognisable player's face is not ours to ship. Same reasoning makes the Japan
theme parks "a movie park" and "a park of coloured building bricks" rather than
named brands.

Prompts for all four are in `docs/storybook/`; they show emoji scenes until art
exists.

## 2026-07-26 — El gato y el pez, illustrated (and a prompt bug fixed)

Third story with art: 102–111 KB a page, 637 KB for the story, 1.7 MB across
the three illustrated stories.

This batch arrived with a **164px white mat drawn into every page** — an image
inside an image. In the card, which already has its own ink frame, that reads
as a double frame. Measured rather than eyeballed (a headless-browser canvas
scan found the content box identical across all six: 872×696 at (164,110)),
then cropped with `sips --cropOffset` and checked again to confirm the art now
runs edge to edge.

The cause was **our own prompt**: "a generous empty margin around the subject,
so nothing important touches the edges" was read literally as a mat. All 36
prompt blocks in `docs/storybook/` now say the illustration must fill the frame
edge to edge with no border, mat, or rounded corners — and the storybook README
carries it as a third standing rule alongside "no text" and "keep the style
paragraph identical", with the crop recipe for if it happens again.

Worth noting the earlier two stories used the same wording and came back
full-bleed, so this is generator variance, not a reliable trigger. The prompt
is now explicit either way.

## 2026-07-26 — El elefante que quiere bailar, illustrated

The second story to get art, and the first to prove the pipeline is boring:
drop six PNGs in `art-source/elefante-baila/`, `pnpm art`, register, point the
pages at them. 79–94 KB a page, 507 KB for the story.

It also exercised the **cast bible** for the first time — the smiling crescent
moon on the last page is the same moon the sheet pins for *El oso no puede
dormir*, so the two stories will share a sky when the bear gets illustrated.
The sad page reads unmistakably (drooping ears, one teardrop, a worried mouse),
which matters more here than elsewhere: "triste" is the answer to one of that
story's comprehension questions, and the picture is what a pre-reader judges it
by.

## 2026-07-26 — La rana y la lluvia, illustrated

The pilot from roadmap #24: six generated pictures replace the emoji scenes in
one story. The frog, the snail and the mushroom house stay identical across all
six pages, which is the whole trick — the prompts pin a style paragraph and a
character sheet that never change, and only the scene line moves.

**JPEG, not the PNG the plumbing assumed.** The art *looks* flat but is
rendered with soft gradients, and `sips` writes 24-bit PNG with no palette
quantization: 700–900 KB a page, **~5 MB for one story**. The budget check in
`pnpm art` caught it on the first run. At JPEG q75 the same pages are 62–118 KB
— 609 KB for the story, an 8× saving — with no ringing visible in a 384px-wide
card, which is the only size a child ever sees. ADR 009 records the measurement
rather than the original assumption.

**Art source moved to a folder per story** (`art-source/<story-id>/<n>.png`),
because that is how a person actually organises six images. The folder name is
the story id, which is what makes the output filename match the page's `image`
key.

The remaining five stories keep their emoji scenes and now have ready-to-paste
prompts in `docs/storybook/` — one file per story, plus a cast bible pinning
the two characters that recur across stories (the cat is in two, the mouse is
in two) so the pack reads as one world.

## 2026-07-26 — Story art: the plumbing, ahead of the pictures

Roadmap #24, built **plumbing-first** so nothing blocks on anything: a story
page shows an illustration when one is registered and falls back to its
composed emoji scene otherwise. Until images land the app looks exactly as it
did — which is the point. Adding art is then "commit six files".

**An illustrated page replaces its emoji scene outright** — hero and props are
ignored for that page. A drawn picture with emoji stickers floating on top
reads as a bug, not a style. The picture sits in a 4:3 ink-bordered frame
inside the sticker, with the 🔊 hint over it.

**`StoryPage.image` is a key, not a path.** `packages/core` may not know what a
file is, so the pack says `image: "rana-lluvia-1"` and `apps/web/src/lib/
story-art.ts` maps that to an imported asset — the same shape `deck-theme.ts`
uses for colours. A core test pins keys to the `<storyId>-<pageNumber>`
convention.

**Format and placement are load-bearing, and are ADR 009.** PNG because `sips`
(macOS built-in) cannot *write* WebP and the repo has no `cwebp` or
ImageMagick — a build must never need a tool the machine might lack — and
because flat vector art wants lossless edges anyway. Imported from `src/`
rather than served from `public/` so the bundler content-hashes it: under ADR
005's cache-first rule a hashed asset self-invalidates when redrawn, while a
stable URL would sit in the service-worker cache until someone bumped `CACHE`.
Not precached: cache-first already means a story read once works offline.

**Failure modes, chosen deliberately:** a filename typo fails the build (the
import doesn't resolve); a key mismatch falls back to the emoji scene instead.
A missing picture must never be a broken screen for a child.

`pnpm art` resizes `art-source/` (gitignored originals) into the committed
folder at 900px and fails over 120 KB — a budget that doubles as a style guard,
since flat art lands far under it and a breach usually means the generator
returned something photographic.

**Verified with a throwaway placeholder** (a screenshot, standing in for art)
to exercise the illustrated branch and the mixed illustrated/emoji story, then
removed. The pilot story's six images are still to be generated; prompts and
the locked style block live in `apps/web/src/story-art/README.md`.

## 2026-07-26 — Los cuentos: short stories, then questions about them

The content ladder stopped dead after Las frases: words, then three-token
sentences, then nothing. **Los cuentos** is the next rung — six short stories
read (or heard) a page at a time, each ending in 3–5 comprehension questions.
📚 on the home screen, next to 💬.

**The shape (roadmap #23).** A story is ~6 pages; a page is one sentence, one
breath long, over a **composed emoji scene** (one hero at story size, two or
three props at fixed spots — the I-spy board is the app's *scattered* picture,
a story page is its illustration). Tap the picture to hear the sentence; the
page never auto-speaks. Then the questions: picture-choice, **2 for the
listener and 4 for the reader**, with the question spoken to both and written
only for the reader.

**Questions land at the end, never between pages** (cut on approval during
`/shape`): a quiz mid-narrative breaks the spell. They exist because the chest
has to have something honest to pay on — a story with no answerable moment
would have been the cheapest stars in the app, six taps and a payout. The
chest, the ✨/🔥/🆕 bonuses, and the mistake penalty are the standard ones.

**Distractors come from the story's own cast**, never the wider pack: a wrong
choice must be something the kid just met, so the question measures whether
they followed the story rather than whether they can rule out a far-off word.
Question order is the story's own (a small child recalls a narrative forwards);
replay variety comes from the distractor draw and choice order instead.

**Deliberately no word-stats tally** (unlike the quizzes). Missing "¿quién sube
al árbol?" means the kid lost the thread, not that they can't recognise
"el gato" — feeding that into El repaso would flag words they already know.

**Los verbos finally does something.** That shelf is `learnOnly` — the
generated noun questions ("¿Es un…?") never fit an action word, so it has no
game and no album slots. A story is the only surface where those words are
seen *acting*, and `oso-dormir` casts `dormir` and `cantar` (a content test
pins that at least one verb card stays in the casts).

**Where:** `packages/core` — `domain/story.ts` (the model, `storyCast`,
`createStoryQuiz` with injected `RandomSource` and a typed
`StoryCastCardNotFoundError`), `infrastructure/story-pack.ts` (the six
stories), `ListStoriesUseCase`. `apps/web` — `StoryShelf`, `StoryPlayer`,
routes `/cuento` and `/cuento/[storyId]/[mode]` (12 prerendered pages). Two new
album slots (`cuento-listen` / `cuento-read`) under a pack-wide `STORIES_ID`
section, like Las frases, and a new `cuento` misión kind in both kids' pools.
`DoneScreen`'s category resolver now keys off the section's own activity list —
a pack-wide section measured against `ALL_ACTIVITIES` could never complete.

**Note on deploy day:** adding `cuento` to the misión pool changes the
deterministic daily draw, so a mission already half-done today may show
different kinds once. One-day, one-time, and the same thing happened when
spelling and the sopa joined the reader's pool.

**Deferred (roadmap #23/#24):** illustrated pages — the page model already
carries an optional `image`, so art needs no domain change, but it would be the
app's first binary content asset and wants an ADR, a precache decision, and one
consistent visual voice. Also parked: recorded narration (the economics invert
for stories — ~36 clips, not 365 words), read-along highlighting, per-deck
stories, and branching paths.

## 2026-07-18 — El regalo del día: a free daily surprise on the home screen

The economy had every *paid* delight (la caja sorpresa, adoption, the shop) but
no free daily reason to open the app. Now a 🎁 sits on the home screen once per
calendar day, wiggling for attention; tapping it opens a picture-only reveal
(the present bursts into its reward, tap-or-auto-dismiss like the misión burst).

The draw is deliberately modest — **10–25⭐, occasionally a ❄️** (`domain/
daily-gift.ts`), never an accessory, so the free gift never undercuts the paid
box or the wardrobe. `ClaimDailyGiftUseCase` stamps the claimed dayKey *before*
paying out, so a double tap or a re-open can't pay twice; a new day reopens it.
The last-claimed day is a new per-kid localStorage key (`palabras.daily-gift.v1`)
and is **not synced** — like the resetting misión (ADR 004 cut ephemeral daily
state), it's a per-device nudge, while the stars/❄️ it grants ride the wallet
and freeze fields that already sync. New `GiftReveal` component.

## 2026-07-18 — La mascota gets a name, and cheers when you win

Two changes that turn the pet from decoration into a companion:

- **Name your pet.** On `/mascota` the pet's name shows big over its species
  ("Paco" / *El pollito*), with a ✏️ to open a text field (`MAX_PET_NAME` 24,
  trimmed and whitespace-collapsed in `namePet`). Naming is free. The name lives
  on `PetState`, so it rides the pet collection through sync and the transfer
  code; `mergePet` treats a name as precious — an unnamed device never clobbers a
  named one (`a.name ?? b.name`), and the sanitizer bounds it like any text.
- **The pet cheers on the done screen.** Finishing any activity now shows the
  kid's active pet bouncing beside the celebration, its name under the cheer, and
  speaks the phrase. (The name button uses an opacity press, not a scale one, so
  a fat-finger tap on the shrinking target can never miss.)

## 2026-07-18 — Winning says more than "¡Muy bien!"

Every activity ended on the same fixed *¡Muy bien!*, and kids habituate fast.
The done screen now draws one cheer per finish from a rotating pool of eight
short, **gender-neutral** Spanish exclamations (¡Bravo!, ¡Olé!, ¡Genial!,
¡Increíble!… — both kids play, so praise carries no masculine/feminine ending),
each with its own burst emoji, spoken aloud via the speech adapter. Pure
presentation over a tested `pickCelebration` in core (`domain/celebrations.ts`);
one draw per mount, so it never changes mid-screen.

## 2026-07-16 — A confirm gate before buying a ❄️

Tapping the home-screen ❄️ used to spend 30⭐ on the first touch, so a stray tap
drained a chunk of the wallet with no take-back. Now the tap opens a
picture-only confirm the way a pre-reader can read it: a dimmed overlay with the
❄️, its `FREEZE_COST⭐` price, and two big round sticker buttons — green ✅ buys,
red ❌ backs out. Tapping the backdrop also cancels, and it auto-cancels after a
beat so a distracted kid is never stuck deciding. A kid who can't afford it never
reaches the gate — the button still just wobbles (shared `useDeniedWobble()`), so
no star is committed until the ✅. New `FreezeConfirm` component; the actual
`buyFreeze` use case is unchanged — this is purely a UI gate in `WeeklyCard`.

## 2026-07-15 — Letters are named, not articled ("be", not "la be")

The abecedario spoke each letter with its article — "la a, la be, la ce" — and
the kids heard the article as part of the name. A letter is called **"be"**.

Card `spanish` is now the bare name, so flashcards, quiz, reto, duelo, parejas
and conecta all speak and show just the letter. The article hasn't been thrown
away (letter names *are* feminine, and a game still has to build a sentence):
cards carry it in a new optional `article` field on `VocabularyCard`, which
`sceneQuestion` uses to keep asking "¿Dónde está **la** be?" instead of the
ungrammatical "el be" its bare-word fallback would have produced. Sí-o-no keeps
its existing per-card override ("¿Es la be?"). Accented vowels still say "con
tilde" so a listen round dealing *a* and *á* stays answerable by ear.

## 2026-07-15 — La sopa de letras is for both kids

It shipped reader-level on the theory that finding a written word is reading.
Both kids play it and both love it, so the only gate left is the real one:
whether the deck's words fit a grid. Nothing else changed — sopa stays
sticker-less (no album slot), and `SopaPlayer` already recorded answers against
whichever kid is selected. "Deletrea" remains reader-level.

## 2026-07-15 — Counter wallets: syncing can no longer resurrect a spend (epoch 3)

A real bug, not a polish pass: the sync merge (ADR 004) max-merges progress,
which is correct for everything monotonic but **wrong for a star balance**,
because spending lowers it. Buy a 300⭐ pet on the iPad, then open the phone
(still holding the pre-spend balance) and the higher number won — the kid kept
the pet *and* got the stars back.

The wallet is now two **monotonic counters**, `{ earned, spent }`, with the
balance derived as `max(0, earned - spent)` (ADR 008). Earning raises `earned`,
spending raises `spent`, neither ever falls, so the merge's per-counter max is
both idempotent and spend-safe. `EconomyStore` speaks `Wallet` only, and
`trySpend` stays the one spending primitive (balance checked before the write).
Snapshots carry `wallets` and still emit the legacy `stars` balance as a
derived view, so a peer on an older build can read the row; wherever counters
exist they are authoritative. Wallet epoch 3 + the `wallet-epoch-3` migration
convert each device's balance to `{ earned: balance, spent: 0 }` — balance-
preserving by construction, and ordered after the epoch-2 seeding so a device
that skipped epoch 2 is seeded first, then converted.

## 2026-07-15 — Wallet restore: seeded goodwill balances (wallet epoch 2)

The zero reset landed as punishment — the kids watched their stars vanish —
so epoch 2 puts stars back (ADR 007). A plain revert of the reset commit
could not restore anything: every device had already run the `wallet-epoch-1`
zeroing migration, and the epoch merge blocks pre-reset balances by design.
Instead the restore uses ADR 006's own playbook: `WALLET_EPOCH` bumps to 2
and the run-once `wallet-epoch-2` migration seeds each kid's wallet from
**`WALLET_SEED_BY_AVATAR`** (core, `domain/stars.ts`) — **1000⭐ for 🐸,
300⭐ for 🐯** — keyed by the avatar the kid answers to, since kid profiles
are semantic ("listener"/"reader"). Seeding is `max(current, seed)`, so
stars earned since the reset survive and re-runs are idempotent; kids with
other avatars simply carry their balance forward. The epoch-1 zeroing stays
in the migration list so a device dormant since before the reset still sheds
its pre-rebalance balance before being seeded.

## 2026-07-14 — Star balances reset to zero (wallet epoch 1)

The rebalance follow-through: balances earned under the old weekend-sized
prices would have bought out the new catalog on day one, so every kid's
wallet starts the new economy at **0⭐**.

Mechanism (ADR 006): a naive local zero couldn't stick — sync max-merges
stars, and the cloud row permanently holds the highest balance ever pushed.
So core gains a **`WALLET_EPOCH`** (`domain/stars.ts`) stamped onto every
snapshot as `walletEpoch`; `mergeProgress` discards stars from the
older-epoch side instead of max-merging. A run-once storage migration
(`wallet-epoch-1`) zeroes the local wallets; the first push rewrites the
cloud row to epoch 1. Old transfer codes (no epoch) can no longer resurrect
a wallet either. Owned pets/accessories/avatars/decks, freezes, streaks,
and stickers are all untouched — the reset un-buys nothing.

## 2026-07-14 — Economy rebalance II: deeper top tier, 100⭐ caja sorpresa

A second balance pass the same day, extending the morning's rebalance
further up:

- **Mascots** — 20 → 28 species (🐭 ratón, 🐷 cerdito, 🐌 caracol, 🦀
  cangrejo, 🦩 flamenco, 🦈 tiburón, 🦚 pavo real, 🐊 cocodrilo), 2800⭐
  up to 5500⭐ — the roster now extends past el fénix instead of ending
  there.
- **Accessories** — `El armario` grew 28 → 38 (🍩 dona, 🌻 girasol, 🥁
  tambor, 🛹 patineta, 🫧 burbujas, 🎻 violín, 🪅 piñata, 🪩 disco, 🏆
  trofeo, 🪐 planeta), 380–700⭐, each with a default spot.
- **Themes** — 11 → 16 paper skins (Miel, Salvia, Hielo, Malva, Perla),
  300–450⭐.
- **Caja sorpresa** — 40⭐ → **100⭐** (a save-up treat, not pocket
  change); the star consolation scaled 8–20 → 20–50 to keep the same
  loss ratio. Tests now pin a 100⭐ floor on the box, ≥27 paid species,
  and a ≥4000⭐ top tier.

Feeding, avatars, and freezes are still unchanged; owned items untouched.

## 2026-07-14 — Economy rebalance: bigger catalogs, much higher prices

Parent report: the kids were buying out the whole shop in a weekend — the
star sinks were priced for a smaller game. A pure balance-and-content bump,
no new mechanics:

- **Mascots** — 12 → 20 species (🐸 rana, 🐠 pez, 🐙 pulpo, 🦉 búho,
  🐋 ballena, 🦕 dino, 🦖 rex, 🐦‍🔥 fénix). Adoption repriced steeply:
  first paid pet 40⭐ → 100⭐, top of the roster 240⭐ → 2500⭐ (el fénix) —
  adoption is now the economy's long game.
- **Accessories** — `El armario` grew 18 → 28 (⚽ pelota, 🍦 helado, 🧸
  osito, 🎸 guitarra, 🌈 arcoíris, 🪁 cometa, 🚀 cohete, 🌙 luna, 🔮 bola
  mágica, 💎 diamante), each with a default spot. Repriced 18–60⭐ →
  40–350⭐; the catalog is now listed cheapest-first, and the tests pin a
  40⭐ floor so nothing is a one-game impulse buy. (🛡️ was deliberately
  avoided — "escudo" already means streak freezes.)
- **Themes** — 6 → 11 paper skins (Durazno, Aguamarina, Limón, Coral,
  Nube), repriced 20–30⭐ → 60–250⭐.
- **Caja sorpresa** — 15⭐ → 40⭐ (the cheapest accessory), so the lottery
  never undercuts simply buying what you want; the star consolation grew
  3–8 → 8–20 to match.

Feeding (5⭐/meal), avatars, and freezes are unchanged. Existing owned items
are untouched — only future purchases pay the new prices.

## 2026-07-14 — Error boundaries: deploy skew self-heals, kids never see English

Parent screenshot: Next's default "Application error: a client-side
exception…" wall when opening ¿Cuántos hay?. Root cause class: a stale app
session (open since before one of the day's four deploys) requesting the new
deployment's route chunks — and the app had **no error boundary at all**, so
a pre-reader got an English dead-end with no way out.

Fix: `app/error.tsx` **auto-reloads once** on the first client exception of a
session (a reload fetches HTML and chunks from one deployment, healing every
skew variant invisibly); an error that survives the reload is a real bug and
shows a picture-only recovery screen — 🙈 with big 🔄 retry and 🏠 home
stickers. `app/global-error.tsx` covers root-layout failures with an
inline-styled equivalent. Verified by injecting a persistent render throw:
one automatic reload, then the recovery screen, never the default wall.

## 2026-07-14 — Fix: the misión's counting icon pointed at the wrong place

Parent report (live, mid-misión): the counting slot showed 🔢 — the *numbers
deck tile's* emoji — while the game itself is branded 🧮 everywhere a kid
sees it (menu, player, done screen). A pre-reader navigates by picture alone,
so the misión icon sent him to the deck tile, where no amount of flashcards
fills a counting slot. Icon corrected to 🧮; the KIND_EMOJI map now carries
the invariant in a comment: mission icons must match the menu's game icons.

## 2026-07-14 — Fix: sync is now safe while both devices play at once

Parent report: sync misbehaved with both devices open. Root cause was
device-LOCAL, not the documented cloud race: `syncPull` captured the local
snapshot *before* the network fetch, so progress earned during the wait (a
misión chest claim, a purchase) was rolled back when the stale merge applied
— a claimed chest could even un-claim and pay twice. Compounding it, nothing
serialized a device's own sync operations, and pushes computed the cloud
union but never applied it locally.

The fix, per layer: the pull/push use cases now take a snapshot **supplier**
and read local only after the remote row arrives (order pinned by a core
test); all sync operations on a device run through a **serialization queue**;
and every push **applies its returned union locally** (re-merged against
fresh local, so quiz answers recorded while the save was on the wire
survive) — each push doubles as a pull, so two devices playing at the same
time converge on every action instead of waiting for home-screen visits.

The live two-device verify then exposed a second gap the instrumentation made
undeniable (zero pushes logged after game completes): the award path only
pushed **when the chest was opened**, so a kid finishing and leaving without
tapping it never synced that game at all. Completion now pushes on the done
screen itself; opening the chest pushes again with the stars. Re-verified
live: two paired browser contexts playing different decks simultaneously
against the real backend — the cloud row held both stickers, both devices
converged to both, stars merged, and the throwaway row was deleted after.

## 2026-07-14 — La sopa de letras (word search)

The parent's Squaredle idea (`docs/bugs.md` #7), shaped and built: deck words
hidden in a letter grid. *(Originally reader-level; opened to both kids on
2026-07-15 — see the entry at the top of this file. Both kids love it.)*

- **Rules in core** (`domain/sopa.ts`, tested): 🟢 6×6/3 words · 🟡 7×7/4 ·
  🔴 8×8/5 (the parejas difficulty pattern); words placed left-to-right,
  top-to-bottom, and both downward diagonals — never backwards, this is
  reading practice. Grid forms drop accents (Ñ stays, its own letter);
  articles strip; multi-word and >8-letter entries don't qualify, and decks
  that can't fill a grid don't offer the game (menu + route both gate on
  `sopaDifficulties`).
- **Tap-two-ends selection:** tap the first and last letter; either tap order
  counts, a bent selection re-anchors instead of buzzing (a mis-aim isn't a
  mistake), a straight-but-wrong one is. Found words light their cells lime,
  reveal their emoji on the word chip, and are spoken aloud.
- Sticker-less like Deletrea (an album slot would un-complete every reader's
  finished categories); star chest + word stats + the reader's misión pool
  (🥣 kind) all wired.

## 2026-07-14 — Letter-case switch + El abecedario completo

Parent follow-ups to the letras shelf, same day.

- **A / a / Aa switch** on the letters shelf: which case a kid sees on every
  letter card and game face — uppercase by default (one case at a time while
  learning), lowercase, or both. Per-kid, remembered on-device (a display
  choice like the theme, per ADR 004; the spoken name never changes). Pure
  rules in `domain/letters.ts` (`isCasePairGlyph` detects letter-pair faces
  so real emoji, keycaps, and digit faces pass through untouched — tested);
  the players draw every face through `cardFace()`, and a single "B" earns
  the full single-glyph size automatically.
- **El abecedario 🔠** — a fourth tile on the letters shelf: all 27 letters
  in alphabet order (ñ after n, accented vowels excluded — they're
  spellings, not alphabet members), one flashcard run, like singing the ABC.
  Assembled from the letter decks (`buildAlphabetDeck`, order pinned by a
  test); no sticker of its own — progress lives in the three real decks.

## 2026-07-14 — Las letras shelf + Las centenas (bugs.md ideas, shaped & built)

Two of the four parent ideas from `docs/bugs.md`, shaped via `/shape` (picks:
letters as their own area with vowels emphasized; hundreds only for now) and
built via `/add-content`.

- **Las letras 🔤** — a new seventh home shelf (group cap deliberately raised
  6→7 in `deck-group.test.ts`): **Las vocales** (a e i o u + á é í ó ú — ten
  cards, the accented pairing teaches tildes), **Las letras B–M**, **Las
  letras N–Z** (ñ included; the full 27-letter alphabet is pinned by a pack
  test). Both cases on the card face ("Bb" — no emoji exists; the display
  font is the art) and `spanish` carries the letter's *name with its
  article* ("la be", "la eñe"), so tap-to-hear teaches names by ear.
  **Game-enabled from day one** (parent's call on approval): quiz/reto/duel
  speak the bare name, scene's "¿Dónde está la be?" falls out of the article
  rule, and sí-o-no uses the unique-entity `question` override ("¿Es la
  be?", never "¿Es una be?"). Accented vowels are spoken "con tilde" so a
  listen round dealing both a and á stays answerable by ear.
- **Las centenas 💯** — cien to mil (10 cards) on the numbers shelf, playable
  in all games. Digit strings as card faces ("200"), not keycap sequences —
  three-plus keycaps were exactly the iPad overflow bug, and the new
  wide-glyph sizing handles digit widths automatically.
- Pack is now **31 decks / 365 words** public (32 / 377 with the mystery
  deck); README and the counts test updated together.

## 2026-07-14 — Fixes: purchases now sync, big numbers fit their tiles

Two parent-reported bugs (`docs/bugs.md` #5 and #3), both root-caused per
`/investigate`.

- **Purchases never pushed** (#5): `syncPush` fired only on game-complete and
  misión-claim, so anything bought on one device — wardrobe accessories,
  pets, avatars, freezes, deck unlocks, theme star-spends — stayed local
  until that device happened to finish a game, and the other device showed a
  stale subset. The snapshot pipeline itself was proven innocent by a new
  regression test (a full phone wardrobe survives encode → sanitize → merge
  into a stale tablet). Fix: every star-mutating action pushes, matching the
  existing game-complete pattern.
- **Big-number tiles overflowed on iPad** (#3): the 11–20 and tens decks use
  two-keycap emoji ("9️⃣0️⃣") that paint ~2× wide; above the `sm:` breakpoint
  (tablets) they burst out of the games' fixed squares — reproduced and
  re-verified in headless screenshots at 820×1180. Fix: grapheme-aware
  `emojiSizeClass()` (`apps/web/src/lib/emoji.ts`) steps wide sequences down
  to ~60% in all nine card-emoji render sites (quiz, parejas, conecta,
  sí/no, escena, cuántos, reto, duelo, flashcards).

## 2026-07-13 — Offline PWA, per-kid misión, parent trend, sync-on-visible

Implements `docs/fable-review/features.md` #1, #4, #5, and the remaining
half of #6 (the delete-cloud RPC and local dayKey in #6 had already shipped).

- **Real offline (ADR 005):** a hand-rolled service worker
  (`apps/web/public/sw.js`) — network-first navigations (deploys win when
  online; the last-seen page, then the home shell, when not), cache-first for
  Next's immutable hashed assets, sync RPCs untouched. Registered in
  production builds only via `ServiceWorkerRegistrar` +
  `isProductionBuild()` (a client-inlinable env read added to
  `packages/config`). After one online visit the installed PWA launches and
  plays with no network.
- **Per-kid misión pools:** `dailyMission` now draws from each kid's own
  pool — the reader's adds ✏️ spelling (reading practice a pre-reader can't
  do); reto stays out for both (timed). A finished spelling game already
  marked the misión via `DoneScreen`, so completion works end to end.
- **Parent trend report:** `/informe` gains 📈 Progreso — total learned words
  ("right at least once and not struggling", the same bar as palabras
  fuertes), a "+N esta semana" delta, and a mini bar per sampled week. One
  cumulative sample per local week, appended on-device (`domain/trend.ts`,
  `SampleTrendUseCase`, `palabras.trend.v1`), capped at 12 weeks, refreshed
  whenever the informe opens. Deliberately device-local: word stats sync, so
  each device grows an equivalent history; first-ever week shows "primera
  semana registrada" instead of a fake delta.
- **Sync-on-visible:** the home screen re-runs the sync pull whenever the tab
  becomes visible again, so a tablet left open all afternoon picks up the
  phone's progress without a reload.
- **Maskable icon:** `icon-maskable.svg` (full-bleed, safe-zone art) joins the
  manifest so Android launchers mask instead of letterboxing.

## 2026-07-13 — Local-day daily time + lint floor + skills grounding (review follow-ups)

Implements `docs/fable-review/code-quality.md` #2–#5 and all of
`docs/fable-review/claude-skills.md`.

- **The "day" is now the LOCAL calendar day** (`dayKey`/`weekKey` in core).
  Before, days flipped at UTC midnight — mid-evening in the Americas: the
  carta del día changed during dinner, a 7pm session fed *tomorrow's* misión,
  and an evening-then-morning pattern could read as a streak gap. Kid-visible
  fix; tests rewritten timezone-portable (local-time constructions, plus a
  regression test pinning 23:59 local to the same local day). One-time
  transition wrinkle: the first open after this deploy may see the daily card
  change once mid-day. Sync note: paired devices share a household timezone,
  so merged day strings stay comparable.
- **Storage reads validate:** the sanitizer's type guards (`isMissionState`,
  `isWeeklyStreak`, `isWeekProgress`, `isPetCollection`, `isCategoryAwards`)
  are exported from core and applied in `economy-store.ts` — a corrupt
  localStorage document now reads as absent instead of surfacing as a shape
  surprise inside a use case.
- **Lint floor raised:** `packages/core` and `packages/config` now have eslint
  (`pnpm lint` covers all three packages — it immediately caught two dead
  imports); `apps/web` adds `react-hooks/rules-of-hooks` (error),
  `react-hooks/exhaustive-deps` (warn), and the Next plugin. The four
  surfaced dep warnings were fixed (HomeView memoizes its derived deck lists)
  or annotated where deliberate (QuizPlayer, RetoPlayer).
- **HomeView decomposed:** `MissionCard`, `WeeklyCard`, and `SecretDeckTile`
  extracted (HomeView 534 → ~370 lines), `KIND_EMOJI` at module scope, and
  the buy-refused wobble beat is one shared `useDeniedWobble()` hook (also
  adopted by MascotaView).
- **Skills grounded in this repo:** `diagram`/`adr`/`ship` no longer describe
  a previous project (phantom ADRs, `@workout-tracker/core`, a shared prod
  DB); `ship` runs the gates explicitly and checks README pack counts;
  `docs/workflows/adding-a-feature.md` + `fixing-a-bug.md` now exist so every
  skill hand-off resolves; `/add-content` (new) maps the content-pack
  invariants; `verify` gained sync-panel gating and album-screenshot checks;
  `expo.dev` removed from settings permissions.

## 2026-07-13 — Economy logic moved into core (architecture review follow-up)

Implements `docs/fable-review/architecture.md` #1–#4. No behavior change
intended — this is the app's most intricate rules (money, claims, cascades)
moving under the test floor.

- **Economy use cases in core:** a synchronous `EconomyStore` port
  (`domain/economy.ts` — localStorage is sync; async would be ceremony) plus
  18 use cases in `application/` carrying every rule that lived untested in
  `apps/web/src/lib/economy.ts`: spend-before-write ordering, purchase
  idempotence, misión claim-once, the misión→weekly-active-day cascade,
  weekly rollover persistence, surprise-draw application, category-chest
  never-re-pays, reto record-keeping. 28 new tests against an in-memory fake.
  `economy.ts` keeps its public API as a thin facade.
- **Prices come from catalogs, not callers:** `adoptSpecies`,
  `buyAccessoryForActive`, and `buyAvatar` dropped their `cost` parameter —
  core looks prices up in `PET_SPECIES` / `ACCESSORIES` / `AVATAR_CATALOG`,
  so a component can no longer pass an arbitrary price. Free-starter avatars
  are now unbuyable (they're implicitly owned).
- **One client composition root:** `client-container.ts` is now the only
  place browser-storage/remote adapters are constructed. `album.ts` is gone
  (components import use cases from the container); `transfer.ts` and
  `sync.ts` take shared store instances from it. The dead async
  `StarStore`/`MissionStore`/`PetStore` ports were removed from core.
- **Versioned storage migrations:** the pet-v1→collection and
  per-pet-accessories→wardrobe moves left their readers and live in
  `storage-migrations.ts` — a run-once-per-device registry (applied set
  persisted), executed on the session's first storage access.
- **ADR 004 addendum:** the sync push race (last-write-wins, self-healing)
  is now recorded with the two options a future session should weigh before
  "fixing" it.

## 2026-07-13 — Sync hardening + borrar la nube (security review follow-up)

Implements `docs/fable-review/security.md` #1–#5. The write path was the
exposed surface (the anon key is public by design): `put_progress` accepted any
code string and any payload size, so anyone could script unbounded row creation.

- **RPC hardening** (`supabase/migrations/0002_progress_hardening.sql`):
  `put_progress` now rejects non-pairing-code-shaped codes and rows over 64 KB;
  all RPCs pin `search_path = public, pg_temp`; a weekly pg_cron sweep deletes
  rows untouched for 12 months. **Apply to the Supabase project before
  deploying this code** (runbook).
- **Borrar el progreso en la nube** — new `delete_progress` RPC +
  `DeleteProgressUseCase` + a two-tap action in the sync panel: a family can
  remove its cloud row, not just abandon it. Local progress everywhere is
  untouched.
- **Sanitizer magnitude caps** (`domain/transfer.ts`): counts must be safe
  integers ≤ 1 000 000 (no more sticky `Infinity` under max-merge), text fields
  ≤ 64 chars, lists capped — plus size caps on transfer codes (256 KB) and RPC
  responses, so a hostile payload can't fill a device's localStorage.
- **Safer pairing:** the code is persisted only after the first round-trip
  succeeds, and joining now requires the cloud row to exist — a
  mistyped-but-well-formed code gets "no encontramos ese código" instead of
  silently forking the family's progress into a fresh row.
- **Security headers** (`next.config.ts`): strict same-origin CSP (+ Supabase
  connect, blob media for say-it-back), nosniff, frame denial, and a
  Permissions-Policy that grants only the microphone.

## 2026-07-13 — Fix: the daily misión now syncs across devices

**Bug:** a kid could finish today's misión on one device and still see it as
incomplete on another — the `ProgressSnapshot` carried everything *except* the
mission, so completion never propagated. Because mission-complete also feeds the
weekly streak (`weekProgress`, which *did* sync), a device could even show the
week advancing while the mission card looked untouched; and the un-synced
`claimed` flag let the +10⭐ chest be claimed once per device.

**Fix:** added `missions` to `ProgressSnapshot`. `mergeProgress` unions the done
kinds within a day (a later day supersedes) and keeps `claimed` once either
device has set it — so a finished misión reads complete everywhere and the bonus
can't be re-claimed. Wired through `currentSnapshot`/`applySnapshot`
(`getStoredMission`/`saveStoredMission`) and pushed on claim as well as on game
complete. `packages/core` merge + sanitize covered by tests; verified end-to-end
via the copy-paste transfer code (same snapshot path): a completed misión on
device A shows complete on device B after import.

## 2026-07-13 — Completable categories + tiered completion chests

The album showed all 11 activity slots per category to every kid, but a kid only
ever reaches their **own** difficulty variant through the menus — so a pre-reader
could never fill the 5 read/words slots, and their counter never hit 100%. Now
each album section shows only the games that kid can earn (the shared `learn`
plus their listen/pictures **or** read/words set — 6 per deck, 1 for frases), so
completion is actually reachable. The `total` and the per-slot rendering both
use `activitiesForKid`.

**Finishing a whole category now pays off, and keeps paying.** A section's tier
is its **weakest** slot (gold only when every earnable sticker is gold). Reaching
each tier opens a one-time **completion chest** — 🥉 bronce **+15⭐** (all games
earned), 🥈 plata **+30⭐** (all silver), 🥇 oro **+50⭐** (all gold) — and stamps
a matching **medal** on the category header in the album. Completion is detected
on the `DoneScreen` right after the sticker award (so a replay that tiers up the
last slot triggers it too) and celebrated with a full-screen `CategoryBurst`
(the deck emoji + medal, confetti, star chest; tap or auto-dismiss).

**Where:** `domain/category.ts` (`activitiesForKid`, `categoryTier`,
`categoryReward`, `pendingCategoryTier`) + tests; client ledger + claim in
`lib/economy.ts` (`palabras.category-awards.v1`, keyed deck→highest-claimed-tier,
each chest opens once); `CategoryBurst`, wired in `DoneScreen`; medal + earnable
slots in `AlbumView`. The claim ledger is **synced** (added to `ProgressSnapshot`,
`mergeProgress` keeps the higher tier per deck) so a completion chest never
re-pays after sticker counts converge on a second paired device.

## 2026-07-13 — Cross-device sync (optional, local-first)

Kids can now open the latest progress on any device. Local-first is preserved:
reads stay instant from `localStorage`; the cloud is a background convergence
layer (ADR 004). Sync is **feature-flagged by env** — with
`NEXT_PUBLIC_SUPABASE_*` unset the app is exactly the pure-local app it was.

**For:** parents with more than one device; invisible to the kid. **Pairing** is
a one-time parent action: create a code on device A (Progreso entre dispositivos
→ *Sincronizar entre dispositivos*), type it once on device B. The code is a
~100-bit **capability key** — no accounts, no email. Two Supabase
`SECURITY DEFINER` RPCs (`get_progress`/`put_progress`) require the code as an
argument and RLS denies all direct table access, so rows can't be enumerated and
the public anon key is safe to ship.

**Freshness:** **pull on app open**, **push on game complete** (not per answer),
both best-effort — a failed sync leaves local state authoritative and retries on
the next open. **Conflicts** resolve by additive merge (`mergeProgress`: sticker
union, `max` stars/counts/freezes, longer streak), so no device can erase
another's rewards. This slice extended the snapshot to carry **freezes** and the
**weekly streak / week-progress**; the copy-paste transfer code inherits them.

**Where:** `RemoteProgressStore` port + `generatePairingCode` in
`packages/core/domain/sync.ts`; `Pull`/`PushProgressUseCase` in `application/`;
`SupabaseProgressStore` (a ~60-line `fetch` adapter, no SDK) + `lib/sync.ts`
orchestration in `apps/web`; `SyncPanel` in the parent panel; pull wired in
`HomeView`, push in `DoneScreen`. SQL in `supabase/migrations/0001_progress_sync.sql`.

**Not synced (by design):** theme and selected-kid are per-device pointers, not
progress. **Deferred:** live realtime, daily misión/reto state, real accounts &
recovery, multi-parent sharing (see `roadmap.md`).

**Ops:** create a Supabase project, run the migration, set the two
`NEXT_PUBLIC_SUPABASE_*` vars in Vercel — steps in `docs/runbooks.md`.

## 2026-07-13 — Weekly streaks & freezes

A longer-horizon habit loop on top of the daily streak, reusing the existing
daily misión as its heartbeat.

**For:** both kids. An **active week** = the daily misión finished on 3 distinct
days (Monday-based, UTC). Each active week bumps the **weekly streak**; the first
app-open of a new week rolls the finished weeks over and plays one of three
distinct animations — **increased** (🔥 confetti burst), **frozen** (❄️ "un
escudo guardó tu racha"), or **reset** (🌱 "a empezar", no scolding).

**Freezes (escudos):** every kid starts with **3**. An idle week auto-spends one
escudo to hold the streak instead of resetting; with none left, the streak resets
to 0. Escudos are earned three ways: the 3 starters, **buying** one for **30⭐**
on the home screen, or **winning** one from the 🎁 caja sorpresa (a new
consolation outcome). Freezes only protect a live streak — a 0-streak never burns
one. `/informe` shows each kid's 🔥 weekly streak and ❄️ escudo counts.

**Where:** pure rules in `packages/core/src/domain/weekly.ts` (`weekKey`,
`markActiveDay`, `weekIsActive`, `rollWeek` — 100% covered) plus a `freeze`
outcome on `drawSurprise`; localStorage orchestration in
`apps/web/src/lib/economy.ts` (`rolloverWeekly`, `buyFreeze`,
`markMissionActiveDay`, `getFreezes`); UI in `HomeView` (badge + buy),
`WeeklyBurst.tsx` (the three animations), and `InformeView`.

**Deferred (parked in roadmap.md):** a separate richer "weekly mission" concept;
carrying weekly streak/escudos in the device-transfer code; freeze sources beyond
buying, the starters, and the surprise box.

## 2026-07-12 — Content expansion across all five pools

A pure-content bump, no new mechanics:

- **Words** — a new **Las aves 🦜** deck (10 birds: pato, loro, pavo, cisne,
  águila, gallo, paloma, búho, pavo real, cuervo) on the `animales` shelf (now
  5 decks). Pack: 27 non-secret decks / 323 words (28 / 335 with the bonus).
- **Verbs** — each of the three verb-form decks grew 12 → 15 (nadar/pintar/
  abrazar, in all of infinitivo · gerundio · imperativo).
- **Phrases** — `Las frases` grew 72 → 84 sentences (the content cap), reusing
  pack vocabulary.
- **Accessories** — `El armario` grew 12 → 18 (⭐ estrella, 🏅 medalla, 🎓
  birrete, ☂️ paraguas, ⌚ reloj, 🍀 trébol), each with a default spot.
- **Mascots** — 9 → 12 species (🐴→🐎 caballito, 🐵→🐒 mono, 🥚→🐝 abeja).

Content tests pin the new deck list, keep the 10–15 cards-per-deck bound, and
still enforce unique ids pack-wide and unique emoji within a deck.

## 2026-07-12 — Difficulty levels for Las parejas + drag-to-place accessories

Two independent slices.

**Difficulty for the memory game.** `Las parejas` now opens on a difficulty
chooser — 🟢 Fácil / 🟡 Medio / 🔴 Difícil — that sets the board to **3 / 5 / 8
pairs**. Board size is a new `MemoryDifficulty` axis in core, orthogonal to the
pictures/words mode (which is still the kid profile's). Every non-secret deck
ships ≥10 cards, so any deck fills the hard board. The chooser shows each level's
pair count as dots, so a pre-reader picks without reading. This slice is matching
pairs only; other board-scalable games are deferred (see `roadmap.md`).

**Free-drag accessory placement.** Worn accessories used to snap to one
hardcoded spot each. Now the kid drags each accessory anywhere on the pet and it
stays, saved per pet. New per-pet `PetState.placements` (percent coords) plus
core `placeAccessory` / `accessoryPlacement`; the old `ACCESSORY_SPOTS` map is
now just the default until the kid moves an item. `MascotaView` tracks the drag
with window-level pointer listeners (so it keeps up when a finger leaves the
little emoji, and the release always lands — pointer capture proved unreliable),
persisting via `placeAccessoryOnActive` in `economy.ts`. Pure creative dress-up:
no right/wrong. The guided "put it in the correct spot" learning variant is
deferred.

**Where:** `MemoryDifficulty` in `packages/core` memory domain;
`PetState.placements` + `placeAccessory`/`accessoryPlacement` in the mascota/
wardrobe domains; `MemoryPlayer` chooser + `MascotaView` drag + `economy.ts`
persistence in `apps/web`.

## 2026-07-12 — Los verbos: a flashcards-only verbs shelf

**For:** pre-readers (ages 3–5) — the pack taught only nouns/adjectives/numbers,
so there was nowhere to learn action words.

**What shipped:** a sixth home shelf **Los verbos 🏃** with three decks over the
same 12 action verbs, one per verb form — **El infinitivo** (comer), **El
gerundio** (comiendo), **El imperativo** (¡come!). Each form teaches the same
verbs in the same order with the same pictures; only the spoken word changes.

The verbs are **learn-only**: a new optional `Deck.learnOnly` flag marks a deck
that never generates quiz-style game content, because every game builds
noun-shaped questions ("¿Es un…?") that don't fit an action word. Its game menu
therefore offers **Las tarjetas** alone, and `learnOnly` decks are excluded from
the cross-deck counting item pool. Verbs still surface as the daily "carta del
día" and as album cards (both audio/picture-only, so safe).

**Where:** `Deck.learnOnly` in `packages/core` domain; three decks in
`starter-pack.ts` and the `verbos` group in `deck-groups.ts`; `GameMenu`
flashcards-only branch, counting `itemPool` filter, and verb accents in
`deck-theme.ts` in `apps/web`. Pack is now 26 decks / 304 words on six shelves
(27 / 316 with the bonus).

**Deferred (not dropped):** verb tenses that need conjugation — **futuro**
(comeré) and **condicional** (comería) — as sibling decks on the same shelf;
and verb-native game phrasing so verbs can join the quiz-style games. Both
parked in `roadmap.md`.

## 2026-07-12 — Hunger is visible where kids land (any pet, not just the active one)

**What shipped:** hunger used to show only on the mascota screen and only for the
active pet, so a hungry pet a kid wasn't looking at was invisible. Now:

- New core `anyPetHungry(collection, today)` — true when *any* owned pet is
  hungry (an unfed egg still never counts).
- **Home screen:** the "La mascota" tile grows a wiggling 🥺 badge
  (`chest-tease`, reduced-motion-safe) whenever any owned pet is hungry —
  pulling the kid toward feeding even when the hungry pet isn't the active one.
  The pet face itself is *not* greyed (it shows the active pet, which may be
  fine); the badge alone carries the signal.
- **Mis mascotas grid:** each hungry pet's tile shows a 🥺 badge and a grey
  tint, so the kid can see *which* pet needs feeding and tap it.

Hunger stays gentle and non-punitive (still just the 2-day droop; nothing is
ever lost). One new core test (166 total).

## 2026-07-12 — Pick which growth form a pet shows (go back to a favourite)

**What shipped:** kids can now display any form a pet has already reached — e.g.
keep the 🐣 cracked-egg chick on screen forever instead of the grown 🐔. Growth
is untouched (still meal-driven); a separate per-pet `form` just pins which look
to show, capped at the newest form reached (undefined = follow the newest, so
default behaviour is unchanged).

- Domain split: `petMaxForm(species, meals)` (newest reached index) and
  `petFormEmoji(species, form)` (bounds-clamped); `petEmoji` now = the newest
  form. `PetState.form?: number` travels in the transfer code (per-device
  display choice — the receiving device wins, like `worn`).
- `setPetForm` in economy; a **form-picker row** of sticker buttons under the
  pet on the mascota screen (one per unlocked form, selected highlighted lime,
  only shown once >1 form exists). The "Mis mascotas" thumbnail and the home
  mascot face both respect the pinned form.
- Feeding now celebrates on a real new-form unlock (`petMaxForm` increase). Two
  new core tests (165 total).

## 2026-07-12 — New pet: La mariposa (full metamorphosis)

**What shipped:** a 🦋 butterfly mascot (140⭐) that grows through its full
metamorphosis — 🥚 egg → 🐛 caterpillar → 🫛 chrysalis → 🦋 butterfly — a
four-stage line (🫛 pea pod stands in for the chrysalis, since Unicode has no
cocoon emoji), using the existing grow-as-your-own-kind stage scaling. The
menagerie is now 9 pets. Core assertions added to the pet-species growth test.

## 2026-07-12 — Wardrobe is kid-owned + 4 new pets and 6 new accessories

**What shipped:**

- **Own once, wear per pet.** Accessory *ownership* moved off the individual
  pet onto the kid — buy a crown a single time and dress *any* mascot with it,
  each pet keeping its own outfit. Fixes the confusion where switching pets made
  bought accessories look unowned. New kid-level store
  `palabras.owned-accessories.v1` (mirrors owned-avatars), with a one-time lazy
  migration that seeds it from the union of any legacy per-pet `accessories`.
  `worn` stays per-pet on `PetState`. The transfer code carries
  `ownedAccessories` (unioned like avatars). Domain `wardrobe.ts` split into
  ownership (`buyAccessory`/`ownsAccessory` over an owned list) and wearing
  (`wear`/`toggleWorn`/`wornAccessories` over a pet).
- **4 new mascots:** 🐕 El perro (90⭐), 🐢 La tortuga (100⭐, hatches),
  🐧 El pingüino (110⭐, hatches), 🦄 El unicornio (160⭐, hatches) — each with
  believable stages under the "grow as your own kind" rule.
- **6 new accessories:** 🌸 flor (18), 🍭 piruli (20), 🧢 gorra (22),
  🧣 bufanda (24), 👓 gafas-ver (26), 🦋 mariposa (40), each with its own
  placement spot on the pet. The armario is now 12 items, the menagerie 8 pets.

**Note on lost purchases:** accessories bought *before* the earlier `feedPet`
fix were erased from local storage by that bug and cannot be recovered — only
meal counts persisted. Kid-level ownership prevents the re-buy confusion going
forward. New wardrobe + transfer tests (163 core tests).

## 2026-07-12 — Pets grow as their own kind (no more shared egg→chick)

**What shipped (bug):** every species used `["🥚","🐣", <animal>, <grown>]`, so
the bunny, cat and dragon all hatched from an egg **and passed through the
chicken's 🐣 chick** before becoming themselves. Now each animal grows as its
own kind:

- pollito 🥚 → 🐣 → 🐥 → 🐔 (unchanged — the chick keeps its full life)
- conejo 🐰 → 🐇 · gato 🐱 → 🐈 (mammals are *born* a baby, no egg)
- dragon 🥚 → 🐲 → 🐉 (still hatches)

`PetSpecies.stages` is now variable-length (was a fixed 4-tuple). `petEmoji`
scales the meal-based growth level (0–3) onto each species' own stage list, so a
two-form animal reaches its grown look partway and a four-form one hits every
beat. The mascota screen celebrates a growth **only when the look actually
changes** (compares the rendered emoji, not the meal stage), the adopt-grid
preview uses the last stage instead of `stages[3]`, and the stage-0 caption
reads "Feed your baby to grow!" for the mammals (kept "…hatch the egg" only when
the youngest form is really an egg). Existing saved pets are unaffected — only
meals are stored, and the emoji is derived. New `pet species` growth test
(162 core tests).

## 2026-07-12 — Wardrobe: put-on/take-off, placement fix, feed no longer undresses

**What shipped:** three fixes to El armario, all from kid playtesting.

- **Feeding no longer strips the wardrobe (bug).** `feedPet` rebuilt the pet as
  a fresh `{ meals, lastFed }` and silently dropped `accessories`, so *every*
  meal wiped the outfit — most visible on a growth stage, when the sprite
  changes. `feedPet` now spreads the previous pet first.
- **Put on / take off (feature).** Owning is permanent, but wearing is now a
  free toggle. `PetState.worn` holds the on-the-pet subset; `wornAccessories`
  falls back to "all owned" when `worn` is absent (back-compat for pets saved
  before this), and `toggleAccessory` flips one item. Buying auto-wears. In the
  armario, an owned tile taps to put on (dimmed, ＋) or take off (lime, ✓).
- **Accessories land in the right spot (bug).** `ACCESSORY_SPOTS` centred the
  crown off to the side and positioned by the item's top-left corner. Spots are
  retuned (headwear rides high and centred, held items to a side) and the sprite
  now centres each accessory on both axes (`-translate-y-1/2`).

**Where:** core `domain/wardrobe.ts` (`wornAccessories`, `toggleAccessory`,
auto-wear `buyAccessory`), `domain/mascota.ts` (`PetState.worn`, `feedPet`
spread), `domain/transfer.ts` (validate + merge `worn`; `worn` is a per-device
outfit so the receiving device keeps its own); web `toggleAccessoryForActive`
in `economy.ts`, armario + sprite in `MascotaView`. 6 new wardrobe tests plus
feed/transfer regressions (161 core tests).

## 2026-07-12 — El misterio: the star-unlocked bonus deck

**What shipped:** the deferred mystery deck, done properly. **El misterio 🔮**
is a 12-word magical grab-bag (el fantasma 👻, el vampiro 🧛, el genio 🧞, la
calavera 💀, el murciélago 🦇…) that's a real deck — every game works on it —
but **secret**: a kid unlocks it once for **100⭐** from a locked 🔮 tile on the
home screen, then plays it forever.

The entanglement I'd flagged is solved with a `Deck.secret` flag (+`unlockCost`):
secret decks are excluded from the home shelves (the deck-group partition test
now covers only non-secret decks, with a new test that secret decks stay
unshelved and priced), and hidden from the daily card, the review pool, the
counting item pool, the parent report, and the album **until that kid unlocks
it** — so nothing spoils the mystery. Once unlocked it becomes a normal deck
section in that kid's album. Unlock state is per-kid on-device
(`palabras.unlocks.v1`) and rides the transfer code (`unlockedDecks`,
union-merged) so a device move keeps the purchase.

**Where:** core `domain/deck.ts` (`secret`/`unlockCost`), the El misterio deck
in `starter-pack.ts`, partition tests; web `economy.ts` (unlock storage),
locked/unlocked tile in `HomeView.tsx`, secret-filtering in `AlbumView`,
`InformeView`, the counting route, the home daily/review pools, and the
transfer schema. 153 core tests.

## 2026-07-12 — Star economy expansion: renewable sinks, avatar shop, richer chest

**What shipped:** stars gained real depth so they never pile up worthless
(the old economy dead-ended once the pet was grown and the wardrobe bought):

- **Avatars are now bought with stars** (the sticker/streak gating is gone),
  and there are **29** of them (was 16): 6 free starters plus paid faces
  15–60⭐. The 🎨 chooser is a shop showing the balance and price badges;
  buying wears it immediately. (`domain/avatars.ts`; owned per kid.)
- **Pet collection** — adopt more creatures (🐰 40⭐, 🐱 70⭐, 🐉 120⭐), each
  a fresh egg to grow independently, switch which is on screen. Every new
  pet revives the feeding sink — the core renewable mechanic.
  (`PET_SPECIES`, `PetCollection`.)
- **Caja sorpresa** — a 15⭐ surprise box giving a random unowned accessory,
  with a star consolation once all are owned. An endless sink.
  (`domain/surprise.ts`.)
- **Themes** — 6 paper-colour skins bought with stars (20–30⭐), applied
  app-wide via `ThemeApplier`. Ink stays dark so stickers keep contrast; a
  true dark mode is deliberately deferred.
- **Richer chest** — the ¡Muy bien! chest now stacks bonuses on the base
  (1⭐/first-try): ✨ **¡Perfecto!** +5 (no mistakes), 🔥 **Racha** doubles
  the base on a 7-day streak, 🆕 first-completion +3, each shown as a chip.
  (`computeReward` in `domain/stars.ts`.)

All new state is per-kid on-device (no backend, ADR 002) and rides the
transfer code (owned avatars + pet collections added with union/max-merge).

**Deferred:** the *mystery deck* (star-gated content) — it entangles with
the deck-group partition invariant, so it's cleaner as its own content
slice. Theme selection is device-local (owned themes could transfer later).

**Where:** core `avatars.ts`, `surprise.ts`, `stars.ts` (`computeReward`),
`mascota.ts` (species/collection), transfer fields; web `economy.ts`
(collection + avatars), `theme.ts` + `ThemeApplier`, reworked `MascotaView`
and `KidPicker`, bonus chips in `DoneScreen`. 20 new core tests (151 total).

## 2026-07-12 — Four new games: wardrobe, ¿Cuántos hay?, Deletrea, El reto

**What shipped:** four features aimed at depth and fixing the star
economy's endgame (once the pet is grown at 15 meals, feeding stops
being a sink):

- **El armario 🛍️ (pet wardrobe)** — a shop on the mascota screen: six
  accessories bought with stars (🎩 20⭐ · 🎈 25 · 🕶️ 30 · 🎀 35 · 👑 50 ·
  🪄 60), rendered layered onto the pet at fixed positions. This is now
  the economy's permanent star sink. `domain/wardrobe.ts` (catalog +
  `buyAccessory`); accessories live on `PetState.accessories`, union-merged
  in the transfer code.
- **¿Cuántos hay? 🧮 (counting)** — only on the Los números 1–10 deck menu
  (needs showable quantities): n copies of a picture drawn from the whole
  pack, answer with keycap numbers (👂 2 choices) or written words (🔤 4).
  Finally makes the number decks *playable*. `domain/counting.ts`.
- **Deletrea ✏️ (spelling)** — **reader-only** (hidden from the pre-reader's
  menu): spell the pictured word from shuffled letter tiles; articles
  stripped, only 3–8-letter single words (`spellingWord` filters the rest).
  The app's first orthography skill. `domain/spelling.ts`.
- **El reto ⏱️ (60-second lightning round)** — per deck, at the kid's own
  difficulty: answer as many as possible before the clock; a best score is
  kept per deck+kid, confetti on a new record. `createQuizRound` in core.

**Sticker-less by design:** counting/spelling/reto award **stars only, no
album slots** — the album keeps its per-deck 7-slot symmetry (a
content-test invariant), and spelling/reto aren't playable equally by both
kids. Counting *is* in the daily-mission pool; spelling/reto are not
(reader-only / timed). All four pay the treasure chest. 11 new core tests
(141 total).

**Where:** core `wardrobe.ts`, `counting.ts`, `spelling.ts`, `createQuizRound`,
mission-kind additions; web `CountingPlayer`/`SpellingPlayer`/`RetoPlayer`,
armario in `MascotaView`, conditional rows in `GameMenu`, reto best-scores
in `economy.ts`.

## 2026-07-11 — Content drop: El mar, La fruta, La música + me gusta sentences

**What shipped:** three decks on existing shelves (no new home tiles):
**El mar 🦀** (la gamba — Spain, not camarón; la foca, el delfín, el pez
payaso) on Los animales; **La fruta 🍉** (el melocotón — not durazno; la
sandía, el aguacate) on Mi casa y yo; **La música 🎵** (el piano, los
auriculares — not audífonos; la música carries a "¿Es música?" mass-noun
override) on Jugar y aprender. **23 decks / 268 words**, albums 255/kid.
Las frases grew to **72 sentences**, introducing *me gusta* ("me gusta la
música", first 2-tile clitic phrase), *sonar* ("la trompeta suena
fuerte"), and taste adjectives (*ácido, dulce*), plus "el cangrejo camina
de lado". Tests re-pinned (category list, 60–84 pool, question-override
map).

## 2026-07-11 — The star economy: chest, misión, gold stickers, mascota, informe (+ La ciudad)

**What shipped:** ⭐ became the app's real currency, with a visible earn
moment and a reason to spend:

- **The treasure chest** — every ¡Muy bien! now ends with a closed,
  wiggling 🎁 ("¡Toca el cofre!"); tapping it bursts stars outward and
  credits **one ⭐ per first-try answer** (min 1) to the kid's balance.
  Every game counts first-tries; passive card-flipping pays a flat 2. The
  duel's results chest pays each kid their own score.
- **La misión del día 🎯** — three activity kinds per day (deterministic
  per date+kid), shown as a home card with slots that check off as
  activities complete; finishing all three reveals a bonus chest worth
  **+10 ⭐** (`domain/mission.ts`). Claiming the chest fires a full-screen
  trophy celebration (`MissionBurst` — confetti + fanfare, tap/auto-dismiss).
- **Gold stickers 🥇** — album slots now tier up with replays: 1× earned,
  3× silver, 5× gold (completion counts in a new store; pre-tier stickers
  count as one). Tier-ups get their own done-screen chip and album badges.
- **La mascota 🐣** — each kid's creature (home tile shows it plus the ⭐
  balance): feeding costs **5 ⭐** (`MEAL_COST`), 🥚 hatches at 3 meals →
  🐥 at 8 → 🐓 at 15, gets gently hungry after 2 unfed days, never worse.
  This is the star *sink* that makes earning matter.
- **Informe para padres 📊** — `/informe` (linked from the album footer):
  per kid, the ⭐/📔/☀️ totals plus the strong words and the 5 words worth
  practicing together, straight from the word-stats.
- **Content:** deck 20, **La ciudad 🏙️** (semáforo, puente, torre… on the
  El mundo shelf) and 12 sentences (→60) with *mi casa es bonita*,
  *la tienda está abierta / el banco está cerrado*. Albums now 222/kid.

All economy state is on-device (no backend; ADR 002) and rides the
transfer code with idempotent max-merges. *Watch item: home is 7 tiles +
mission now — one small swipe on tablet; consider compacting if it grows.*

**Where:** core `stars.ts`, `mission.ts`, `sticker-tiers.ts`, `mascota.ts`,
tier-aware `award-sticker.ts` (13 new tests, 130 total); web `economy.ts`,
`StarChest.tsx`, `MascotaView.tsx`, `InformeView.tsx`, mission card in
`HomeView.tsx`, first-try counting in every player.

## 2026-07-11 — The interactivity batch: game feel, busca y toca, unlocks, duel, smart review

**What shipped:** five features that make the game *feel* alive and start
responding to each kid:

- **Contextual game feel** — synthesized Web Audio (no assets, offline):
  distinct sounds for correct (pitch climbs with the combo), wrong (soft,
  never punishing), pair-match, fanfare, and new-sticker chime; Android
  haptics; confetti rain on every ¡Muy bien!; and a Duolingo-style ⚡
  **¡Racha de N!** burst at 3/5/10 correct in a row (`domain/combo.ts`,
  `lib/feedback.ts`, `use-combo.ts`, wired into every game).
- **👀 Busca y toca** — an I-spy scene: 12 pictures scattered on a board
  (grid-jitter layout, never overlapping), "¿Dónde está el gato?" (spoken
  👂 / written 🔤; "¿Quién está triste?" for feelings). Activities
  scene-listen/read; albums now 211 per kid.
- **Avatar unlocks** — 🐲 (10 stickers), 👾 (25), 🦸 (5-day streak), 🧚 (50)
  start locked in the chooser with 🔒 badges; collecting has a purpose.
- **⚔️ El duelo** — pass-the-tablet versus: same 6 words, each kid at their
  own difficulty (2-choice audio vs 4-choice written), ⭐ per first-try
  answer, handoff screen, winner/¡Empate! results. No stickers — bragging
  rights only.
- **🔁 El repaso (smart review)** — every quiz/sí-o-no/scene answer tallies
  per-word rights/wrongs on-device (`WordStatsStore`, **no database** —
  ADR 002 intact; stats ride the transfer code with idempotent max-merge).
  Quizzes weight their deals toward missed words, and once ≥3 words
  struggle, home shows an "El repaso" chip → a sticker-less session over
  exactly those words.

**Where:** core `combo.ts`, `scene.ts`, `avatar-unlock.ts`, `duel.ts`,
`word-stats.ts` (+ weighted `createQuiz`, transfer stats) — 24 new tests
(117 total); web `feedback.ts`, `RachaBurst`/`Confetti`, `ScenePlayer`,
`DuelPlayer`, `RepasoView`, unlock UI in `KidPicker`, recording wired in
three players.

## 2026-07-11 — Avatar picker + one-time device transfer

**What shipped:**

- **Pick your own avatar** — each kid tile on ¿Quién juega? has a 🎨 badge
  opening a 16-emoji chooser (*Elige tu cara*); the choice shows everywhere
  the avatar does (home chip, game menu, album title "El álbum de 🐼").
  Kids stay semantic in core (`listener`/`reader`); avatars are pure
  presentation in `lib/kid.ts` (`palabras.avatars.v1`). The fixed
  Dino/Úni names are gone — avatar + 👂/🔤 glyph is the identity.
- **One-time progress transfer** — a parent-facing panel at the bottom of
  `/album` ("¿Cambiáis de dispositivo?") generates a copy-able code
  (`PALABRAS1.` + base64url JSON of stickers, streaks, avatars) and imports
  one from another device. Import **merges**, never overwrites: sticker
  union, later-day streak wins, incoming avatars win. Codes are versioned
  and self-describing (they survive app updates), malformed entries are
  dropped, bad codes get a friendly typed error. No backend — ADR 002
  stands; a code is a snapshot, not a sync.

**Where:** `packages/core/src/domain/transfer.ts` (encode/decode/merge,
hand-rolled UTF-8-safe base64url, 9 tests); web `lib/transfer.ts`
orchestration over the existing stores, `TransferPanel.tsx`, avatar
chooser in `KidPicker.tsx`, avatar storage in `lib/kid.ts`. Verified with
a two-browser-context drive: avatar change persists, code exports, a
fresh "device" rejects garbage, merges the real code (+1 sticker, avatar
arrives), and re-import is a no-op.

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
