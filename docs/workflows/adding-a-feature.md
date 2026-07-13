# Workflow: adding a feature

The feature pipeline, end to end. Each step's detail lives in the linked
skill/doc; this page is the order and the hand-offs.

1. **Shape it** — `/shape` (doc: [`../skills/feature-shaping.md`](../skills/feature-shaping.md)).
   Get an approved shape block: problem, the one behavior, cut-lines, layers.
2. **Explore UI directions** — `/design-variants` for any non-trivial screen or
   component; skip for invisible changes. Execute the pick per
   [`../skills/frontend-design.md`](../skills/frontend-design.md).
3. **TDD the core** — write the failing test in `packages/core/test` first.
   Business rules go in `domain/`/`application/`; apps stay presentation-only.
4. **Build the UI** — components consume use cases from
   `apps/web/src/lib/client-container.ts`; no logic in components.
5. **Gates** — `pnpm test && pnpm typecheck && pnpm lint && pnpm build`.
6. **Verify** — `/verify`: launch the built app and click the new behavior
   through headless Chromium. Only a PASS (or SKIP for no-runtime-surface
   changes) authorizes shipping.
7. **Docs in the same change** — README features line, `docs/features/shipped.md`
   write-up, roadmap check-off, ADR if a load-bearing decision was made
   (`/adr`), `docs/README.md` index for any new doc file.
8. **Ship** — `/ship` (the prod-safety checklist; pushing `main` auto-deploys).
   A verify PASS is standing authorization to push without asking again.
