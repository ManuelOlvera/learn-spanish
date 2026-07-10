"use client";

/**
 * Say-it-back voice recording adapter (see ADR 003). Recordings live only in
 * memory for immediate playback — never persisted, never transmitted. The
 * mic stream is stopped the moment recording ends so the mic indicator
 * always turns off.
 */
import { log } from "@learn-spanish/config";

export function canRecord(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

export interface ActiveRecording {
  /** Stops the mic and resolves with the clip (null if nothing was captured). */
  stop(): Promise<Blob | null>;
}

/** Must be called from a user gesture (the mic permission prompt needs one). */
export async function startRecording(): Promise<ActiveRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };
  recorder.start();

  return {
    stop() {
      return new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          resolve(
            chunks.length > 0
              ? new Blob(chunks, { type: recorder.mimeType })
              : null,
          );
        };
        recorder.stop();
      });
    },
  };
}

/** Plays a clip once; resolves when playback ends. */
export function playClip(clip: Blob): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(clip);
    const audio = new Audio(url);
    const finish = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = finish;
    audio.onerror = () => {
      log.warn("recorder", "clip playback failed");
      finish();
    };
    audio.play().catch((err: unknown) => {
      log.warn("recorder", "clip playback blocked", { err });
      finish();
    });
  });
}
