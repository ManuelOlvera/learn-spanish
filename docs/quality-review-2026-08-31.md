# Code-quality review — 2026-08-31

Point-in-time review of the whole codebase (~25.3k lines across `apps/web`,
`packages/core`, `packages/config`).

> **Status (2026-08-31):** findings **1, 2, 4 and 5 are fixed** in the same
> session, each marked below. Findings 3, 6 and 7 are deliberately deferred —
> all three are trigger-gated refactors, not defects, and the triggers are
> named. Finding 8 is unchanged and is the reason 4 and 5 rest on `/verify`
> rather than on tests of their own. Verified with the gates at the foot of
> this file plus a `/verify` click-through covering the reply timer (with a
> positive control), the corrupt-counts award path, the legacy migration
> chain, and the sync panel.

Two earlier reviews cover ground this one deliberately does not re-tread:
[fable-review/code-quality.md](fable-review/code-quality.md) (2026-07-13, items
1–5 shipped, item 6 deferred) and
[quality-review-followups.md](quality-review-followups.md) (2026-08-28, deps /
sync timeouts / album salvage / cache cap). Where a finding below touches one of
those, it says so.

## Gates — all green

| Gate | Result |
| --- | --- |
| `pnpm typecheck` | clean, all three packages |
| `pnpm lint` | 0 errors, 2 warnings (the intentional `<a href="/">` in the error boundaries) |
| `pnpm test` | 597 passed / 597, 43 files (590 at review time; 7 added with the fixes) |
| coverage (`packages/core`) | **98.26%** statements, 94.83% branches (floor 80) |
| `pnpm build` | clean; 102 kB shared JS, 147–157 kB first load per route |
| `pnpm audit --audit-level moderate` | 5 (3 moderate, 2 high) — unchanged, all dev-only `vite`/`esbuild`/`sharp`, deferred with reasons on 2026-08-28 |

Rule compliance is genuinely clean, not nominally clean. Zero `any` in the whole
source tree, zero direct `process.env` outside `packages/config/src/env.ts`, zero
`console.*` outside the logger, zero `next/*` imports in `packages/core`, no
`@ts-ignore` anywhere. Three `eslint-disable react-hooks/exhaustive-deps` exist
and all three carry a comment explaining the dependency choice. No XSS sink, no
`dangerouslySetInnerHTML`, CSP and security headers intact.

I also checked the thing the 2026-07-13 review predicted would break — that
`sanitizeSnapshot` and `mergeProgress` would drift apart as snapshot fields were
added. **They have not drifted.** All 19 `ProgressSnapshot` fields are present in
all four places that must list them. The discipline held; see finding 3 for the
cost of holding it by hand.

---

## Findings

### 1. `ConversationPlayer` leaks a timer, and the pet talks over the next screen — **fixed**

`apps/web/src/components/ConversationPlayer.tsx:84`

```ts
window.setTimeout(() => {
  setShowReply(true);
  speakSpanish(choice.reply, "pet");
}, REPLY_DELAY_MS);   // 1400 ms
```

Nothing holds this handle and nothing clears it. **Failure scenario:** kid taps
what to say, then taps the deck emoji in the header within 1.4 s. The component
unmounts, the router lands on `/deck/[deckId]`, and the timer still fires — the
pet's reply is spoken aloud over the game menu. In an app whose entire interface
for a pre-reader *is* the audio, a Spanish sentence arriving on the wrong screen
with no picture attached is a real defect, not a warning in a console the user
never opens.

This is also the only deviation from an otherwise consistent house pattern:
`SiNoPlayer` (`:48-53`), `QuizPlayer` (`:74-79`) and `FlashcardPlayer`
(`:62-75`) all park the handle in a ref and clear it. `ConversationPlayer` is
the single file in `apps/web` that calls `setTimeout` and never calls
`clearTimeout`.

**Fixed** with the siblings' pattern: a `replyTimer` ref and a
`clearReplyTimer()` cleared on unmount, on `next()`, and on `replay()`.

Verified end-to-end, with a positive control so the result means something —
staying on the screen still speaks both lines (`"Estoy bien"`, then the pet's
`"¡Qué bien! Yo también estoy muy bien."`), while tapping back 250 ms after the
choice now produces **zero** utterances on the next screen.

