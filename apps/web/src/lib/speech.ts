"use client";

/**
 * Browser speech-synthesis adapter (see ADR 001). Must be called from a
 * user gesture — mobile browsers block audio otherwise, which is why the
 * card never auto-speaks on load.
 */
function pickSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const preferred = ["es-MX", "es-US", "es-ES"];
  for (const lang of preferred) {
    const match = voices.find((v) => v.lang.replace("_", "-") === lang);
    if (match) return match;
  }
  return voices.find((v) => v.lang.toLowerCase().startsWith("es")) ?? null;
}

export function speakSpanish(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  const voice = pickSpanishVoice();
  if (voice) {
    utterance.voice = voice;
  }
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
