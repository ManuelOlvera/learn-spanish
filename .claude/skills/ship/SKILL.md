---
name: ship
description: Use to push a verified change to `main` — the deploy step at the tail of the feature and bug workflows. Pushing `main` auto-deploys `apps/web` to prod, so this skill walks the prod-safety checklist: confirm the verify gate passed, enforce migration-before-push ordering (expand/contract), clean up test data, verify the git identity, then commit and push. Do NOT use to push a change that has not cleared `/verify`.
---

# Ship a verified change to `main`

Goal: get a change onto `main` **safely**, given that pushing `main`
auto-deploys `apps/web` straight to prod against the one shared prod database.
This skill is the codification of the workflows' final "ship" step — run it
instead of pushing by hand. The failure mode it prevents is a deploy that
depends on schema not yet live, or a push on the wrong identity / a failed gate.

Authoritative procedure lives in [`docs/runbooks.md`](../../../docs/runbooks.md)
(migrations, rollback). This skill is the checklist; the runbook is the detail.

## The gate — do not skip

1. **Confirm `/verify` cleared.** Only ship on a `PASS` or a `SKIP` (no runtime
   surface). On `FAIL` or `BLOCKED`, **stop** — do not push; report and keep
   working. A verify pass is standing authorization to push without asking
   (`docs/workflows/adding-a-feature.md` step 11); a non-pass revokes it.

2. **Migration-before-push ordering.** Check whether the push includes
   `supabase/migrations/**`:
   ```
   git diff --name-only @{push}.. -- supabase/migrations/ 2>/dev/null || git diff --name-only origin/main -- supabase/migrations/
   ```
   If it lists any file, the migration **must already be applied to the prod DB**
   before you push — new code may never depend on schema that isn't live yet
   (ADR-005, `docs/adr/005-forward-only-migrations.md`). Follow the
   expand/contract sequence in the runbook, apply the SQL to prod by hand, verify
   with a quick read query, **then** push. Migrations are forward-only — never
   revert; fix forward. If it lists nothing, this step is a no-op.

3. **Clean up throwaway test data.** If `/verify` created test accounts or rows
   in the shared prod DB, delete them now — the prod DB is shared.

4. **Verify the git identity.** `git config user.email` must be
   `olverask@protonmail.com` before committing or pushing.

5. **Docs hygiene.** Confirm behavior/interface/config changes carried their docs
   in the same change (README, `docs/features/*`, inline comments, `docs/README.md`
   index for any new doc). Don't ship docs trailing the code.

## Then push

Commit and push to `main` as `Manuel Olvera <olverask@protonmail.com>` — no
feature branch, no PR (trunk-based solo flow). Once the gate above is clear,
push **without asking for confirmation**.

If the deploy turns out bad, recovery is [Rolling back a bad
deploy](../../../docs/runbooks.md#rolling-back-a-bad-deploy) — remember a Vercel
rollback turns auto-deploy **off** until you Undo Rollback, and it does **not**
roll back the schema.
