"use client";

/**
 * Contextual game feel: synthesized sounds (Web Audio — no assets, works
 * offline) plus haptics where the platform has them. Every entry point is
 * a no-op on unsupported browsers; feedback must never break play.
 */
let context: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (typeof window === "undefined" || !("AudioContext" in window)) {
      return null;
    }
    context ??= new AudioContext();
    if (context.state === "suspended") {
      void context.resume();
    }
    return context;
  } catch {
    return null;
  }
}

function tone(
  frequency: number,
  duration: number,
  delay = 0,
  type: OscillatorType = "sine",
  volume = 0.1,
): void {
  const ctx = audio();
  if (ctx === null) {
    return;
  }
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

/**
 * A burst of white noise swept through a band-pass filter. Air and bursts
 * aren't tones — a balloon can't be built out of `tone()` — and noise is the
 * cheapest way to get them without shipping audio files (ADR 001's reasoning,
 * applied to game feel).
 */
function noiseBurst(
  duration: number,
  volume: number,
  fromHz: number,
  toHz: number,
  delay = 0,
): void {
  const ctx = audio();
  if (ctx === null) {
    return;
  }
  const start = ctx.currentTime + delay;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    samples[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(fromHz, start);
  filter.frequency.exponentialRampToValueAtTime(toHz, start + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(start);
  source.stop(start + duration);
}

function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // haptics are decoration
  }
}

/** Correct answer — pitch climbs with the combo so streaks *sound* hot. */
export function feedbackCorrect(combo: number): void {
  const base = 523 * Math.pow(1.059, Math.min(combo, 9));
  tone(base, 0.1);
  tone(base * 1.5, 0.14, 0.09);
  vibrate(15);
}

/** Wrong answer — soft and low, never punishing. */
export function feedbackWrong(): void {
  tone(196, 0.2, 0, "triangle", 0.08);
  vibrate([25, 40, 25]);
}

/** Memory/connect pair locked in. */
export function feedbackMatch(): void {
  tone(659, 0.09);
  tone(880, 0.16, 0.08);
  vibrate(20);
}

/** ⚡ combo milestone — a quick rising arpeggio. */
export function feedbackRacha(): void {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, i * 0.07));
  vibrate([20, 30, 20, 30, 40]);
}

/** ¡Muy bien! fanfare. */
export function feedbackFanfare(): void {
  [523, 523, 659, 784].forEach((f, i) => tone(f, 0.16, i * 0.12));
  tone(1047, 0.4, 0.48);
  vibrate([30, 50, 30, 50, 60]);
}

/** New sticker chime. */
export function feedbackSticker(): void {
  tone(1319, 0.12, 0);
  tone(1568, 0.22, 0.1);
}

/** El globo filling at the start of a round — air rising in pitch. */
export function feedbackInflate(): void {
  noiseBurst(0.5, 0.05, 260, 1500);
  vibrate(12);
}

/** One breath escaping: a wrong letter, or a tip bought. Airy, not punishing
 *  — the balloon is deflating, nobody is being told off. */
export function feedbackAirOut(): void {
  noiseBurst(0.22, 0.08, 1700, 480);
  vibrate([18, 26]);
}

/** ¡Pop! The burst, plus a low thump under it so it lands in the body. */
export function feedbackPop(): void {
  noiseBurst(0.09, 0.22, 3800, 300);
  tone(94, 0.14, 0, "triangle", 0.16);
  vibrate([40, 30, 60]);
}
