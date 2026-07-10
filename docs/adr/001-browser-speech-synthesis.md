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
