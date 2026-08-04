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

- **2026-08-04 — "accessories disappear when you move to another mascota"**: the
  one that was NOT a bug, and a lesson in whose answer that is. `wornAccessories`
  returns `pet.worn ?? pet.accessories ?? []`; the middle term was the owned set
  back when ownership was per-pet, so it once meant "an undressed pet wears
  everything", and `PetState.worn` still SAID so. Code, comment, and one test
  ("owns the crown too, but bare") disagreed three ways, so I took the comment
  as intent and made undressed pets wear the whole wardrobe — wrong: dressing is
  per-pet by design, and the owner said so immediately. Reverted same day; the
  comment is now fixed and `docs/bugs.md` records the decision so it is not
  "fixed" again. Lessons: a stale comment is evidence of *drift*, not authority
  on intent — when code, comment, and test disagree about a PRODUCT rule, that
  is a question for the owner, not a puzzle to solve from the repo; and "I can
  see how to make the symptom go away" is not the same as "this is a defect" —
  confirm the desired behaviour before changing a default that users see.
- **2026-08-04 — "feeding animals quickly, the sad face reappears"**: reported as
  a race in the feeding code; feeding was innocent. A browser repro with sync
  UNPAIRED fed 10× with no sad face, which killed the whole local branch in one
  step, and a unit test proved `mergePet` can never move `lastFed` backwards —
  so the only way hunger returns is the ACTIVE pet changing. `mergeProgress`
  resolved `active` incoming-wins while `worn`/`form` in the same function are
  receiving-device-wins; every pull adopted the other device's pet. Rapid
  feeding just widened the window (one `syncPush` per meal). Lessons: reproduce
  with the suspect subsystem switched OFF first — "sync disabled ⇒ clean" is
  worth more than any amount of reading; when a merge function resolves three
  sibling fields of the same *kind*, an inconsistent one is the bug; and every
  existing test used `active: "pollito"` on BOTH sides, so no test could ever
  see it — check whether the fixtures can even express the failure.

- **2026-07-30 — blank tile in La misión, two days running**: one of the day's
  three tiles rendered empty. `MissionCard`'s `KIND_EMOJI` was typed
  `Partial<Record<MissionKind, string>>`, so `cuento` (added to the shared draw
  pool later) never got an icon and no compiler error said so — a ~30% chance
  any given day blanked a slot, and 07-29/07-30 both drew it. Fix: derive
  `MissionKind` from an exported `MISSION_KINDS` array and make the icon map a
  TOTAL `Record`, so an undrawable kind is a build failure; core test pins the
  drawn set to that list. Lessons: `Partial` on a presentation lookup keyed by a
  domain union silently disables the only check that keeps them in sync — use a
  total `Record` and let `tsc` be the regression test; and for
  "intermittent/some days" reports, run the deterministic day function over a
  date range and find the days the reporter actually saw.
- **2026-07-14 — "Application error" opening a game in prod**: not the game —
  deploy skew. A session opened before one of the day's four deploys asked
  the new deployment for old route chunks; the crash surfaced as Next's
  DEFAULT error wall because the app had no error boundary. Fix:
  `app/error.tsx` auto-reloads once (fresh HTML + matching chunks heal any
  skew), then falls back to a picture-only 🙈/🔄/🏠 screen. Lessons: the
  default Next error text in a screenshot means "you have no boundary";
  deploy-skew crashes reproduce poorly on a fresh session — look at *when*
  deploys happened relative to the report; and ship-day frequency is itself
  a risk factor for open PWA sessions.

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
