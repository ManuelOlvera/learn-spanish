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

/** Chrome loads voices asynchronously; warm the list so the first tap already has one. */
export function warmUpVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.getVoices();
}
