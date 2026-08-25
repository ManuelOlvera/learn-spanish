# ADR 001: Spanish audio via browser speech synthesis

- **Date:** 2026-07-10
- **Status:** accepted

## Decision

Card audio uses the Web Speech API (`speechSynthesis`) with an `es-*` voice,
not pre-recorded audio files or a TTS API.

## Context

Pre-readers need every word spoken. Recording or generating 44+ clips costs
authoring time and hosting, and grows with every deck; the browser can speak
Spanish for free, offline, with zero assets.

## Consequences

Pronunciation quality varies by device/voice and we can't guarantee a specific
accent (we prefer `es-MX`, fall back to any `es`). Audio silently degrades to
nothing on browsers without an `es` voice — acceptable for v1. If quality ever
matters more than cost, swap the adapter in `apps/web/src/lib/speech.ts` for
audio files; `packages/core` is unaffected.

**2026-07-11:** accent preference switched to `es-ES` (Castilian) at the
user's request — content wording follows Spain Spanish (coche, ordenador,
hierba). Fallback chain: es-ES → es-MX → es-US → any `es`.

**2026-08-25:** the adapter gained an optional *speaker role* (`pet` / `kid`)
so Habla conmigo can sound like two people — a pre-reader has only the audio
to tell who is talking. The kid's own line keeps voice 0 and pitch 1, so every
existing caller is unchanged; the pet moves.

Corrected the same day, from an Android phone where both speakers still
sounded identical: **Chrome on Android does not enumerate voices.** Its
`getVoices()` returns one entry per language/region, so `es-ES` is a *locale*,
not a speaker, and the device's real voices (Voice I, Voice II…) are picked in
Android's own TTS settings and are invisible to the page. Two consequences we
now design around: picking "the second Spanish voice" there silently returns
the same voice, and picking a *different* locale is worse than useless —
if that pack isn't installed Chrome reads Spanish in an **English** voice.

So voice choice is restricted to the kid's own accent, which makes the device
either offer a real second speaker (desktop, iOS) or none (Android), with no
middle case. With a real second voice the pet takes a light 1.15 pitch; with
none it falls back to 1.6 pitch / 0.7 rate, because pitch and rate are the
only levers Android leaves and both are honoured everywhere. Still one
adapter, still no audio files: the swap-for-recordings escape hatch above is
untouched.