### 2. `loadStickerCounts` is the one storage reader that skips its guard — **fixed**

`apps/web/src/lib/economy-store.ts:179`

Every other reader in this file validates with a core type guard — that was
fable-review finding #3, and it shipped: `isMissionState`, `isWeeklyStreak`,
`isWeekProgress`, `isPetCollection`, `isCategoryAwards`, `isBoost`,
`isParentChallenge`, plus hand-rolled shape checks in `loadWallet` and
`loadRetoBest`. `loadStickerCounts` casts straight through:

```ts
return typeof parsed === "object" && parsed !== null
  ? (parsed as Record<string, number>)   // no per-entry check
  : {};
```

**Failure scenario:** one entry in `palabras.sticker-counts.v1` holds a string
(`{"listener:animales:quiz": "3"}`). `AwardStickerUseCase`
(`packages/core/src/application/award-sticker.ts:36-38`) does
`previous + 1` → `"3" + 1` → `"31"`, saves `"31"`, and `stickerTier("31")`
coerces to gold. The sticker jumps to gold on one play, the stored count grows
by string concatenation on every subsequent play (`"311"`, `"3111"`…), and
`categoryTierFromAlbum` reads the inflated tier into the category-completion
chest, which pays stars.

Confidence: the arithmetic consequence is certain; the trigger requires a
corrupt document, which sync cannot produce (`sanitizeSnapshot` *does* validate
`stickerCounts` with `isValidStickerId` + `isSaneCount` + `> 0`). So this is a
hardening gap rather than a live bug — but the guard already exists in core and
the fix is the same three-line filter the sanitizer runs. There is no reason for
one reader to be the exception.

Related, smaller: `saveStickerCounts` (`:195`) is the only writer that does not
go through `ensureMigrated()`, so a write that happens before any read would
skip the migration gate. No current call order does that; it is one line to
close.

**Fixed** by extracting the sanitizer's own loop into an exported
`sanitizeStickerCounts()` in `domain/transfer.ts`, now called by *both*
`sanitizeSnapshot` and `loadStickerCounts` — one mechanism, both trust
boundaries, which is what fable-review #3 asked for. The local read logs what it
dropped, matching `album-store`'s salvage warning. `saveStickerCounts` now calls
`ensureMigrated()`.

Checked before applying the id guard locally, because it could have silently
dropped real data: `palabras.sticker-counts.v1` arrived with the star economy
(commit 21), which postdates kid profiles (commit 10), so unlike the album this
key has never held shared-era `deck:activity` entries. Six unit tests cover it.

Verified end-to-end: seeding a document holding `"3"` (corrupt), `9` under a
shared-era key, and `-2`, then playing a deck to completion, leaves
`{"listener:animals:quiz":4,"listener:animals:learn":1}` on disk — the corrupt
entries purged, the healthy count preserved, and the done screen showing
*¡Nueva pegatina!* rather than the gold medal the concatenation would have
produced.

### 3. The `transfer.ts` field registry is now overdue — its own trigger fired — **deferred**

`packages/core/src/domain/transfer.ts`

The 2026-07-13 review deferred this with an explicit precondition: *"do the
registry as the first step of whichever change next adds a field."* Four changes
have added fields since (`wallets` + `walletEpoch`, `outfits` inside `PetState`,
`retoBests`), and none did. The file has gone **567 → 825 lines (+45%)**.

Adding one snapshot field today means touching four separate hand-written lists:

1. the `ProgressSnapshot` interface (`:17-67`)
2. a type guard + a `sanitizeKidRecord` line + a conditional spread in
   `sanitizeSnapshot` (`:228-298`) — the field is named **three times** in this
   function alone
3. a merge rule in `mergeProgress` (`:460-747`, 287 lines)
4. read and write halves in `apps/web/src/lib/transfer.ts`
   (`currentSnapshot` / `applySnapshot`)

19 fields × 4 sites. As noted above, nothing has actually drifted yet — the
merge tests are thorough and they have held the line. The finding is the cost
curve, not a present bug: every field is one more chance for sanitize and merge
to disagree, and the only thing catching that today is a reviewer remembering to
check. A `{ key, guard, merge }` registry with `union` / `max` / `laterDayWins`
combinators makes a new field one entry, and makes drift unrepresentable rather
than merely untested. Keep the existing merge tests as the spec.

