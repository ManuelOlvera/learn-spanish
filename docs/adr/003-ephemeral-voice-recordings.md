# ADR 003: Voice recordings are ephemeral — in-memory only

**Date:** 2026-07-11 · **Status:** accepted

## Decision

Say-it-back recordings (MediaRecorder) live only in a JavaScript variable for
the immediate play-back-to-the-kid moment. They are never written to
localStorage/IndexedDB, never uploaded, and the mic stream is stopped the
instant recording ends. A new card or leaving the page discards the clip.

## Why

The users are small children. Storing or transmitting their voices creates a
privacy liability with zero learning upside — the pedagogy ("hear yourself
next to the model") only needs the clip for seconds. This also keeps the app
account-free and backend-free (ADR 002).

## Consequences

- No "listen to yesterday's recording" feature can exist without revisiting
  this ADR.
- Mic permission is requested on first use, from a tap (user gesture).
- If recording is unsupported or denied, the 🎤 button hides/disables —
  the flashcards must stay fully usable without it.
