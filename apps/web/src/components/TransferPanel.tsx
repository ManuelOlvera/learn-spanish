"use client";

import { useState } from "react";
import { InvalidTransferCodeError } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { exportProgressCode, importProgressCode } from "@/lib/transfer";

interface Props {
  /** Reload album state after a successful import. */
  onImported: () => void;
}

/**
 * Parent-facing one-time device transfer (small text UI is fine here —
 * per the design language, text is for parents). No backend: the code is
 * generated and consumed entirely on-device.
 */
export function TransferPanel({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [exportCode, setExportCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function showExport() {
    setExportCode(await exportProgressCode());
    setCopied(false);
  }

  async function copyExport() {
    if (exportCode === null) {
      return;
    }
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopied(true);
    } catch (err) {
      // Clipboard can be blocked; the code stays selectable for manual copy.
      log.warn("transfer", "clipboard unavailable", { err });
    }
  }

  async function runImport() {
    setMessage(null);
    try {
      const outcome = await importProgressCode(importText);
      setMessage(
        outcome.newStickers > 0
          ? `¡Listo! +${outcome.newStickers} pegatinas nuevas.`
          : "¡Listo! Nada nuevo que añadir.",
      );
      setImportText("");
      onImported();
    } catch (err) {
      if (err instanceof InvalidTransferCodeError) {
        setMessage("Ese código no funciona — cópialo entero e inténtalo otra vez.");
        return;
      }
      throw err;
    }
  }

  if (!open) {
    return (
      <footer className="flex justify-center pb-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-semibold text-ink/50 underline underline-offset-4"
        >
          🔄 ¿Cambiáis de dispositivo? Transferir progreso
        </button>
      </footer>
    );
  }

  return (
    <footer className="flex flex-col gap-4 pb-6">
      <div className="sticker relative flex flex-col gap-4 p-5 text-left">
        <span aria-hidden className="sticker-peel" />
        <h2 className="text-xl font-extrabold">🔄 Transferir progreso</h2>
        <p className="text-sm font-semibold text-ink/60">
          Copia el código en este dispositivo y pégalo en el otro. Es una
          copia única, no una sincronización.
        </p>

        <div className="flex flex-col gap-2">
          {exportCode === null ? (
            <button
              type="button"
              onClick={() => void showExport()}
              className="sticker self-start px-5 py-3 text-lg font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              Crear código
            </button>
          ) : (
            <>
              <textarea
                readOnly
                value={exportCode}
                aria-label="Your transfer code"
                rows={3}
                className="w-full rounded-2xl border-4 border-ink bg-white p-3 font-mono text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={() => void copyExport()}
                className="sticker self-start px-5 py-2 text-base font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                {copied ? "✅ Copiado" : "📋 Copiar"}
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t-4 border-dashed border-ink/20 pt-4">
          <label
            htmlFor="import-code"
            className="text-sm font-extrabold text-ink/70"
          >
            ¿Tienes un código del otro dispositivo?
          </label>
          <textarea
            id="import-code"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="PALABRAS1.…"
            rows={3}
            className="w-full rounded-2xl border-4 border-ink bg-white p-3 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => void runImport()}
            disabled={importText.trim() === ""}
            className="sticker self-start px-5 py-2 text-base font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-40"
          >
            Importar
          </button>
          {message && (
            <p role="status" className="text-sm font-extrabold">
              {message}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