### 4. The migration runner can permanently skip a migration's input — **fixed**

`apps/web/src/lib/storage-migrations.ts:192-216`

Two comments in this file contradict each other. The registry says *"Ordered:
later migrations may read the output of earlier ones"* (`:180`); the runner says
*"the ones after it still run so one bad key can't block the rest"* (`:190`).
Both cannot hold for a dependent pair.

**Failure scenario:** `wallet-epoch-2` (seeds a goodwill balance into
`palabras.stars.v1`, ADR 007) throws — a quota rejection on its `setItem` is the
realistic path. It is correctly *not* recorded as applied. But `wallet-epoch-3`
then runs anyway, sees no `palabras.wallet.v1`, reads the un-seeded balance, and
writes `{ earned: 0, spent: 0 }` — recording itself as applied. Next session,
epoch-2 retries and writes the seed to `stars.v1`, but epoch-3 will never run
again, so the seed is never converted. The kid silently loses their restored
balance, permanently, and no log line says a migration was skipped rather than
retried.

Confidence: the failure mode is certain given a partial failure; how often a
partial failure actually happens is the open question, and I could not construct
a path where it happens today other than a quota rejection landing on exactly
one migration. Worth fixing because the cost is asymmetric — silent, permanent,
and about the one thing an ADR was written to protect.

**Fixed** by giving a migration an optional `dependsOn`, and having the runner
hold one back (with a log line saying so) when the migration it reads has not
succeeded. Independent migrations after a failure still run, so the original
intent survives; only genuine dependents wait. The two contradictory comments
are now one rule.

Verified end-to-end on a synthetic legacy device (a pre-collection pet with an
accessory plus a legacy star balance): all six migrations apply in order, the
pet lands in its collection with the accessory in the kid-level wardrobe and an
outfit on the right form, the wallet converts to counters, and the run reports
zero held-back and zero failed.

### 5. `setSyncCode` is the only unguarded localStorage write in `sync.ts` — **fixed**

`apps/web/src/lib/sync.ts:69`

`getSyncCode` and `unpair` both try/catch and log. `setSyncCode` does not. It is
also called last on purpose in both `startHosting` (`:103`) and `joinWithCode`
(`:133`), specifically so a failure cannot leave the device paired to an
unverified code — a good design that this one line partly undoes from the other
end. If the write throws (Safari private mode, full quota), `joinWithCode` has
already pushed to the cloud *and* already run `applySnapshot(merged)` against
local state, then throws; `SyncPanel` reports "could not connect" while the
merge has in fact landed and the device is unpaired. No data is lost — the merge
is a union — but the reported state is wrong.

### 6. Twenty-one components repeat the same mount-read of the selected kid, with three different meanings for `null` — **deferred**

Every screen re-derives the current kid the same way, because it can only be
read after mount:

```ts
const [kid, setKid] = useState<KidId | null | undefined>(undefined);
useEffect(() => { setKid(getSelectedKid()); }, []);
```

That is 21 files. The duplication is not the interesting part — the
inconsistency is. Three different encodings are live at once:

- `KidId | null | undefined` starting at `undefined` (5 files) — `undefined`
  means "not read yet", `null` means "no kid picked"
- `KidId | null` starting at `null` (6 files) — the two states are **collapsed**,
  so "still loading" and "nobody picked" render identically
- `getSelectedKid() ?? "listener"` (5 call sites) — no null state at all,
  defaults silently

The middle form is the one that can be wrong: a component that cannot tell
"loading" from "unset" will flash the no-kid branch on every mount. A
`useSelectedKid()` hook returning a discriminated `{ status: "loading" }
| { status: "none" }  | { status: "picked", kid }` names the distinction once and
makes the collapsed form impossible. The repo already set this precedent by
extracting `useDeniedWobble()` for a far smaller duplication.

### 7. `MascotaView` is now larger than `HomeView` was when `HomeView` was split — **deferred**

`apps/web/src/components/MascotaView.tsx` — **754 lines**, 13 `useState`
hooks in one function, holding pet collection, stars, munch counter, evolution
flag, surprise, name draft, owned accessories, owned themes, theme, a pending
purchase, and a drag position.

