# Runbooks

## Deploy to production (Vercel)

Prod URL: https://learn-spanish-manuelolveras-projects.vercel.app
Project: `learn-spanish` (team `manuelolveras-projects`), root directory `apps/web`.
The repo-root `.vercel/` dir links the CLI to the project (gitignored; recreate with
`npx vercel link --yes --project learn-spanish` from the repo root if missing).

Pushing `main` does **not** auto-deploy: the Vercel project has no git connection
(verified via API 2026-07-10 — `vercel git connect` fails because the Vercel GitHub
App lacks access to this repo). Deploy from the repo root:

```bash
npx vercel deploy --prod --yes    # remote build; ~1 min
```

Gate: only deploy a change that has cleared verify (`/ship` checklist). Don't poll
prod afterwards — the deploy result from the CLI is the confirmation.

**To enable push-to-deploy (one click, browser):** grant the Vercel GitHub App access
to `learn-spanish` at https://github.com/settings/installations (it's installed —
tower-blaze and workout-tracker use it — just not authorized for this repo), then
`npx vercel git connect`. Update this section and `.claude/CLAUDE.md`'s Git bullet
when that happens.

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
