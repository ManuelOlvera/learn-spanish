# Claude skills review — 2026-07-13

> **Status update (2026-07-13):** all findings implemented — `diagram`, `adr`,
> and `ship` rewritten for this repo (real ADR list, real architecture, no
> phantom shared-prod-DB); `docs/workflows/adding-a-feature.md` and
> `fixing-a-bug.md` written and indexed so every skill hand-off resolves;
> `ship` now runs the gates explicitly (no CI) and checks README pack counts;
> `investigate`'s offline-queue line corrected; `verify` gained the sync-panel
> gating and album-screenshot checks; the `/add-content` skill exists;
> `expo.dev` dropped from settings permissions.

The skill set is well-designed as a system: shape → design-variants → TDD →
verify → ship mirrors the CLAUDE.md workflow, descriptions carry real trigger
conditions, and `verify` encodes sandbox lessons that would otherwise be
re-learned every session. The main problem is copy-paste residue from a
previous project. Findings in priority order.

## 1. Three skills still describe a different repo (a workout tracker)

- `diagram/SKILL.md` names the architecture as `apps/web` →
  **`@workout-tracker/core`** → Supabase, and prescribes conventions from a
  `docs/architecture-diagrams.md` that doesn't exist here yet.
- `adr/SKILL.md` cites "ADR-001 custom-JWT-not-Supabase-auth, ADR-003
  TWA-not-React-Native, ADR-005 forward-only-migrations" — none are this
  repo's ADRs (001 is browser speech synthesis, 003 is ephemeral recordings) —
  and says "the highest today is 006" when the highest is 004.
- `ship/SKILL.md` is built around "the one shared prod database" and ADR-005
  expand/contract migrations. This repo's Supabase is an optional, single-table
  sync store; ADR-005 doesn't exist. The migration-before-push *ordering* rule
  is still right (code must never depend on schema that isn't live), so keep
  the check but rewrite the rationale in this repo's terms and drop the dead
  ADR link.

These aren't cosmetic: a session following `adr` will engage with phantom
decisions, and `diagram` will draw the wrong system. One pass to re-ground all
three in this codebase is the top skills fix.

## 2. Broken hand-offs to `docs/workflows/*`

`shape`, `investigate`, and `ship` all hand off to
`docs/workflows/adding-a-feature.md` / `fixing-a-bug.md`, which don't exist
(docs review #2). A skill that ends "now follow a doc that isn't there" leaves
the session improvising exactly where the process was supposed to take over.
Write the two short workflow docs or re-point the hand-offs at the CLAUDE.md
Feature/Bug order lines.

## 3. `ship` should gate on this repo's actual risks

Beyond the rewrite in #1, two checks are missing that match observed failure
modes here:

- **Run `pnpm test` + `pnpm typecheck` + `pnpm lint` explicitly** before push —
  there is no CI (see features review #2), so the ship checklist is the *only*
  gate between a bad commit and prod.
- **README/doc-drift check** exists (step 5) — good; add "pack counts in
  README" to its examples since that's the drift that actually happens (docs
  review #4).

## 4. Missing skill: adding content (the most recurring task)

Every deck/word/sentence addition touches the same invariant set:
`starter-pack.ts`/`sentence-pack.ts` entries, unique card ids, deck-group
membership, `deck-theme.ts` accent, album completability expectations
(`activitiesForKid`), the starter-pack tests, and the README counts. That's a
perfect skill: `/add-content` with the checklist and the file map. It would be
used more often than `shape` or `adr`.

## 5. Smaller improvements

- `verify/SKILL.md` is the best skill in the set (executable commands, learned
  gotchas). Two additions: verify the **sync panel renders only when env is
  set** (a regression here would silently disable pairing), and screenshot the
  album — its tier medals are the pixels most likely to regress.
- `investigate/SKILL.md` says "most 'UI bugs' … are really untested
  client-state or offline-queue bugs" — there is no offline queue in this app;
  rewrite as "client-state in `apps/web/src/lib` (untested by design — the
  coverage floor only guards core)", which is true and more useful.
- `.claude/settings.json` allows `WebFetch(domain:expo.dev)` — Expo is not used
  anywhere in this repo (more residue). Remove it.

## What already looks right (keep it)

- Skill descriptions state *when not* to use them ("Skip for trivial one-line
  changes", "Do NOT use for shaping features") — the discriminating half most
  skill sets omit.
- `shape`'s "a feature with no deferred items is almost certainly too big" and
  `investigate`'s three-fix cap are real process guardrails, and the roadmap's
  cut-line notes show they're actually followed.
- CLAUDE.md's skill index matches the skills that exist, and the feature/bug
  ordering gives every skill a place in a pipeline rather than a grab bag.