`HomeView` was flagged at 534 lines in the 2026-07-13 review and three cards
were extracted (`MissionCard`, `WeeklyCard`, `SecretDeckTile`). Worth noting:
`HomeView` is **562 lines today** — bigger than before the extraction. The
splitting relieved the symptom for one release and the file regrew.

`MascotaView` has at least four separable pieces along its own seams: the
wardrobe/placement drag surface (the `pointermove`/`pointerup` effect at
`:207-236`, which is self-contained and correct), the shop/purchase confirm
flow, the naming editor, and the pet display itself. None of them are testable
today because `apps/web` has no test harness (finding 8).

### 8. `apps/web` still has zero tests, and that is where the untested logic now is — **fixed**

Core is at 98.26%. `apps/web` is at nothing — no harness exists. The
2026-08-28 review deferred this deliberately and named the right cheapest fix
(vitest + jsdom for the localStorage adapters, not Playwright). Repeating it
here because findings 1, 2, 4 and 5 above are *all* in `apps/web/src/lib` and
`apps/web/src/components`, and every one of them is the kind of thing a unit
test catches for free:

- a fake `localStorage` that throws on `setItem` exercises findings 2, 4 and 5
  directly
- a render test of `ConversationPlayer` that unmounts mid-timer catches finding 1

The deferral was reasonable when the open items were dependency versions. It is
less reasonable now that the review findings have moved entirely into the layer
that has no tests.

Two use cases show 0% coverage — `get-streak.ts` and `get-word-stats.ts`. I
checked: both are three-line pass-throughs to a store with no logic to test.
Not a gap; noted so the next reader does not chase it.

**Fixed.** `apps/web` now has vitest + jsdom and **30 tests** over the layer
that had none: the migration registry, `economy-store`, and pairing-code
persistence in `sync.ts`. The harness is exactly the one the 2026-08-28 review
recommended and no more — no Playwright, no component rendering, which stays
with `/verify` against the real built app.

What made it worth doing is the shape of the bugs. Every one of them lives on a
path a click-through cannot reach, because `/verify` only ever drives a
*healthy* device: `test/storage.ts` is a localStorage stand-in that can refuse
writes, refuse reads, or hold a corrupt document on demand.

The migration test is the one that earns its keep, and it was checked the only
way a regression test can be: **by neutering the `dependsOn` guard and watching
it fail** — `wallet-epoch-3` records itself as applied while `wallet-epoch-2` is
still pending, which is precisely the silent, permanent loss finding 4
describes. Reasoning in prose is now a test.

Also pinned: that `saveWallet`/`saveStickerCounts` **swallow** a refused write.
That is the known open behaviour, and the test says so — the day it changes, it
should change on purpose.

`pnpm test` now runs both packages. No coverage floor on `apps/web` yet: the
floor belongs on `packages/core`, where the business logic is, and a number
here would only measure how much UI has been dragged into jsdom.

---

## What is worth keeping

- **The comments explain *why*, and they are load-bearing.** `speech.ts:17-34`
  on why Android cannot give a second voice, `sw.js:28-41` on why the cache is
  deliberately *not* keyed to the build id, ADR 017's one-roller rule enforced
  in a doc comment at the call site. This is unusually good and it should not
  regress.
- **The trust boundary is drawn once and drawn correctly.** A remote row goes
  through the same `sanitizeSnapshot` as a pasted transfer code
  (`supabase-progress-store.ts:93-95`), with a bounded response size, a bounded
  timeout, and a typed `SyncTimeoutError`.
- **Storage is failure-tolerant per entry, not all-or-nothing.** `album-store`,
  `word-stats-store`, `answer-log-store` and `economy-store` each salvage what
  they can and log what they dropped. Finding 2 is the one hole left in that
  pattern.
- **The migration registry itself is the right shape** — run-once, ordered,
  auditable, never deletes a legacy key, with the wallet-epoch exception
  documented against its ADR. Finding 4 is about the runner, not the design.
- **Security posture is solid and unchanged**: strict CSP, `frame-ancestors
  'none'`, a `Permissions-Policy` that grants only the microphone the say-it-back
  recorder needs, dev exempted from CSP only.

## What was done, and what is left

