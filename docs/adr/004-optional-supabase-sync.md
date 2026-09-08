# ADR 004: Optional Supabase sync for cross-device progress

- **Date:** 2026-07-13
- **Status:** accepted (extends ADR 002, supersedes the "no backend" note in `domain/transfer.ts`)

## Decision

Progress becomes **local-first with an optional cloud sync**. The app keeps working
entirely offline against `localStorage`; when a parent pairs devices, a `ProgressSnapshot`
is additively merged through a Supabase-hosted document so any device can open the latest
state. Two devices are linked by a **one-time pairing code** that is itself the capability
key — no accounts, no email, no passwords. The code names a single row; there is no user
identity. Sync is **feature-flagged by env presence**: with `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` unset, the app behaves exactly as before (pure local).

## Context

ADR 002 deferred Supabase and named the exact trigger: *"cross-device progress sync,
which first requires deciding to have accounts at all."* That trigger is now real — the
kids play across a tablet and phones and expect the latest state everywhere. The existing
`domain/transfer.ts` already snapshots and additively merges progress via a copy-paste
code, but it drifts the moment you stop copying. This ADR turns that same snapshot + merge
into a continuous sync while preserving what makes the app good: instant local reads and
full offline function.

Forces that shaped the choice:

- **Pre-readers can't log in.** So linking is parent-mediated and invisible to the kid.
  A pairing code reuses the mental model already shipped (the transfer code).
- **No account = the code must be the secret.** A ~100-bit code (20 Crockford-base32
  symbols, see `domain/sync.ts`) is the capability. The
  Supabase table is fenced behind two `SECURITY DEFINER` RPCs, `get_progress(p_id)` /
  `put_progress(p_id, p_snapshot)`, each requiring the code as an argument; RLS denies all
  direct table access, so rows cannot be enumerated or dumped with the public anon key.
  Anonymous Supabase auth is therefore unnecessary — the code alone gates access.
- **Progress is monotonic.** Additive merge (`mergeProgress`: sticker union, `max`
  stars/counts/freezes, longer streak) means no device can ever erase another's rewards,
  so conflicts are resolved without prompts and offline pushes are always safe.
- **Freshness that keeps the app fast.** Reads stay local. We **pull on app open** and
  **push on game complete** (not per answer), both in the background. Live realtime is
  explicitly out of the first slice.

## Consequences

- The app gains a runtime network dependency **only when sync is enabled**. It remains a
  fully-offline PWA when the envs are absent, and a failed pull/push is non-fatal: the
  local snapshot is authoritative and the push is retried on next open.
- **No accounts means no recovery.** If a parent loses every paired device *and* the code,
  the cloud row is orphaned — there is no email to reset from. Accepted for now: progress
  is low-stakes (a child's stickers), the code lives on each paired device, and re-pairing
  regenerates flow from any surviving device. Revisit if data value rises.
- `ProgressSnapshot` grows two fields (`freezes`, `weekly`/`weekProgress`) with `max` /
  longer-of merge rules; the transfer-code path inherits them for free.
- Two new client env vars are read (only) through `packages/config/src/env.ts`. The
  Supabase project + SQL migration (`docs/runbooks.md`, `supabase/`) are an ops step; the
  keys are public by design (RLS + capability RPCs carry the security, not secrecy of the
  anon key).
- Device-local preferences (theme, selected kid) deliberately **do not** sync — they are
  per-device pointers, not progress.

## Addendum (2026-07-13): concurrent pushes are last-write-wins, by design

`put_progress` is a plain read-merge-write with no concurrency control: two devices
pushing at once can race, and the loser's newest rewards vanish **from the cloud row
only** — never from the losing device, whose local copy re-merges them in on its next
pull/push, so the system self-heals within one exchange. For a family app whose writes
are one-per-game-complete, that window is acceptable and not worth machinery.

**Do not "fix" this** without weighing the two real options: (a) merge server-side in
`put_progress` (jsonb union in SQL — makes pushes commutative but duplicates
`mergeProgress` in a second language), or (b) an `updated_at` compare-and-swap with
client retry. Revisit only if a lost-reward report is actually traced to this race.

**2026-07-14 follow-up:** a lost-reward report *was* traced — but to a different,
device-LOCAL race, now fixed: the pull captured its local snapshot *before* the
network fetch, so anything earned during the wait (a chest claim) was rolled back
by the apply. The client now (1) serializes all sync operations per device,
(2) reads local only after the remote row arrives (the use cases take a snapshot
supplier), and (3) applies each push's returned union locally — every push doubles
as a pull, so two devices playing simultaneously converge on each action. The
cross-device last-write-wins window above still stands and still self-heals.

## Addendum (2026-09-08): the snapshot has a ceiling, and it is now visible

`put_progress` rejects a snapshot over 64 KB. Measured against the real pack, a
fully-played family is **~73 KB of JSON** before the economy fields — ~38 KB of
word stats, ~17 KB of sticker ids and ~18 KB of counts, most of the last two
being the same two kid names and 52 deck names repeated 594 times. Since the
snapshot is pushed in full on every game completion, this is a ceiling the
family grows into rather than a transient error, and every push past it fails
identically and forever.

Three changes, none of which alters the merge rules:

1. `stickerCounts` is **pruned on emit** (`pruneStickerCounts`): orphans, which
   ADR 016 already rules read as zero, and counts of exactly 1, which say
   nothing an earned sticker did not. Lossless under `stickerCount`'s own
   definition, and a pruned entry a peer still sends is simply re-supplied by
   the `max` merge.
2. The refusal is raised as `SnapshotTooLargeError` and reported to the parent
   as its own thing (ADR 019) rather than as a flaky network.
3. `WordStat` gains an optional `seen` day stamp (ADR 018), merged by `max`
   like every other counter — additive, so no device can move another's word
   backwards in time.

(3) grows the payload while (1) shrinks it, which is deliberate: day-resolution
integers were chosen over ISO strings for exactly this reason. **The ceiling is
deferred, not removed.** Compacting the wire format — the ~38 KB of word stats
whose key names repeat per word — would roughly halve it and was left alone on
purpose: it changes a shape this ADR governs, every reader would have to accept
both forms forever, and it deserves its own decision rather than arriving as a
side effect.
