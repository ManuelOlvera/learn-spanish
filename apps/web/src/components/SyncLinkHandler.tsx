"use client";

import { useEffect, useState } from "react";
import { parseSyncLink } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { isSyncAvailable, joinWithCode } from "@/lib/sync";

type Stage = "asking" | "working" | "done" | "failed";

/**
 * The receiving half of a scanned pairing QR (ADR 004): a `#sync=` fragment
 * arrives, and this asks the parent before doing anything with it.
 *
 * Three deliberate choices:
 *  - **It confirms.** A link that silently rewires which family's progress a
 *    device shows is the wrong default, and the confirm makes a stray re-scan
 *    harmless.
 *  - **The fragment is stripped immediately**, before the parent answers. The
 *    code is a capability key; it should not sit in the address bar, in a
 *    bookmark, or in history, and a reload must not re-prompt.
 *  - **It reloads on success**, because the merge rewrites the local progress
 *    every open screen has already read.
 *
 * Kids never see it: nothing renders without a valid code in the URL.
 */
export function SyncLinkHandler() {
  const [code, setCode] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("asking");

  useEffect(() => {
    const read = () => {
      const scanned = parseSyncLink(window.location.hash);
      if (scanned === "" || !isSyncAvailable()) {
        return;
      }
      // Drop the key from the URL first — answering the prompt is not what
      // makes it sensitive to leave lying around.
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      setCode(scanned);
      setStage("asking");
    };
    read();
    // Scanning while the app is already open is a same-document hash change,
    // which never remounts this — without the listener that scan silently
    // does nothing. (replaceState above fires no event, so this can't loop.)
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  if (code === null) {
    return null;
  }

  async function connect() {
    if (code === null) {
      return;
    }
    setStage("working");
    try {
      const result = await joinWithCode(code);
      if (result !== "joined") {
        log.warn("sync", "scanned code rejected", { result });
        setStage("failed");
        return;
      }
      setStage("done");
      window.location.reload();
    } catch (err) {
      log.error("sync", "could not join from a scanned link", { err });
      setStage("failed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_65%,transparent)]" />
      <div className="sticker pop-in relative flex w-full max-w-sm flex-col gap-4 p-6 text-left">
        <span aria-hidden className="sticker-peel" />
        <h2 className="text-xl font-extrabold">🔄 ¿Conectar este dispositivo?</h2>
        <p className="text-sm font-semibold text-ink/60">
          Compartirá el progreso — pegatinas, estrellas, rachas y mascotas — con
          los demás dispositivos de este código.
        </p>
        <p className="break-all rounded-2xl border-4 border-ink bg-white p-3 text-center font-mono text-sm">
          {code}
        </p>

        {stage === "failed" && (
          <p role="status" className="text-sm font-extrabold">
            No se pudo conectar. Revisa tu internet y vuelve a escanear el
            código.
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void connect()}
            disabled={stage === "working" || stage === "done"}
            className="sticker px-5 py-3 text-lg font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-40"
            style={{ "--accent": "var(--color-lime)" } as React.CSSProperties}
          >
            {stage === "working" ? "…" : "Sí, conectar"}
          </button>
          <button
            type="button"
            onClick={() => setCode(null)}
            className="text-sm font-semibold text-ink/50 underline underline-offset-4"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
