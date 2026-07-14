# Shipped features

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
