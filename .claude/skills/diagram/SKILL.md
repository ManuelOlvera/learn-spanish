---
name: diagram
description: Use when the user wants a diagram created or updated from a plain-English description — system architecture, a data/sequence flow, an entity relationship, or the monorepo/package graph. Produces Mermaid that matches this repo's existing diagram conventions and keeps docs/architecture-diagrams.md and docs/diagrams/ in sync.
---

# Generate or update a Mermaid diagram

Goal: turn an English description of a structure or flow into a correct Mermaid
diagram that matches how this repo already draws diagrams.

## Where diagrams live
- **`docs/architecture-diagrams.md`** — the narrated set (system architecture,
  domain ERD, data-flow sequences, monorepo graph), each with a short intro
  paragraph then a fenced ```mermaid block.
- **`docs/diagrams/*.mermaid`** — standalone source files for individual diagrams.

When you add or change a diagram, update **both** if a standalone `.mermaid`
file exists for it — don't let them drift.

## How to draw
1. **Pick the right Mermaid type** for the intent:
   - `graph TD`/`graph LR` — architecture, dependency/package graphs
   - `erDiagram` — domain entity relationships
   - `sequenceDiagram` — data flows / request lifecycles
2. **Match existing conventions** in `architecture-diagrams.md`: `subgraph`
   groupings for layers, `[(…)]` for datastores, descriptive participant
   aliases (`participant UC as Use Case (LogSet)`), solid vs dotted edges the
   same way the current diagrams use them.
3. **Stay true to the real architecture** — this is a DDD/clean-architecture
   monorepo: `apps/web` (presentation) → `@workout-tracker/core` (`domain →
   application → infrastructure` via ports) → Supabase. Don't invent layers or
   draw dependencies that violate the rules in `CLAUDE.md`.
4. **Add a one-line narration** above any diagram placed in
   `architecture-diagrams.md`, matching the existing voice.
5. **Verify it parses** as valid Mermaid before finishing.

Keep diagrams accurate to the code as it actually is — a wrong diagram is worse
than none.
