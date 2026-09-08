"use client";

/**
 * Browser speech-synthesis adapter (see ADR 001). Must be called from a
 * user gesture — mobile browsers block audio otherwise, which is why the
 * card never auto-speaks on load.
 */

/**
 * Who is talking. Habla conmigo puts two speakers in one conversation, and a
 * pre-reader has only the audio to tell them apart: the pet asks, the kid's
 * own sentence answers, the pet replies. Everywhere else there is one voice
 * and callers pass nothing.
 */
export type Speaker = "pet" | "kid";

/**
 * The kid's own line is the practice audio, so it keeps the best voice and a
 * natural pitch — byte-for-byte what every game sounded like before roles
 * existed. The pet moves instead.
 *
 * How far the pet moves depends on what the device gave us, because Android
 * is not macOS here. Chrome on Android does not enumerate voices at all: its
 * `getVoices()` returns one entry per language/region, so `es-ES` is a
 * *locale*, not a choice of speaker, and asking for "the second Spanish
 * voice" gets you the same voice back. The system's real voices (Voice I,
 * Voice II…) are chosen in Android's TTS settings and are invisible to the
 * page. Desktop and iOS do enumerate properly — this Mac lists nine `es-ES`.
 *
 * So: when we genuinely got a second voice, a light pitch lift is enough to
 * separate the speakers without making a real voice sound silly. When we did
 * not, pitch and rate are the only levers left and have to carry it alone —
 * both are honoured everywhere, Android included.
 */
const SPEAKERS: Record<
  Speaker,
  { readonly voiceIndex: number; readonly pitch: number; readonly rate: number }
> = {
  kid: { voiceIndex: 0, pitch: 1, rate: 0.8 },
  pet: { voiceIndex: 1, pitch: 1.15, rate: 0.78 },
};

/** The pet when it has to share the kid's voice: far enough up, and slower,
 *  to read as a different character on one voice alone. */
const PET_SOLO = { pitch: 1.6, rate: 0.7 };

const langOf = (voice: SpeechSynthesisVoice) => voice.lang.replace("_", "-");

/** Spanish voices, best accent first — Castilian, because the content is
 *  Spain Spanish (coche, ordenador…). Sort is stable, so within one accent
 *  the device's own order decides, which is what makes voice 0 the device's
 *  preferred voice. */
function spanishVoices(): readonly SpeechSynthesisVoice[] {
  const preferred = ["es-ES", "es-MX", "es-US"];
  const rank = (voice: SpeechSynthesisVoice) => {
    const index = preferred.indexOf(langOf(voice));
    return index === -1 ? preferred.length : index;
  };
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("es"))
    .sort((a, b) => rank(a) - rank(b));
}

/**
 * The speakers available in the kid's own accent.
 *
 * Same accent is the whole point: a second entry in a *different* locale is
 * not a second speaker on Android — the list there is one entry per
 * language/region, so `es-MX` is the same voice with a different label, and
 * if its pack is missing Chrome falls back to an **English** voice reading
 * Spanish. Restricting to one accent means a device either offers a real
 * second voice (desktop, iOS) or none at all (Android), and the caller can
 * tell which.
 */
function accentVoices(): readonly SpeechSynthesisVoice[] {
  const voices = spanishVoices();
  const primary = voices[0];
  return primary === undefined
    ? []
    : voices.filter((voice) => langOf(voice) === langOf(primary));
}

export function speakSpanish(text: string, speaker?: Speaker): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  const role = SPEAKERS[speaker ?? "kid"];
  const voices = accentVoices();
  // Fewer voices than roles (Android always, some tablets): everyone shares
  // voice 0, and pitch/rate have to do the whole job.
  const sharesKidVoice = role.voiceIndex >= voices.length;
  const voice = voices[Math.min(role.voiceIndex, voices.length - 1)];
  if (voice) {
    utterance.voice = voice;
  }
  const tone = speaker === "pet" && sharesKidVoice ? PET_SOLO : role;
  utterance.pitch = tone.pitch;
  // Slower than default so pre-readers can catch the sounds.
  utterance.rate = tone.rate;
  synth.speak(utterance);
}

/**
 * Whether this device can actually speak the content.
 *
 * ADR 001 accepted that audio "silently degrades to nothing on browsers
 * without an `es` voice", as acceptable for v1. Two things have changed. The
 * 2026-08-25 addendum established what actually happens on an Android without
 * a Spanish pack — Chrome reads the Spanish in an **English** voice, which is
 * worse than the silence the ADR weighed, because *el murciélago* mispronounced
 * is a wrong answer taught confidently. And the app is no longer v1: for a
 * pre-reader, audio is not a feature of it, it is the whole of it.
 *
 * This does not change the adapter (the ADR's decision stands, and the
 * recordings escape hatch is untouched) — it only lets a parent be told.
 */
export type VoiceStatus =
  /** A Spanish voice is available; nothing to say. */
  | "ready"
  /** The device enumerates voices and none of them is Spanish. The only state
   *  worth warning about, because it is the only one we can be sure of. */
  | "missing"
  /** No speech synthesis, or the list never arrived. Deliberately NOT a
   *  warning: a device we could not measure must not be accused. */
  | "unknown";

/**
 * How long to wait for the voice list. Chrome populates it asynchronously and
 * fires `voiceschanged` when it lands; two seconds is far past that on every
 * device tested, and the cost of being wrong is only a hint not shown.
 */
const VOICE_WAIT_MS = 2000;

export function checkSpanishVoice(
  timeoutMs: number = VOICE_WAIT_MS,
): Promise<VoiceStatus> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve("unknown");
  }
  const synth = window.speechSynthesis;
  const classify = (): VoiceStatus => {
    if (spanishVoices().length > 0) {
      return "ready";
    }
    // An empty list means the list has not arrived, not that the device has
    // no voices — only a populated list with no Spanish in it is evidence.
    return synth.getVoices().length > 0 ? "missing" : "unknown";
  };
  const first = classify();
  if (first === "ready") {
    return Promise.resolve(first);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (status: VoiceStatus) => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", onChange);
      clearTimeout(timer);
      resolve(status);
    };
    const onChange = () => {
      const status = classify();
      // Keep waiting while the list is still empty — one more event may bring
      // it. Only a decisive answer ends the wait early.
      if (status !== "unknown") {
        finish(status);
      }
    };
    const timer = setTimeout(() => finish(classify()), timeoutMs);
    synth.addEventListener("voiceschanged", onChange);
  });
}

/** Chrome loads voices asynchronously; warm the list so the first tap already has one. */
export function warmUpVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.getVoices();
}
