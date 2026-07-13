# Documentation index

Markers: **[living]** kept current with the code · **[append-log]** grows, never rewritten · **[archived]** historical.

- [features/shipped.md](features/shipped.md) — **[append-log]** write-ups of shipped features
- [features/roadmap.md](features/roadmap.md) — **[living]** planned two-kid interactivity features and build order
- [skills/frontend-design.md](skills/frontend-design.md) — **[living]** the app's visual language (Sticker Book); read before building any UI
- [skills/feature-shaping.md](skills/feature-shaping.md) — **[living]** the /shape process: forcing questions + shape block
- [skills/debugging.md](skills/debugging.md) — **[living]** the /investigate discipline + case log
- [runbooks.md](runbooks.md) — **[living]** deploy, rollback, and Vercel gotchas
- [adr/](adr/) — **[append-log]** architecture decision records (template: [adr/000-template.md](adr/000-template.md))
  - [adr/001-browser-speech-synthesis.md](adr/001-browser-speech-synthesis.md) — audio via the Web Speech API, not recorded files
  - [adr/002-vercel-hosting.md](adr/002-vercel-hosting.md) — Vercel hosting, no database, public prod URL
  - [adr/003-ephemeral-voice-recordings.md](adr/003-ephemeral-voice-recordings.md) — say-it-back clips live in memory only, never stored or sent
  - [adr/004-optional-supabase-sync.md](adr/004-optional-supabase-sync.md) — local-first with optional Supabase sync; pairing code as capability, no accounts

Referenced by skills in `.claude/skills/` but not yet written (create on first need):
`architecture-diagrams.md` (/diagram).
