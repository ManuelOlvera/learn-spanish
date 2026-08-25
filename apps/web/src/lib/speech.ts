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
 * existed. The pet takes the second voice and a lower pitch.
 *
 * The pitch offset is the load-bearing half: every device supports it, while
 * a second distinct `es-*` voice is a bonus a phone or tablet may not have
 * (this Mac lists nine, an iPad may list one). On a one-voice device the two
 * speakers still differ, just by pitch alone.
 */
const SPEAKERS: Record<Speaker, { readonly voiceIndex: number; readonly pitch: number }> = {
  kid: { voiceIndex: 0, pitch: 1 },
  pet: { voiceIndex: 1, pitch: 0.8 },
};

/** Spanish voices, best accent first — Castilian, because the content is
 *  Spain Spanish (coche, ordenador…). Sort is stable, so within one accent
 *  the device's own order decides, which is what makes voice 0 the device's
 *  preferred voice. */
function spanishVoices(): readonly SpeechSynthesisVoice[] {
  const preferred = ["es-ES", "es-MX", "es-US"];
  const rank = (voice: SpeechSynthesisVoice) => {
    const index = preferred.indexOf(voice.lang.replace("_", "-"));
    return index === -1 ? preferred.length : index;
  };
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("es"))
    .sort((a, b) => rank(a) - rank(b));
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
  const voices = spanishVoices();
  // Fewer voices than roles: everyone shares voice 0 and pitch does the work.
  const voice = voices[Math.min(role.voiceIndex, voices.length - 1)];
  if (voice) {
    utterance.voice = voice;
  }
  utterance.pitch = role.pitch;
  // Slower than default so pre-readers can catch the sounds.
  utterance.rate = 0.8;
  synth.speak(utterance);
}

/** Chrome loads voices asynchronously; warm the list so the first tap already has one. */
export function warmUpVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.getVoices();
}
