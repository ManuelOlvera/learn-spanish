---
name: verify
description: Build, launch, and drive the Palabras web app to verify a change end-to-end (prod server + headless Chromium click-through).
---

# Verifying changes to apps/web

## Build & launch

```bash
pnpm build                                  # sandbox-safe; font is self-hosted, no network needed
cd apps/web && npx next start -p 3457       # needs sandbox off: bind = listen EPERM in sandbox
```

Restart the server after every rebuild — `next start` serves the `.next` it opened with.

## Gotchas (learned the hard way)

- `curl localhost` fails inside the sandbox (host allowlist) — run curls unsandboxed.
- `next/font/google` hangs the build in the sandbox (fonts.gstatic.com blocked); the font
  is self-hosted at `apps/web/src/fonts/` via `next/font/local` — keep it that way.
- Backgrounding with `&` inside a sandboxed command fails (`nice(5)`); use the harness's
  `run_in_background` instead.

## Drive it

SSR smoke: `curl` `/`, `/deck/animals` (expect "el perro"), `/deck/unknown` (expect 404),
`/manifest.webmanifest`.

Client flow: Playwright headless Chromium (install in the scratchpad, not the repo),
viewport 820×1180. Worth driving: home → tap a deck sticker → first card visible → tap
card (speech path; silent headless, assert no pageerror) → next through all cards →
`¡Muy bien!` screen → replay → home button. Probe: rapid-fire the next button past the
end. Collect `pageerror` + console errors throughout; screenshot each screen and look
at them — visual regressions (e.g. Tailwind `bg-*` losing to the unlayered `.sticker`
background rule) only show up in pixels.

Also worth checking when the change is anywhere near them:

- **Sync panel gating:** with `NEXT_PUBLIC_SUPABASE_*` set, the album footer's
  Progreso panel must show *Sincronizar entre dispositivos*; without them it must
  not — a regression here silently disables (or falsely advertises) pairing.
- **Album screenshot:** the tier medals (🥉/🥈/🥇) and per-kid slot filtering are
  the pixels most likely to regress; screenshot `/album` and look.
- **Offline (ADR 005):** load `/` once online (the SW registers on prod builds
  and precaches the shell), wait for `navigator.serviceWorker.ready`, then
  `context.setOffline(true)` and reload — home must still render. The worker
  only registers on production builds, so this needs `next start`, not dev.
