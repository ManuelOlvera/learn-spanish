"use client";

import { useEffect, useState } from "react";
import { log } from "@learn-spanish/config";

/**
 * The route error boundary — what a kid sees instead of Next's default
 * English "Application error" dead-end (which is what a parent screenshotted
 * on 2026-07-14 when a stale session hit a fresh deploy's chunks).
 *
 * First occurrence auto-reloads once: a reload fetches HTML and chunks from
 * the same deployment, which heals every deploy-skew failure invisibly. If
 * the error survives the reload it's a real bug — show a picture-only
 * recovery screen (the audience can't read).
 */
const RELOADED_FLAG = "palabras.error-reloaded";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showScreen, setShowScreen] = useState(false);

  useEffect(() => {
    log.error("boundary", "client exception reached the error boundary", {
      err: error,
      digest: error.digest,
    });
    try {
      if (window.sessionStorage.getItem(RELOADED_FLAG) === null) {
        window.sessionStorage.setItem(RELOADED_FLAG, "1");
        window.location.reload();
        return;
      }
    } catch {
      // Storage unavailable — fall through to the manual screen.
    }
    setShowScreen(true);
  }, [error]);

  // Blank during the auto-reload attempt; the flash is shorter than any text.
  if (!showScreen) {
    return <main className="min-h-dvh" aria-hidden />;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 p-6 text-center">
      <span aria-hidden className="text-8xl">
        🙈
      </span>
      <p className="text-2xl font-extrabold text-ink/70">¡Uy!</p>
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => {
            try {
              window.sessionStorage.removeItem(RELOADED_FLAG);
            } catch {
              // best-effort
            }
            reset();
          }}
          aria-label="Try again"
          className="sticker flex h-24 w-24 items-center justify-center rounded-3xl text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🔄
        </button>
        <a
          href="/"
          aria-label="Back home"
          className="sticker flex h-24 w-24 items-center justify-center rounded-3xl text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </a>
      </div>
    </main>
  );
}
