---
name: investigate
description: Use when something is broken, failing, flaky, or behaving unexpectedly and the cause is not yet known — a bug report, a failing test, an exception, a "why is this happening" question. Enforces reproduce-before-fix discipline, finds the true root cause layer by layer, and caps speculative fixes at three. Do NOT use for shaping/building new features (use /shape) — only for diagnosing wrong behavior.
---

# Investigate a bug to root cause

Goal: find the *true* cause of a defect and fix it once, at the right layer —
not patch a symptom and move on. Read `docs/skills/debugging.md` and apply it.

The discipline, in short:

1. **Reproduce first.** Get a deterministic repro before touching any code. If
   you can't reproduce it, you can't know you fixed it. A failing automated test
   is the best repro — write one.
2. **Locate the layer.** Is the wrong behavior in `domain`/`application` (logic),
   `infrastructure` (a repository/adapter), or `apps/web` (presentation,
   hydration, timing)? Watch `apps/web/src/lib` especially — the client
   adapters and orchestration there sit outside the core test floor, so a "UI
   bug" is often really a lib bug. Confirm the layer, don't assume.
3. **One hypothesis at a time.** State what you think is wrong and what evidence
   would confirm it. Gather the evidence. Don't shotgun changes.
4. **Three-fix cap.** If three distinct attempted fixes haven't resolved it,
   STOP changing code. Your model of the system is wrong — step back, re-read the
   actual behavior, and report what you've ruled out before continuing.
5. **Fix at the root, at the right layer.** Business-logic bugs get fixed (and
   tested) in `packages/core`, not papered over in a component.
6. **Lock it with a regression test**, then hand off to
   [`docs/workflows/fixing-a-bug.md`](../../../docs/workflows/fixing-a-bug.md)
   for review and verification.

Never silence an error to make a symptom disappear. Typed errors only — surface
the real failure.
