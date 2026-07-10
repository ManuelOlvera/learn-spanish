# Runbooks

## Deploy to production (Vercel)

Prod URL: https://learn-spanish-manuelolveras-projects.vercel.app
Project: `learn-spanish` (team `manuelolveras-projects`), root directory `apps/web`.
The repo-root `.vercel/` dir links the CLI to the project (gitignored; recreate with
`npx vercel link --yes --project learn-spanish` from the repo root if missing).

Until the Vercel GitHub App is connected, pushing `main` does **not** deploy.
Deploy from the repo root:

```bash
npx vercel deploy --prod --yes    # remote build; ~1 min
```

Gate: only deploy a change that has cleared verify (`/ship` checklist).

**Enable push-to-deploy (one-time, in the browser):** install the Vercel GitHub App
on the `ManuelOlvera` account with access to `learn-spanish`
(vercel.com → project → Settings → Git → Connect), or approve it at
https://github.com/apps/vercel. Then update this runbook and `.claude/CLAUDE.md`'s
Git section: pushing `main` = deploying prod.

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
