# ADR 010: A runtime LLM for Habla conmigo — the terms, decided before the build

- **Date:** 2026-08-02
- **Status:** proposed (feature parked 2026-08-02 — build not started)

## Decision

If ¡Palabras! grows a spoken conversation partner (roadmap 25), it will call a
hosted LLM **from a Next.js route handler**, never from the browser, and it will
do so under four non-negotiable terms:

1. **The kid's audio never leaves the device.** Transcription happens in the
   browser (`SpeechRecognition`); only the resulting *text* is sent to our
   route. The reply is spoken by the existing `speechSynthesis` adapter
   (ADR 001) — no TTS API, no audio upload, no audio download.
2. **Nothing is persisted, either side.** No transcripts, no conversation
   history, no logs of what a child said — in localStorage, in Supabase, or in
   our server logs. Only the star reward survives the screen.
3. **The route is rate-limited server-side** before it is deployed, not after.
4. **It is one tile, and it fails invisibly.** No microphone, no recognition
   support, or no network, and the entry tile is simply absent. Nothing else
   in the app may depend on the model being reachable.

This ADR is recorded *ahead* of the work deliberately: the terms are the
expensive part, and a future session should not get to re-derive them cheaply.

## Context

Every feature shipped so far runs entirely on the device. Speech is synthesized
locally (ADR 001), say-it-back clips are held in memory and discarded
(ADR 003), hosting is static (ADR 002), sync is optional and local-first
(ADR 004), and the service worker makes the whole app work offline (ADR 005).
There is no server-side secret anywhere in the repo and no route handler at all.

A conversation partner breaks that pattern in three directions at once, and
each one has a cheap wrong answer:

- **Privacy.** The obvious build — record the kid, upload the audio, get a
  transcript — contradicts ADR 003 head-on. The users are 3–8 years old and
  the recordings are of their voices. Browser-side recognition gets the feature
  without the upload, at the cost of a browser dependency. Worth naming
  honestly: Chrome's `SpeechRecognition` transcribes server-side at Google, so
  "audio never leaves the device" holds for *our* stack, not for the browser's.
  That is a real limit of the decision, not a footnote to it.
- **Money.** Prod is a public URL with no accounts (ADR 002/004). An
  unauthenticated route holding an API key is a bill anyone can run up. Client
  turn caps are decoration.
- **The offline promise.** ADR 005 bought a genuinely offline PWA. Exactly one
  tile may break that, and only by disappearing when it cannot work.

## Consequences

- The repo gains its first route handler, its first server-only secret, and
  its first paid runtime dependency — `packages/config/src/env.ts` grows a
  server-side validated key, and the deploy runbook grows a step.
- A conversation cannot be replayed, reviewed by a parent, or synced. Any of
  those features reopens this ADR *and* ADR 003.
- The feature is unavailable on browsers without `SpeechRecognition` and on a
  plane. Accepted: the other ~15 games do not care.
- Cost is bounded by rate limiting and a small `max_tokens`, not by trust.
- If speech recognition proves unusable for a five-year-old's pronunciation,
  the fallback is *not* uploading audio to a better STT model — it is cutting
  the feature back to tap-to-choose replies, which needs no model at runtime.
