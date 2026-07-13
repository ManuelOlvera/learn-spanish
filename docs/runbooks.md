# Runbooks

## Deploy to production (Vercel)

Prod URL: https://learn-spanish-manuelolveras-projects.vercel.app
Project: `learn-spanish` (team `manuelolveras-projects`), root directory `apps/web`.
The repo-root `.vercel/` dir links the CLI to the project (gitignored; recreate with
`npx vercel link --yes --project learn-spanish` from the repo root if missing).

**Pushing `main` auto-deploys prod** (Vercel GitHub App granted access + `vercel git
connect`, 2026-07-10). Gate: only push a change that has cleared verify (`/ship`
checklist). Don't poll prod afterwards — the dashboard's deployment record is the
confirmation.

Manual deploy (bypass git, e.g. testing a working-tree state) from the repo root:

```bash
npx vercel deploy --prod --yes    # remote build; ~1 min
```

## Enable cross-device sync (Supabase, ADR 004)

Sync is off until these are set — the app runs pure-local otherwise. One-time setup:

1. Create a Supabase project (free tier is fine).
2. Run the migrations in the SQL editor, **in order**: paste
   `supabase/migrations/0001_progress_sync.sql`, then
   `0002_progress_hardening.sql`. 0001 creates the `progress` table and the
   capability RPCs and locks the table behind RLS so only the RPCs (which
   require the pairing code) can reach a row. 0002 hardens the write path
   (pairing-code format check, 64 KB row cap), adds `delete_progress`, and
   schedules a weekly retention sweep (rows untouched for 12 months are
   deleted; if pg_cron is unavailable the migration says so — run
   `delete from public.progress where updated_at < now() - interval '12 months';`
   by hand occasionally instead).
3. In Vercel → Project → Settings → Environment Variables, set for Production:
   - `NEXT_PUBLIC_SUPABASE_URL` = the project URL (`https://<ref>.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the project's public anon key
   Both are browser-public by design — security is the RLS + capability RPCs, not
   secrecy of the anon key. Redeploy so Next.js inlines them into the client bundle.
4. Verify: open the app → Progreso entre dispositivos → *Sincronizar entre
   dispositivos* should appear. Create a code on one device, enter it on another,
   finish a game on the first, reopen the second → progress is merged in.

To roll sync back out, unset the two env vars and redeploy — the app reverts to
pure-local with no data loss (every device keeps its own `localStorage`).

**Migration ordering rule:** new SQL in `supabase/migrations/` must be applied
to the live Supabase project **before** pushing code that depends on it (e.g.
the app's "Borrar el progreso en la nube" button needs `delete_progress` from
0002). Apply in the SQL editor, verify with a quick call, then push.

## Rollback

```bash
npx vercel ls learn-spanish --prod   # find the last good deployment URL
npx vercel rollback <deployment-url>
```

Rollback is instant (aliases the old build); no rebuild happens.

## Gotchas

- **Don't deploy `--prebuilt` from `apps/web`** — the local pnpm build traces files
  into the repo-root `node_modules/.pnpm` store, which the uploader can't resolve
  from the app dir. Remote builds from the repo root handle the workspace natively.
- Deployment Protection (Vercel Authentication) is intentionally **off** (ADR 002).
  If a deploy ever 302s to `vercel.com/sso-api`, someone re-enabled it:
  project Settings → Deployment Protection, or PATCH `ssoProtection: null` via API.
- `apps/web/.env.local` holds a Vercel OIDC token the CLI drops during builds —
  gitignored, never commit it.
