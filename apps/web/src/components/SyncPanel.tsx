"use client";

import { useState } from "react";
import { log } from "@learn-spanish/config";
import {
  deleteCloudProgress,
  getSyncCode,
  isPaired,
  isSyncAvailable,
  joinWithCode,
  startHosting,
  unpair,
} from "@/lib/sync";

interface Props {
  /** Reload album state after a successful pull/merge. */
  onSynced: () => void;
}

/**
 * Parent-facing cross-device sync (ADR 004). Small text UI is fine here — per
 * the design language, text is for parents; kids never see this. Pairing is a
 * one-time parent action: show this device's code on A, type it once on B.
 */
export function SyncPanel({ onSynced }: Props) {
  const [paired, setPaired] = useState(() => isPaired());
  const [code, setCode] = useState<string | null>(() => getSyncCode());
  const [joinText, setJoinText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Deleting the cloud row is destructive-ish; ask for a second tap.
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync is only offered when a backend is configured for this deployment.
  if (!isSyncAvailable()) {
    return null;
  }

  async function host() {
    setBusy(true);
    setMessage(null);
    try {
      const c = await startHosting();
      setCode(c);
      setPaired(true);
    } catch (err) {
      log.error("sync", "could not start hosting", { err });
      setMessage("No se pudo conectar. Revisa tu internet e inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await joinWithCode(joinText);
      if (result === "malformed") {
        setMessage("Ese código no es válido — cópialo entero e inténtalo otra vez.");
        return;
      }
      if (result === "not-found") {
        setMessage(
          "No encontramos ese código. Crea el código en el otro dispositivo y cópialo tal cual.",
        );
        return;
      }
      setPaired(true);
      setCode(getSyncCode());
      setJoinText("");
      setMessage("¡Conectado! Este dispositivo ya está sincronizado.");
      onSynced();
    } catch (err) {
      log.error("sync", "could not join", { err });
      setMessage("No se pudo conectar. Revisa tu internet e inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  }

  function stop() {
    unpair();
    setPaired(false);
    setCode(null);
    setConfirmDelete(false);
    setMessage("Este dispositivo ya no se sincroniza. Tu progreso sigue aquí.");
  }

  /** Remove the cloud row too (the code is the only authorization), then
   *  unpair. Local progress on every device is untouched. */
  async function deleteCloud() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await deleteCloudProgress();
      setPaired(false);
      setCode(null);
      setMessage(
        "Progreso en la nube borrado. Cada dispositivo conserva lo suyo.",
      );
    } catch (err) {
      log.error("sync", "could not delete cloud progress", { err });
      setMessage("No se pudo borrar. Revisa tu internet e inténtalo otra vez.");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="sticker relative flex flex-col gap-4 p-5 text-left">
      <span aria-hidden className="sticker-peel" />
      <h2 className="text-xl font-extrabold">☁️ Sincronizar entre dispositivos</h2>

      {paired ? (
        <>
          <p className="text-sm font-semibold text-ink/60">
            Sincronizado. El progreso se actualiza al abrir la app y al terminar
            un juego. Usa este mismo código para añadir otro dispositivo.
          </p>
          {code !== null && (
            <textarea
              readOnly
              value={code}
              aria-label="Your sync code"
              rows={2}
              className="w-full rounded-2xl border-4 border-ink bg-white p-3 font-mono text-sm"
              onFocus={(e) => e.currentTarget.select()}
            />
          )}
          <button
            type="button"
            onClick={stop}
            className="self-start text-sm font-semibold text-ink/50 underline underline-offset-4"
          >
            Dejar de sincronizar en este dispositivo
          </button>
          <button
            type="button"
            onClick={() => void deleteCloud()}
            disabled={busy}
            className="self-start text-sm font-semibold text-ink/50 underline underline-offset-4 disabled:opacity-40"
          >
            {confirmDelete
              ? "¿Seguro? Toca otra vez para borrar la nube"
              : "Borrar el progreso en la nube"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-ink/60">
            Conecta este dispositivo para que el progreso esté al día en todos.
            Crea un código aquí y escríbelo en el otro dispositivo — o pega el
            código que ya creaste en otro.
          </p>

          <button
            type="button"
            onClick={() => void host()}
            disabled={busy}
            className="sticker self-start px-5 py-3 text-lg font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-40"
          >
            {busy ? "…" : "Crear código de sincronización"}
          </button>

          <div className="flex flex-col gap-2 border-t-4 border-dashed border-ink/20 pt-4">
            <label htmlFor="join-code" className="text-sm font-extrabold text-ink/70">
              ¿Tienes un código del otro dispositivo?
            </label>
            <textarea
              id="join-code"
              value={joinText}
              onChange={(e) => setJoinText(e.target.value)}
              placeholder="A1B2C-3D4E5-…"
              rows={2}
              className="w-full rounded-2xl border-4 border-ink bg-white p-3 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => void join()}
              disabled={busy || joinText.trim() === ""}
              className="sticker self-start px-5 py-2 text-base font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-40"
            >
              Conectar
            </button>
          </div>
        </>
      )}

      {message && (
        <p role="status" className="text-sm font-extrabold">
          {message}
        </p>
      )}
    </div>
  );
}
