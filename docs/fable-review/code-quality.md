# Code-quality review — 2026-07-13

State at review: 217/217 core tests pass, coverage 96.9% (floor 80), typecheck
clean in all three packages, TypeScript strict, no unjustified `any` found.
Quality is high — comments explain *why*, invariants (idempotent merges, trust
boundaries) are named where they're enforced. Findings in priority order.

## 1. `joinWithCode` pairs the device before the join is verified

`apps/web/src/lib/sync.ts:90` — `setSyncCode(code)` runs before the first
pull/push. If the network call throws, `SyncPanel` shows "No se pudo conectar"
and leaves its UI unpaired, but the code is already in localStorage — the next
app open silently syncs against a code that was never confirmed. Worse, a
mistyped-but-format-valid code creates a fresh cloud row and quietly forks the
family's progress. Fix: store the code only after the initial
pull-merge-push round-trip succeeds (same consideration for `startHosting`,
where it's more benign because the code was locally minted).

## 2. `dayKey` is UTC, but the users play in local evenings

`packages/core/src/domain/daily.ts:6` — `toISOString().slice(0, 10)` means the
"day" flips at UTC midnight. In the Americas that's late afternoon/evening:
the carta del día changes mid-evening, a session at 7pm counts toward
*tomorrow's* misión, and a kid who plays 7pm Monday + 9am Tuesday (local) gets
a *gap* in the sun streak. Everything internal is consistent (lexicographic
compares still work), but the behavior is user-visible and wrong for the
audience. Recommend a local-calendar day key
(`` `${y}-${m}-${d}` `` from local getters). Note the migration wrinkle: sync
merges compare day strings across devices, so all devices should adopt the
change together (they share a household timezone, so drift risk is minimal).

## 3. `readDoc` trusts localStorage shapes it doesn't validate

`apps/web/src/lib/economy.ts:49` — the parsed JSON is cast to
`Partial<Record<KidId, T>>` unchecked. Some readers re-guard
(`getStars`, `getPetCollection`), many don't (`getWeeklyStreak`,
`getStoredMission`, `getCategoryAwards` …), so one corrupt document surfaces as
a runtime shape surprise far from the read. The repo already owns exactly the
right tool: the type guards in `packages/core/src/domain/transfer.ts`
(`isWeeklyStreak`, `isMissionState`, …). Export them and make `readDoc` take a
guard argument — one mechanism, both trust boundaries.

## 4. Lint coverage is thinner than the standards imply

- `pnpm -r lint` only lints `apps/web`; `packages/core` and `packages/config`
  have no lint script at all.
- `apps/web/eslint.config.mjs` is `tseslint.recommended` + `no-console` only —
  no `eslint-plugin-react-hooks` (exhaustive-deps would have caught the
  intentional-but-undocumented dep choices in `HomeView`'s effects) and no
  `@next/eslint-plugin-next`.

Given how much invariant-carrying client code lives in `apps/web/src/lib`,
these plugins pay for themselves. Add lint scripts to both packages.

## 5. Component-level nits

- `apps/web/src/components/HomeView.tsx` (534 lines) renders five distinct
  cards (daily, misión, weekly, repaso, shelves/secret decks) each with its own
  state cluster. Extracting `MissionCard` / `WeeklyCard` / `SecretDeckTile`
  would make each testable and the file readable.
- `HomeView.tsx:259` — `KIND_EMOJI` is re-created inside the render loop;
  it's also exactly the kind of constant that belongs next to `MissionKind` in
  core (or at least module scope).
- The "wobble on failed purchase" pattern (`key={`freeze-${nope}`}` +
  `feedbackWrong()` + `setNope`) is duplicated across buy buttons here and in
  `MascotaView` — a small `useDeniedWobble()` hook would name the trick.

## 6. Merge/sanitize duplication in `transfer.ts`

`packages/core/src/domain/transfer.ts` (567 lines) hand-writes the same three
patterns per field: a type guard, a sanitize branch, and a merge rule
(union / max / later-day-wins). Every new snapshot field touches all three and
the file grows linearly. Consider a small field registry —
`{ key, guard, merge }` per field, with generic union/max/later-day combinators
— so adding a field is one entry, and sanitize/merge can't drift apart. Test
coverage on the merge rules is already excellent; keep those tests as the spec
if you refactor.

## What already looks right (keep it)

- Coverage thresholds enforced in `vitest.config.ts` and actually exceeded
  (96.9% vs the 80 floor); tests read as behavior specs (e.g. merge
  idempotence, tier re-pay protection).
- Typed errors (`InvalidTransferCodeError`, `DeckNotFoundError`) and no
  silently-swallowed failures — every catch logs through the leveled logger.
- Failure-tolerant storage access: every localStorage touch is try/caught with
  a logged warning and a sane default.
- Hand-rolled base64url and FNV-1a are justified in comments (framework-
  agnostic, emoji-safe) rather than left as mysteries.
