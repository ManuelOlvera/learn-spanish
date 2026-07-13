---
name: diagram
description: Use when the user wants a diagram created or updated from a plain-English description — system architecture, a data/sequence flow, an entity relationship, or the monorepo/package graph. Produces Mermaid that matches this repo's diagram conventions and keeps docs/architecture-diagrams.md and docs/diagrams/ in sync.
---

# Generate or update a Mermaid diagram

Goal: turn an English description of a structure or flow into a correct Mermaid
diagram that stays true to this repo's real architecture.

## Where diagrams live

- **`docs/architecture-diagrams.md`** — the narrated set, each diagram with a
  short intro paragraph then a fenced ```mermaid block. **Does not exist yet**:
  create it on first use (and add it to the `docs/README.md` index as
  **[living]** in the same change).
- **`docs/diagrams/*.mermaid`** — standalone source files for individual
  diagrams. When both exist for one diagram, update **both** — don't let them
  drift.

## How to draw

1. **Pick the right Mermaid type** for the intent:
   - `graph TD`/`graph LR` — architecture, dependency/package graphs
   - `erDiagram` — domain entity relationships
   - `sequenceDiagram` — data flows (e.g. the sync pull/merge/push exchange)
2. **Stay true to the real architecture.** This is a DDD/clean-architecture
   pnpm monorepo: `apps/web` (presentation) → `@learn-spanish/core`
   (`domain → application → infrastructure`, ports in `domain/`) with
   `@learn-spanish/config` beside them. Adapters are constructed only in the
   two composition roots (`apps/web/src/lib/container.ts` server-safe,
   `client-container.ts` client-side). Persistence is browser localStorage;
   the only remote is the optional Supabase progress row behind
   `RemoteProgressStore` (ADR 004). Don't invent layers or draw dependencies
   that violate `CLAUDE.md`.
3. **Conventions:** `subgraph` groupings for layers, `[(…)]` for datastores
   (localStorage, the Supabase `progress` table), descriptive participant
   aliases (`participant UC as Use Case (PushProgress)`), solid edges for
   calls, dotted for "implements port".
4. **Add a one-line narration** above any diagram placed in
   `architecture-diagrams.md`.
5. **Verify it parses** as valid Mermaid before finishing.

Keep diagrams accurate to the code as it actually is — a wrong diagram is
worse than none.