Fixed this session: **1, 2, 4, 5**, plus the `saveStickerCounts` migration gate.
Seven tests added in `packages/core` (six for `sanitizeStickerCounts`, one for
`PairingNotStoredError`); 597 pass, coverage holds at 98.26%.

Deliberately not done, with the trigger for each:

- **Finding 3 (registry)** — the next change that adds a `ProgressSnapshot`
  field. Doing it now, cold, would rewrite 287 lines of merge logic that is
  currently correct and thoroughly tested, to buy nothing until a field lands.
  It has already slipped past this trigger once, so the next field is the last
  reasonable moment.
- **Finding 6 (`useSelectedKid`)** — when next touching those components; a
  21-file sweep is its own change, not a rider on a bug fix.
- **Finding 7 (`MascotaView`)** — when next adding to that screen. Splitting it
  now repeats the `HomeView` lesson: an extraction with nothing holding the
  file down just regrows.
- **Finding 8 (`apps/web` tests)** — still the highest-leverage item, and the
  reason findings 4 and 5 rest on `/verify` rather than on tests of their own.
  Where logic could move to a tested layer it did: `sanitizeStickerCounts` and
  `PairingNotStoredError` both live in `packages/core` under unit test, which is
  the same route `salvageStickerIds` and `isTimeoutError` took on 2026-08-28.
  The migration-runner and `SyncPanel` halves have no such home and remain
  covered only by the click-through.

