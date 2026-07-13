---
name: ship
description: Use to push a verified change to `main` — the deploy step at the tail of the feature and bug workflows. Pushing `main` auto-deploys `apps/web` to prod, so this skill walks the prod-safety checklist: run the gates (there is no CI — this checklist is the only gate), confirm `/verify` passed, enforce migration-before-push ordering, clean up test data, verify the git identity, then commit and push. Do NOT use to push a change that has not cleared `/verify`.
---

# Ship a verified change to `main`

Goal: get a change onto `main` **safely**, given that pushing `main`
auto-deploys `apps/web` straight to prod and **there is no CI** — this
checklist is the only thing between a bad commit and a deployed one. It is the
final step of [`docs/workflows/adding-a-feature.md`](../../../docs/workflows/adding-a-feature.md)
and [`fixing-a-bug.md`](../../../docs/workflows/fixing-a-bug.md); the deploy
and rollback detail lives in [`docs/runbooks.md`](../../../docs/runbooks.md).

## The gate — do not skip

1. **Run the gates explicitly** (nobody else will):
   ```
   pnpm test && pnpm typecheck && pnpm lint && pnpm build
   ```
   Any failure stops the ship.

2. **Confirm `/verify` cleared.** Only ship on a `PASS` or a `SKIP` (no runtime
   surface). On `FAIL` or `BLOCKED`, **stop** — do not push; report and keep
   working. A verify pass is standing authorization to push without asking;
   a non-pass revokes it.

3. **Migration-before-push ordering.** Check whether the push includes
   `supabase/migrations/**`:
   ```
   git diff --name-only @{push}.. -- supabase/migrations/ 2>/dev/null || git diff --name-only origin/main -- supabase/migrations/
   ```
   If it lists any file, that SQL **must already be applied to the live
   Supabase project** before you push — new code may never depend on schema
   that isn't live yet (the app's delete/put RPC calls fail otherwise). Apply
   per the runbook (`supabase db push` or the SQL editor), verify with a quick
   call, **then** push. Fix schema problems forward with a new migration;
   never edit an applied one. If it lists nothing, this step is a no-op.

4. **Clean up throwaway test data.** If `/verify` or a smoke test wrote rows to
   the shared Supabase `progress` table, delete them (the `delete_progress`
   RPC exists for exactly this).

5. **Verify the git identity.** `git config user.email` must be
   `olverask@protonmail.com` before committing or pushing.

6. **Docs hygiene.** Confirm behavior/interface/config changes carried their
   docs in the same change: README (including the deck/word **pack counts** in
   the Features section — the drift that actually happens),
   `docs/features/shipped.md`, roadmap check-offs, inline comments,
   `docs/README.md` index for any new doc.

## Then push

Commit and push to `main` as `Manuel Olvera <olverask@protonmail.com>` — no
feature branch, no PR (trunk-based solo flow). Once the gate above is clear,
push **without asking for confirmation**. After the push: report and stop —
never poll prod or wait for propagation.

If the deploy turns out bad, recovery is the Rollback section of
[`docs/runbooks.md`](../../../docs/runbooks.md) — `npx vercel rollback` aliases
the previous build instantly, and it does **not** roll back Supabase schema.
