# Documentation review — 2026-07-13

> **Status update (2026-07-13):** #1 resolved by building the missing feature
> (the service worker, ADR 005) rather than weakening the docs; #2 resolved
> (workflow docs written and indexed with the skills pass); #3 resolved
> (pairing.md carries the key warning). #4's ADR-004 bit-count and #5's
> overview diagrams remain open; the README-counts test idea stands.

Documentation is a genuine strength: a curated index with lifecycle markers
(`docs/README.md`), four honest ADRs that record *forces* and *costs*, a
runbook with hard-won gotchas, parent-facing feature docs, and inline comments
that explain why. Findings in priority order.

## 1. The "offline PWA" claim is stronger than the implementation

ADR 004 says the app "remains a fully-offline PWA when the envs are absent" and
CLAUDE.md/README call it an installable PWA. There is a manifest
(`apps/web/src/app/manifest.ts`) but **no service worker** — so the app
installs, but a launch without network serves nothing cached. Either fix the
docs (say "installable, network-required first load") or fix the app (see
features review #1, the better option). Docs that overstate offline behavior
will mislead exactly the debugging session that matters (a kid on a road trip).

## 2. Skills reference workflow docs that don't exist

`.claude/skills/shape/SKILL.md` hands off to
`docs/workflows/adding-a-feature.md`, `investigate` to
`docs/workflows/fixing-a-bug.md`, and `ship` cites
`docs/workflows/adding-a-feature.md` step 11 and
`docs/adr/005-forward-only-migrations.md` — none of these files exist, and
`docs/README.md` only flags `architecture-diagrams.md` as known-missing. Either
write the two workflow docs (they're implicitly defined by the CLAUDE.md
"Feature order"/"Bug order" lines — ~15 lines each) or point the skills at
CLAUDE.md. Update the known-missing note in `docs/README.md` to match reality.

## 3. `docs/features/pairing.md` omits the security sentence

It tells parents to jot the code down but never states that the code is the
whole secret — anyone holding it can read and overwrite the family's progress.
Add one line under "Good to know". (Same finding in the security review #5.)

## 4. Smaller accuracy drift

- README says "27 decks / 323 words … (28 decks / 335 words total)" — counts
  like these go stale silently. Consider a test in core that asserts the pack
  totals, with a comment pointing at the README line to update (turns silent
  drift into a red test).
- `docs/README.md` doesn't mention `supabase/` at all; the migration file is
  load-bearing ops surface documented only via runbooks. A line in the index
  ("`supabase/migrations/` — SQL applied by hand per runbook") would make it
  discoverable.
- ADR 004 says codes carry "128-bit" capability in one place; the
  implementation and migration comment say ~100 bits (20 symbols × 5 bits).
  Align on 100.

## 5. Missing overview artifact for newcomers

Every doc is either a decision, a runbook, or a feature write-up; nothing draws
the system. The planned `docs/architecture-diagrams.md` (the `/diagram` skill's
target) is the natural fix — a monorepo graph, the sync sequence
(pull-on-open / push-on-complete / merge), and the localStorage key inventory
would answer 80% of orientation questions. The localStorage schema
(11 `palabras.*` keys and what owns each) is currently documented nowhere.

## What already looks right (keep it)

- Lifecycle markers (living / append-log / archived) on every index entry — a
  simple idea that keeps trust in the docs.
- ADRs record the trigger for revisiting ("Revisit if data value rises") — the
  rare kind of ADR a future session can actually engage with.
- Runbook gotchas are specific and falsifiable ("don't deploy `--prebuilt` from
  `apps/web`", the SSO-protection 302 signature).
- Doc hygiene is enforced culturally (same-commit rule in CLAUDE.md) and it
  shows: shipped features have same-day write-ups and roadmap check-offs.
