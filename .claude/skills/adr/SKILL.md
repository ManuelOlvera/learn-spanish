---
name: adr
description: Use when a load-bearing decision is about to be made or has just been made — audio strategy, platform/hosting, data-layer policy, fail-mode trade-offs, or any choice a future session must not silently re-litigate. Also use BEFORE proposing a platform/data-layer migration: check `docs/adr/` first and engage with any existing record instead of re-proposing cold. Scaffolds a ~10-line ADR from the template. Skip for reversible, low-stakes choices.
---

# Record (or check) an architecture decision

Goal: capture load-bearing decisions so a future session engages with the
consequences instead of re-proposing something already settled — and reads the
existing record before proposing a migration. Records live in
[`docs/adr/`](../../../docs/adr/); the template is
[`000-template.md`](../../../docs/adr/000-template.md).

## Check first (before proposing a change)

If you're about to propose an **audio / platform / data-layer / fail-mode**
migration, read `docs/adr/` first. If an ADR already decided against it —
ADR-001 browser-speech-synthesis-not-recorded-audio, ADR-002
Vercel-no-general-database, ADR-003 recordings-never-persisted, ADR-004
capability-code-sync-no-accounts (and its last-write-wins addendum) — **do not
re-propose cold**: engage with that ADR's Consequences and say what changed
since it was written.

## Write it (when a decision is made)

1. **Confirm it's load-bearing.** An ADR is for a decision a future session
   could wrongly reverse — not a topic, not a reversible implementation
   detail. If it's cheap to undo, skip the ADR.
2. **Next number.** Use the next free `NNN` in `docs/adr/` — they're
   sequential; check the folder rather than trusting a remembered count.
3. **Scaffold from the template.** Copy `000-template.md`, fill the three
   sections — **Context** (the forces that made it a real decision),
   **Decision** (what was chosen, in a sentence or two), **Consequences**
   (what it buys, what it costs, and what a future session must NOT propose
   without reading the rationale first). Set the status and date.
4. **Keep it ~10 lines.** Link to the code or doc that carries the deep
   rationale rather than duplicating it. A superseding insight about an
   accepted ADR gets a dated **Addendum** section, not a rewrite (see ADR-004).
5. **Index it.** The `docs/adr/` folder is listed in `docs/README.md` with
   per-ADR lines — add yours there in the same change.

Ship the ADR in the **same change** as the decision it records — per the
`CLAUDE.md` documentation-hygiene rule, docs don't trail the code.