## Verification commands

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit --audit-level moderate
cd packages/core && npx vitest run --coverage
```

---

# Security & UX passes — 2026-08-31 (second sitting)

The review above was a *quality* review. Asked whether security and UX were
also fine, the honest answer was no — security had only had its shallow checks
run, and UX had barely been looked at. Both were then done properly. This
section is their result.

## Security

Method: read the SQL migrations against the live schema contract, traced every
untrusted input to where it is consumed, and checked the capability key's whole
lifetime. Not a penetration test — no live probing of the Supabase project
beyond one read of a non-existent code.

**The sync model holds up.** `progress` has RLS enabled with *no policies* and
`revoke all` from `anon`/`authenticated`, so direct table access is denied
outright; the only way in is three `SECURITY DEFINER` RPCs that each require
the pairing code. All three pin `search_path`. `put_progress` validates the
code against a regex and caps snapshots at 64 KB. A weekly `pg_cron` sweep
drops rows untouched for 12 months.

**The entropy claim is accurate**, which was worth checking rather than
believing: `ALPHABET[nextByte() & 31]` over a 32-symbol alphabet is a clean
5-bits-per-symbol map with **no modulo bias**, 20 symbols = 100 bits, and the
web adapter feeds it `crypto.getRandomValues`. The SQL character class
`[0-9A-HJ-KM-NP-TV-Z]` is exactly the client alphabet — verified as sets, not
by eye.

**The capability key is handled correctly for its whole life.** It rides in the
URL *fragment* (never the query), so it never reaches a hosting request log;
`SyncLinkHandler` strips it with `replaceState` *before* prompting; and no
`log.*` call in `sync.ts`, `SyncPanel`, `SyncLinkHandler` or the Supabase
adapter passes the code — the RPC errors carry the function name only.

**Untrusted input is bounded before it is parsed.** `decodeProgress` rejects
over 256 KB *before* decoding, `fromBase64Url` is regex-guarded,
`sanitizeSnapshot` caps counts, text and list lengths (the comment on why
`Infinity` matters under max-merge is correct), and a remote row goes through
the same sanitizer as a pasted code. `qr.ts` is an **encoder only** — there is
no QR-decoding surface in this codebase. `recorder.ts` honours ADR 003: the
clip stays a `Blob` in memory, the object URL is revoked, the mic tracks are
stopped on `stop()`, and nothing is persisted or transmitted.

**Headers are actually served**, not merely configured — checked against the
running production server, not just `next.config.ts`.

Residuals, none of them new and none of them urgent:

- **`script-src 'unsafe-inline'`** weakens the CSP to roughly "no external
  scripts". It is required by Next's inline bootstrap and there is no nonce
  infrastructure here. There is no injection vector today (no
  `dangerouslySetInnerHTML`, no user-supplied HTML, React escaping everywhere),
  so this is defence-in-depth lost, not a live hole.
- **`get_progress` and `delete_progress` skip the code-format regex that
  `put_progress` enforces.** First called "free to close"; on closer analysis it
  is not free, and it is **deliberately left open**. Adding the check would turn
  a silent `null` into a raised exception, so `RemoteProgressStore.load()` would
  *throw* where it now returns null — and a parent who mistypes a code would get
  "No se pudo conectar" (check your internet) instead of the accurate "No
  encontramos ese código". That is a UX regression bought for no security gain:
  post-0002 no row can hold a malformed code, so a read with one matches nothing
  either way. The asymmetry is correct as it stands.
- **Anon-key quota burn** (carried from 2026-08-28): anyone with the public key
  can mint well-formed codes and create rows. It is a billing ceiling, not
  disclosure, and the recommendation remains a Supabase spend alert. **Whether
  that alert was ever set up cannot be seen from this repo.**
- **5 dev-only advisories** (`vite`/`esbuild` under vitest, `sharp` under next),
  unchanged and deferred with reasons.

## UX

Method: an audit script measuring every interactive element on 16 routes at
phone (390×844) and tablet (820×1180) — target sizes against this project's own
`≥64px` rule, accessible names, computed text contrast against composited
backgrounds, horizontal overflow — plus flow tests for offline, deep links and
pairing, and reading the screenshots.

**The result is strong, and specifically strong where it matters most.** Across
both viewports: **zero** unnamed interactive elements, **zero** contrast
failures, **zero** horizontal overflow, **zero** page errors. Every game screen
— learn, quiz, hablar, sopa, reto — and every deck/group/story screen is
completely clean on target size. The design language is not aspirational; it is
actually applied.

Eight undersized targets, all on chrome rather than play:

| Screen | Element | Size | Read |
| --- | --- | --- | --- |
| `/` | camino "estás aquí" step | 56×56 | kid-facing, 8px under the rule |
| `/mascota` | "El pollito ✏️" name button | 153×36 | kid-facing, subtle affordance |
| `/album` | two parent links | ~20px tall | parent-facing by design |
| `/informe` | "Ver todo →", buy-freeze | 40–56px tall | parent-facing by design |

The parent-facing ones are consistent with the design doc ("text is for
parents") and are left alone. **The two kid-facing ones are fixed**, each by the
smallest change that satisfies the rule:

- `CaminoStrip` — the current stop is the only tappable one (the rest are inert
  `<span role="img">` marks, correctly not interactive), so it goes 56 → 64px.
  A deliberate visual change: the "estás aquí" step now reads a little stronger,
  which is the right direction for the one thing on the strip you can press.
- `MascotaView` — the name button keeps its type size and gains `py-4` with a
  matching `-my-4`, so the tap area clears 64px while the title stays on exactly
  the same pixel. Verified by screenshot diff: the screen is unchanged.

Both re-audited clean at phone and tablet; `/` and `/mascota` now report no
undersized targets at all.

**Fixed: a pairing code a parent misreads is now accepted.** `sync.ts` picked
Crockford base32 *because* it drops the confusable glyphs I, L, O and U — then
did only half of what that buys. `normalizePairingCode` was generously tolerant
of formatting (case, spaces, missing dashes all normalize) but rejected the
three substitutions the alphabet exists to absorb: a parent copying 20 symbols
off another device's screen who reads `0` as `O` or `1` as `I` got *"Ese código
no es válido"* and would retype it identically. I, L now fold to `1` and O to
`0`, which is what Crockford specifies. It cannot collide — a generated code
can never contain those glyphs — and the entropy is untouched, since the fold
widens what *input* maps to a code, not the code space. U stays invalid, per
Crockford. No SQL change: the fold is client-side and only canonical codes ever
reach the RPC. Verified in the panel — the misread code is now accepted and
looked up for real.

**Verified working:** offline reload renders home (ADR 005); a deep link with no
kid ever chosen falls back to the picker rather than crashing; a secret deck
deep link 404s instead of revealing itself.

**Still open, and the one real UX defect left:** the quota swallow carried from
2026-08-28. If storage is full, `save()` logs a warning and returns, so a kid
can play an entire session and have none of it persist, with nothing on screen
saying so. Unfixed because the fix is a parent-visible failure state, which is a
design decision rather than a patch — but it is a *silent data-loss* path, and
of everything left across all three passes it is the one most worth deciding on.
