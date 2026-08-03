# ADR 011: Pairing by QR — hand-rolled encoder, key in the fragment, confirm before pairing

- **Date:** 2026-08-03
- **Status:** accepted

## Decision

A paired device shows a QR that encodes `https://<origin>/#sync=<CODE>`, so a
second device joins the family progress (ADR 004) by scanning instead of
retyping 20 symbols. Three parts are load-bearing:

1. **The encoder is hand-rolled** (`packages/core/src/domain/qr.ts`: byte mode,
   EC level M, versions 1–10). `apps/web` has no third-party runtime
   dependencies at all — only React and Next — and ADR 010 names "one
   compromised client dependency" as a real risk on these tablets. A pairing
   convenience does not justify widening that surface. Correctness is not taken
   on faith: `test/qr.test.ts` decodes every matrix with a real scanner (jsQR,
   **dev-only**) at each capacity step, and `/verify` re-decodes the SVG the
   browser actually renders.
2. **The code rides in the URL fragment, never the query.** A fragment is not
   sent to the server, so the capability key stays out of Vercel's request
   logs. `parseSyncLink` deliberately *ignores* `?sync=` — honoring it would
   bless the one link shape that leaks the key.
3. **The receiving device asks before pairing.** A link that silently rewires
   which family's progress a device shows is the wrong default; the prompt also
   makes an accidental re-scan harmless. The fragment is stripped from the URL
   *before* the parent answers, so the key never lingers in the address bar,
   history, or a bookmark.

## Context

Pairing already worked (ADR 004), but the parent had to type a URL and then
`V3DB3-5RMVJ-B4A9A-TCGRT` on a tablet keyboard, at exactly the moment someone
was standing there waiting. One scan collapses both steps — the QR carries the
app *and* the key, which is why "share the app" and "share the code" are one
feature rather than two.

That merge is also what makes the QR sensitive: it is the house key in picture
form. The alternatives were to encode only the app URL (no typing saved, which
is the actual pain) or to put the code in the query string (simpler to parse,
and logged by the host forever).

Scanning *in-app* was cut: the other device's native camera already reads QR
codes, so an in-app scanner would buy a camera permission prompt, a scanner
dependency, and an iOS Safari failure mode for nothing.

## Consequences

- The repo owns ~350 lines of QR encoding forever. It is pure, framework-free
  and pinned by scanner round-trip tests, but it is ours to fix. The scope is
  deliberately narrow (byte mode, level M, ≤213 bytes); a longer payload throws
  rather than silently truncating.
- `jsqr` is a **dev** dependency of `packages/core` and must never become a
  runtime one — that would give away the whole point.
- The QR must stay black-on-white, ignoring the paper/ink theme tokens: a dark
  theme renders a symbol phones refuse to read.
- Anything that ever wants a *second* capability code (ADR 010's conversation
  gate) inherits this shape: fragment, confirm, strip.
- The typeable code stays visible next to the QR. Scanning is an accelerator,
  never the only path — a cracked camera or a printed code must still work.
