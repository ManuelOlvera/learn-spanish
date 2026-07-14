# Debugging (used by /investigate)

Find the *true* cause and fix it once, at the right layer.

## The discipline

1. **Reproduce first.** A deterministic repro before any code change — a
   failing unit test is the best repro and becomes the regression lock.
2. **Locate the layer.** Logic → `packages/core` (domain/application);
   data/adapters → infrastructure; rendering/hydration/timing → `apps/web`.
   Many "UI bugs" here are really domain modeling gaps: if a component
   can't render the right thing, ask what concept core is missing.
3. **One hypothesis at a time**, with the evidence that would confirm it.
4. **Three-fix cap.** Three failed fixes means the mental model is wrong —
   stop, re-read actual behavior, report what's ruled out.
5. **Fix at the root.** Never paper over business logic in a component;
   never silence an error to hide a symptom.
6. **Lock with a regression test**, then verify in the running app.

## Case log (patterns worth remembering)

- **2026-07-14 — sync "breaks" when both devices play at once**: the pull
  captured `currentSnapshot()` BEFORE the network fetch, so any progress
  earned during the wait (chest claim, purchase) was rolled back when the
  stale merge applied — plus nothing serialized a device's own pulls/pushes,
  and pushes discarded the union they computed. Fix: snapshot *suppliers*
  read after the remote arrives (order pinned by a core test), a per-device
  serialization queue, and pushes apply their union locally. The live
  two-context verify then caught a second cause the analysis missed: the
  award path only pushed on CHEST OPEN, so a finished game a kid walked away
  from never synced (instrumentation showed zero pushes — the cloud row
  stayed empty). Lessons: in a read-merge-write loop, every `await` between
  READ-LOCAL and APPLY is a window for a concurrent local write — read local
  last, apply in the same microtask chain; and verify sync fixes against the
  real backend with two contexts — the unit layer can't see a push that
  never fires.

- **2026-07-14 — accessories missing on the tablet**: reported as "sync
  doesn't sync". The snapshot pipeline (encode → sanitize → merge) was
  *innocent* — a pipeline test proved it and became the regression lock. Root
  cause: `syncPush` fired only on game-complete and misión-claim, so
  purchases (accessories, pets, avatars, freezes, unlocks, themes) drifted
  until the buying device happened to finish a game. Fix: every
  star-mutating action pushes. Lesson: for sync bugs, separate "the data
  moves wrongly" from "the data never moves" — test the pipeline first to
  pick the branch.
- **2026-07-14 — number tiles overflow on iPad**: the big-number decks use
  two-keycap emoji ("9️⃣0️⃣") that paint ~2× wide; at font sizes chosen for one
  glyph they burst out of fixed squares — only above the `sm:` breakpoint,
  which is why phones looked fine. Fix: `lib/emoji.ts` `emojiSizeClass()`
  (grapheme-aware via `Intl.Segmenter`) applied to all nine card-emoji
  renderers, not just the reported quiz. Lesson: a "spacing on iPad" report
  is usually a breakpoint-dependent size; reproduce at 820×1180 and look at
  pixels, and fix the whole class of render sites.
- **2026-07-11 — "¿Es triste?"**: sí-o-no hardcoded *ser* in the component.
  Root cause was a *domain gap* — cards had no copula concept. Fix: content
  flag `usesEstar` + `siNoQuestion()` in core + content test that every
  feelings card carries the flag. Lesson: language rules are business
  logic; the component should only render.
- **2026-07-11 — "¿Es el gato?"**: same builder, second gap — natives ask
  about a picture with the *indefinite* article ("¿Es un gato?"), plurals
  need *Son unos/unas*, mass nouns take no article ("¿Es agua?"), unique
  entities keep the definite ("¿Es el sol?"), weather is idiomatic
  ("¿Hace calor?"). Fix: article swap + plural agreement in
  `siNoQuestion()`, per-card `question` override for the 24 exceptions,
  all pinned by tests. Lesson: when a grammar bug surfaces, fix the whole
  class the builder gets wrong, not the one reported word.
