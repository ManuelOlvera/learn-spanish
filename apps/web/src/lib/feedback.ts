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

/** The chest bursting open. The biggest sound the app makes: a low thump you
 *  feel, the lid's noise burst, then a bright major arpeggio over the top.
 *  Paired with the longest haptic pattern — this is the payoff moment. */
export function feedbackChestOpen(): void {
  tone(70, 0.28, 0, "triangle", 0.2);
  noiseBurst(0.3, 0.16, 5200, 400);
  [659, 831, 988, 1319].forEach((f, i) => tone(f, 0.22, 0.06 + i * 0.05));
  tone(1976, 0.5, 0.3, "sine", 0.07);
  vibrate([50, 40, 30, 40, 90]);
}

/** One step of the star counter ticking up. Deliberately tiny and dry: it fires
 *  many times a second, so anything with a tail would smear into noise. Pitch
 *  climbs with progress (0–1) so the count *sounds* like it is rising. */
export function feedbackTick(progress: number): void {
  tone(880 * Math.pow(1.5, Math.min(1, Math.max(0, progress))), 0.045, 0, "square", 0.045);
}

/** A bonus chip landing (¡Perfecto!, Racha, first time). Each one is a step up
 *  the scale, so three chips in a row read as a rising phrase rather than three
 *  identical pops. */
export function feedbackChip(index: number): void {
  const base = 784 * Math.pow(1.122, Math.min(index, 4));
  tone(base, 0.09, 0);
  tone(base * 2, 0.14, 0.05, "sine", 0.06);
  vibrate([18, 22, 26]);
}

/* ── Los exámenes ──────────────────────────────────────────────────────────
 * The ceremony was silent until 2026-09-20: the app's most elaborate moment
 * had none of the beat-by-beat audio that makes the chest feel good. These
 * are its four beats. ADR 021 says passing must beat opening any chest, so
 * `feedbackTriumph` is deliberately the biggest thing in this file — louder,
 * longer and lower-rooted than `feedbackChestOpen`.
 */

/** The grade stamping down. Short, hard and dry — a rubber stamp, not a
 *  chime; the celebration proper is the next beat. */
export function feedbackStamp(): void {
  tone(160, 0.1, 0, "triangle", 0.18);
  noiseBurst(0.07, 0.12, 2200, 600);
  vibrate(45);
}

/** The trophy arriving — the biggest sound the app makes. A low root you feel,
 *  a rising major triad over it, and a held octave on top. */
export function feedbackTriumph(): void {
  tone(65, 0.5, 0, "triangle", 0.2);
  noiseBurst(0.35, 0.18, 6000, 500);
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, 0.05 + i * 0.07));
  tone(1568, 0.7, 0.42, "sine", 0.08);
  vibrate([60, 40, 40, 40, 60, 40, 110]);
}

/** One shelf lighting up in the súper's sweep. Climbs across the whole route
 *  rather than capping early, so twelve of them read as one rising run to the
 *  top rather than a flat rattle. */
export function feedbackShelfLight(index: number, total: number): void {
  const step = total <= 1 ? 1 : index / (total - 1);
  tone(440 * Math.pow(2, step), 0.07, 0, "sine", 0.075);
  vibrate(12);
}

/** The padlock breaking off the next shelf — the payoff beat. A snap, then
 *  the door swinging open under it. */
export function feedbackUnlock(): void {
  noiseBurst(0.06, 0.2, 5000, 900);
  tone(110, 0.3, 0.05, "triangle", 0.16);
  [784, 1047].forEach((f, i) => tone(f, 0.3, 0.12 + i * 0.09));
  vibrate([70, 30, 50]);
}

/** A collection filled — bronze, then silver, then gold. The same phrase each
 *  time, pitched a step higher per tier, so levelling one up *sounds* like a
 *  promotion rather than a repeat. */
export function feedbackMedal(step: 0 | 1 | 2): void {
  const base = 659 * Math.pow(1.122, step);
  [base, base * 1.26, base * 1.5].forEach((f, i) => tone(f, 0.2, i * 0.09));
  tone(base * 2, 0.45, 0.3, "sine", 0.07);
  vibrate([40, 30, 40, 30, 70]);
}
