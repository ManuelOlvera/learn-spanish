---
name: shape
description: Use BEFORE writing any code for a new feature, page, or capability — when the request is still vague, broad, or could balloon in scope. Runs a short forcing-question interrogation that pins down the user, the problem, the cut-lines, and the smallest shippable slice, then writes the agreed shape down. Skip for trivial one-line changes and for bug fixes (use /investigate instead).
---

# Shape a feature before building it

Goal: turn a vague feature request into a small, explicit, agreed scope **before**
any code is written. The failure mode this prevents is guessing at scope and
building the wrong (or oversized) thing.

Read `docs/skills/feature-shaping.md` and apply it. The short version:

1. **Ask the forcing questions** in that doc. Do not skip ahead to a plan — ask
   first, one tight round, and wait for answers on anything you cannot safely
   infer from the codebase.
2. **Name the cut-line.** State explicitly what is IN this slice and what is
   deferred. A feature with no deferred items is almost certainly too big.
3. **Write the shape down** as a short block the user can approve:
   - Problem & user
   - The one behavior that must work
   - In scope / Out of scope (deferred)
   - Affected layers (`domain` / `application` / `infrastructure` / `apps/web`)
   - How we'll know it works (the test or observable behavior)
4. **Get a yes** before coding. Then hand off to the feature workflow in
   `docs/workflows/adding-a-feature.md`.

Do not produce architecture, file lists, or code in this skill — that's the
planning step inside the feature workflow. This skill only fixes *what* and
*how small*, not *how*.
