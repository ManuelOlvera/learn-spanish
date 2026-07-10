---
name: adr
description: Use when a load-bearing decision is about to be made or has just been made — auth model, platform strategy, data-layer policy, fail-mode trade-offs, or any choice a future session must not silently re-litigate. Also use BEFORE proposing an auth/platform/data-layer migration: check `docs/adr/` first and engage with any existing record instead of re-proposing cold. Scaffolds a ~10-line ADR from the template. Skip for reversible, low-stakes choices.
---

# Record (or check) an architecture decision

Goal: capture load-bearing decisions so a future session engages with the
consequences instead of re-proposing something already settled — and reads the
existing record before proposing a migration. Records live in
[`docs/adr/`](../../../docs/adr/); the template is
[`000-template.md`](../../../docs/adr/000-template.md).

## Check first (before proposing a change)

If you're about to propose an **auth / platform / data-layer / fail-mode**
migration, read `docs/adr/` first. If an ADR already decided against it (e.g.
ADR-001 custom-JWT-not-Supabase-auth, ADR-003 TWA-not-React-Native, ADR-005
forward-only-migrations), **do not re-propose cold** — engage with that ADR's
Consequences and say what changed since it was written.

## Write it (when a decision is made)

1. **Confirm it's load-bearing.** An ADR is for a decision a future session could
   wrongly reverse — not a topic, not a reversible implementation detail. If it's
   cheap to undo, skip the ADR.
2. **Next number.** Use the next free `NNN` in `docs/adr/` (they're sequential;
   the highest today is 006).
3. **Scaffold from the template.** Copy `000-template.md`, fill the three
   sections — **Context** (the forces that made it a real decision), **Decision**
   (what was chosen, in a sentence or two), **Consequences** (what it buys, what
   it costs, and what a future session must NOT propose without reading the
   rationale first). Set `**Status:** Accepted · <today>`.
4. **Keep it ~10 lines.** Link to the code or doc that carries the deep rationale
   rather than duplicating it. If it takes more than 20 minutes, it's over-scoped.
5. **Index it.** The `docs/adr/` folder is already listed in `docs/README.md`; no
   per-file index entry is needed, but confirm the folder entry still reads true.

Ship the ADR in the **same change** as the decision it records — per the
`CLAUDE.md` documentation-hygiene rule, docs don't trail the code.
