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
