# Frontend design: the Sticker Book language

Read this before building or changing any UI. The app's visual direction was
chosen deliberately (over Candy Pop, Big Sky, and Arcade Night variants):
**hand-made, storybook, tactile — playful but calm.** Every new screen must
read as a page from the same sticker book.

## The audience constraint (overrides everything)

Users are 3–5 and cannot read. Therefore:

- Navigation works by **picture alone** — text labels are for parents.
- Touch targets are huge (≥ 64px) and forgiving; primary actions are the
  biggest thing on screen.
- Every tap gives immediate, physical feedback (wobble, pop, sound).
- One action per screen. No menus, no settings icons, no dead zones.
- No text a child must read to proceed; Spanish words on cards are *exposure*,
  not instructions.

## Tokens (defined in `apps/web/src/app/globals.css` `@theme`)

- `paper` `#fbf3e2` — cream background with a faint polka-dot grain
- `ink` `#221f1a` — warm near-black for outlines and text
- `lime` `#a3e635` / `lime-deep` `#4d7c0f` — the brand accent
- Per-deck accents live in `apps/web/src/lib/deck-theme.ts` (presentation-only;
  never in `packages/core`), applied via the `--accent` CSS variable.

## The sticker (signature component)

White face, `4px` solid ink outline, `2rem` radius, hard offset shadow
`8px 8px 0` in the accent color (`.sticker`), with a peeled corner detail
(`.sticker-peel`). Pressing translates the sticker into its shadow
(`active:translate-x-1 active:translate-y-1 active:shadow-none`) — things feel
physically pressable.

## Type & motion

- Display font: **Baloo 2** (rounded, chunky) via `next/font`, variable
  `--font-baloo`; falls back to `ui-rounded`.
- Motion is quick and springy: `.wobble` on tap (0.55s), `.pop-in` on entry
  (0.35s). Always wrapped in `prefers-reduced-motion` guards.
- Never more than one attention-seeking animation at a time.

## Variant exploration

For any non-trivial new screen, run `/design-variants` first: 3–6 genuinely
distinct directions, present side by side, converge on a pick — then execute
that pick to the standard above. Don't ship the exploration.
