# Documentation index

Markers: **[living]** kept current with the code · **[append-log]** grows, never rewritten · **[archived]** historical.

- [features/shipped.md](features/shipped.md) — **[append-log]** write-ups of shipped features
- [features/roadmap.md](features/roadmap.md) — **[living]** planned two-kid interactivity features and build order
- [bugs.md](bugs.md) — **[living]** the parent's running bug/idea inbox; items get struck through with their resolution as they're fixed, shipped, or parked
- [features/pairing.md](features/pairing.md) — **[living]** parent-facing how-to for cross-device sync (pairing codes)
- [workflows/adding-a-feature.md](workflows/adding-a-feature.md) — **[living]** the feature pipeline: shape → design → TDD → verify → docs → ship
- [workflows/fixing-a-bug.md](workflows/fixing-a-bug.md) — **[living]** the bug pipeline: investigate → regression test → fix at the owning layer → ship
- [skills/frontend-design.md](skills/frontend-design.md) — **[living]** the app's visual language (Sticker Book); read before building any UI
- [skills/feature-shaping.md](skills/feature-shaping.md) — **[living]** the /shape process: forcing questions + shape block
- [skills/debugging.md](skills/debugging.md) — **[living]** the /investigate discipline + case log
- [architecture-diagrams.md](architecture-diagrams.md) — **[living]** the system on one page: monorepo graph, sync sequence, localStorage key inventory
- [runbooks.md](runbooks.md) — **[living]** deploy, rollback, and Vercel gotchas
- `supabase/migrations/` — not docs, but load-bearing: SQL applied by hand to the live project per the runbook, **before** the code that needs it ships
- [fable-review/](fable-review/) — **[archived]** point-in-time implementation review (2026-07-13):
  [security](fable-review/security.md) · [code quality](fable-review/code-quality.md) ·
  [architecture](fable-review/architecture.md) · [docs](fable-review/docs.md) ·
  [claude skills](fable-review/claude-skills.md) · [features](fable-review/features.md)
- [adr/](adr/) — **[append-log]** architecture decision records (template: [adr/000-template.md](adr/000-template.md))
  - [adr/001-browser-speech-synthesis.md](adr/001-browser-speech-synthesis.md) — audio via the Web Speech API, not recorded files
  - [adr/002-vercel-hosting.md](adr/002-vercel-hosting.md) — Vercel hosting, no database, public prod URL
  - [adr/003-ephemeral-voice-recordings.md](adr/003-ephemeral-voice-recordings.md) — say-it-back clips live in memory only, never stored or sent
  - [adr/004-optional-supabase-sync.md](adr/004-optional-supabase-sync.md) — local-first with optional Supabase sync; pairing code as capability, no accounts
  - [adr/005-hand-rolled-service-worker.md](adr/005-hand-rolled-service-worker.md) — offline via a hand-rolled service worker, not next-pwa/Workbox
