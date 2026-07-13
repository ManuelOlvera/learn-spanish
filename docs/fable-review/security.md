# Security review — 2026-07-13

> **Status update (2026-07-13):** findings 1–5 implemented — migration
> `0002_progress_hardening.sql` (format check, 64 KB cap, `delete_progress`,
> `search_path`, retention sweep), sanitizer magnitude caps in
> `domain/transfer.ts`, security headers in `next.config.ts`, the pairing.md
> key-warning, and the join-ordering fix (plus require-existing-row on join).
> See `docs/features/shipped.md` for the write-up.

Point-in-time review of the implementation as of commit `1fee604`. The overall
posture is good for this app's threat model: no accounts, no PII, no secrets in
the repo, capability-code sync fenced behind RLS + SECURITY DEFINER RPCs, and
voice recordings that never leave memory (ADR 003). The findings below are
hardening, roughly in priority order.

## 1. `put_progress` accepts unbounded writes from anyone with the anon key

`supabase/migrations/0001_progress_sync.sql:31` — the RPC upserts a row for
**any** `p_code` string with **any** size of `p_snapshot`. The anon key is
public by design, so any visitor can script unlimited row creation and
arbitrarily large jsonb payloads: storage exhaustion / free-tier quota burn, not
data disclosure. The read path is safe (100-bit codes can't be enumerated); the
write path is the exposed surface.

Recommend, inside the RPC (a follow-up migration):

- Reject codes that don't match the client format: `p_code ~ '^[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){3}$'`.
- Cap payload size: `pg_column_size(p_snapshot) <= 64 * 1024` (a real family
  snapshot is a few KB).
- Add a retention sweep (pg_cron or a periodic manual query) deleting rows with
  `updated_at` older than ~12 months — orphaned rows (lost code + lost devices,
  ADR 004's accepted risk) currently live forever.

## 2. No `delete_progress` capability

Unpairing (`apps/web/src/lib/sync.ts:50`) removes the local code but the cloud
row persists indefinitely. The data is low-stakes (stickers/streaks under
generic kid ids), but a family that stops using sync has no way to remove their
row. A third `delete_progress(p_code)` RPC — same capability model — plus a
"Borrar el progreso en la nube" action in `SyncPanel` closes the loop cheaply.

## 3. `sanitizeSnapshot` validates shape but not magnitude

`packages/core/src/domain/transfer.ts:173` — numbers only need
`typeof === "number" && >= 0`, and arrays/strings have no length caps. Two
consequences:

- `Infinity` (and non-integers) pass for `stars`/`freezes`/counts; max-merge
  then makes them sticky, and `JSON.stringify(Infinity)` becomes `null` in
  localStorage, silently zeroing on the next read.
- A hostile snapshot (crafted transfer code handed to a parent, or a
  compromised cloud row) can carry megabytes of junk strings straight into
  localStorage (~5 MB quota) and brick the app on that device.

Recommend `Number.isSafeInteger(v) && v >= 0 && v <= SOME_CEILING` for numeric
fields, and length caps on every array/string the sanitizer accepts.

## 4. No security response headers

`apps/web/next.config.ts` sets none. The app has no user-generated HTML or
third-party scripts, so risk is low, but these are one `headers()` block:
`Content-Security-Policy` (self + the Supabase origin for `connect-src`),
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`frame-ancestors 'none'` (nothing embeds this app), and a minimal
`Permissions-Policy` (`microphone=(self)` — the say-it-back recorder needs it,
everything else can be denied).

## 5. Pairing-code handling nits

- `docs/features/pairing.md` tells parents to "jot the code somewhere" but
  never says the code **is** the key — anyone who has it can read and overwrite
  the family's progress. One sentence ("treat it like a house key; don't post
  it") fixes the guidance.
- `joinWithCode` (`apps/web/src/lib/sync.ts:90`) persists the code **before**
  the first pull succeeds, so a network failure leaves the device silently
  paired to an unverified code (see code-quality review #1 for the fix).
- SECURITY DEFINER functions should pin `search_path = public, pg_temp` (the
  current `= public` leaves `pg_temp` implicitly first). The table references
  are schema-qualified so this isn't exploitable today — it's belt-and-braces.

## What already looks right (keep it)

- RLS with **zero policies** + revoked grants, access only via code-requiring
  RPCs — rows can't be enumerated or dumped with the anon key.
- ~100-bit pairing codes from `crypto.getRandomValues`, no modulo bias
  (`packages/core/src/domain/sync.ts`).
- Every payload crossing a trust boundary (pasted code, cloud row) goes through
  the one shared sanitizer before `mergeProgress`.
- No `.env` committed; `.gitignore` layers cover `.env*` including the Vercel
  OIDC token; env access is centralized and zod-validated in
  `packages/config/src/env.ts`.
- Recordings are in-memory blobs, mic tracks stopped on stop, object URLs
  revoked (`apps/web/src/lib/recorder.ts`).
- Logs carry no PII (kid ids are the generic `listener`/`reader`).
