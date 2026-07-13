# Workflow: fixing a bug

The bug pipeline. Detail lives in [`../skills/debugging.md`](../skills/debugging.md);
this page is the order and the hand-offs.

1. **Investigate** — `/investigate`: reproduce first, locate the owning layer,
   one hypothesis at a time, three-fix cap.
2. **Lock the repro** — turn the reproduction into a failing regression test in
   `packages/core/test` (or, for pure-presentation bugs, a headless-Chromium
   step in the verify drive).
3. **Fix at the owning layer** — business logic in `packages/core`, storage in
   the adapter, rendering in the component. Never paper over a core bug in a
   component, and never silence an error to hide a symptom.
4. **Gates** — `pnpm test && pnpm typecheck && pnpm lint && pnpm build`.
5. **Verify** — `/verify` the fixed behavior in the running app.
6. **Docs in the same change** — a fix that changed behavior gets a shipped.md
   entry; a fix that revealed a wrong doc corrects the doc.
7. **Ship** — `/ship`.
