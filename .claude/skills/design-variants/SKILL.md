---
name: design-variants
description: Use at the START of a non-trivial UI task (a new screen, a redesign, a key component) — when the visual direction is open and worth exploring before committing. Generates several distinct design directions, gets feedback, then converges on one to build. For executing a direction you've already chosen, skip this and just apply docs/skills/frontend-design.md.
---

# Explore design variants before committing

Goal: avoid settling on the first, most obvious (and usually most generic) layout
by deliberately generating distinct directions first, then converging.

This is the **explore** half of design; `docs/skills/frontend-design.md` is the
**execute** half. Read that doc — it governs the aesthetic standards every
variant and the final build must meet. Then follow its "Variant Exploration"
section:

1. **Generate 3–6 genuinely distinct directions**, each committing to a
   different aesthetic extreme (per the tone list in `frontend-design.md`) — not
   six shades of the same card layout. Describe each in a few lines: the tone,
   the one memorable thing, the layout idea. Lightweight is fine (prose or a
   rough sketch/mockup); the point is range, not polish.
2. **Present them side by side** and get a pick (or a hybrid) from the user.
   Note *why* one won — that signals taste to carry into the build.
3. **Converge on one** and execute it to the full production standard in
   `frontend-design.md`. Don't ship the exploration — ship the committed choice.

Generate options; don't decide for the user when the direction is theirs to set.
