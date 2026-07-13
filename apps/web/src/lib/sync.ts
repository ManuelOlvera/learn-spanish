"use client";

import {
  generatePairingCode,
  isPairingCode,
  normalizePairingCode,
  PullProgressUseCase,
  PushProgressUseCase,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { SupabaseProgressStore } from "./supabase-progress-store";
import { applySnapshot, currentSnapshot } from "./transfer";

/**
 * Cross-device sync orchestration (ADR 004). Local-first: reads stay on
 * localStorage; this layer pulls on app open and pushes on game complete, both
 * best-effort. The pairing code is the capability key and lives on-device here.
 */
const SYNC_KEY = "palabras.sync.v1";

// Configured once from env; null keeps the whole app local (pre-ADR-004).
const remote = SupabaseProgressStore.fromEnv();

/** True only when a sync backend is configured for this deployment. */
export function isSyncAvailable(): boolean {
  return remote !== null;
}

/** This device's pairing code, or null when unpaired. */
export function getSyncCode(): string | null {
  try {
    const raw = window.localStorage.getItem(SYNC_KEY);
    return raw !== null && isPairingCode(raw) ? normalizePairingCode(raw) : null;
  } catch (err) {
    log.warn("sync", "pairing code unreadable", { err });
    return null;
  }
}

export function isPaired(): boolean {
  return getSyncCode() !== null;
}

function setSyncCode(code: string): void {
  window.localStorage.setItem(SYNC_KEY, code);
}

/** Stop syncing this device. Progress already on-device is untouched; the
 *  cloud row and other devices are left as they are. */
export function unpair(): void {
  try {
    window.localStorage.removeItem(SYNC_KEY);
  } catch (err) {
    log.warn("sync", "could not clear pairing code", { err });
  }
}

/** One cryptographically-random byte per call — the entropy behind a code. */
function cryptoByteSource(): () => number {
  return () => {
    const buf = new Uint8Array(1);
    crypto.getRandomValues(buf);
    return buf[0]!;
  };
}

/** Start hosting: mint (or reuse) this device's code and seed the cloud row
 *  with its progress. Returns the code for the parent to enter on device B. */
export async function startHosting(): Promise<string> {
  if (remote === null) {
    throw new Error("sync not configured");
  }
  const code = getSyncCode() ?? generatePairingCode(cryptoByteSource());
  setSyncCode(code);
  await new PushProgressUseCase(remote).execute(code, await currentSnapshot());
  return code;
}

/** Join an existing pairing: validate the code, store it, pull + merge the
 *  cloud state in, then push the union back so the host also gains anything
 *  unique to this device. Returns false when the code is malformed. */
export async function joinWithCode(input: string): Promise<boolean> {
  if (remote === null) {
    throw new Error("sync not configured");
  }
  const code = normalizePairingCode(input);
  if (code === "") {
    return false;
  }
  setSyncCode(code);
  const pull = new PullProgressUseCase(remote);
  const merged = await pull.execute(code, await currentSnapshot());
  await applySnapshot(merged);
  await new PushProgressUseCase(remote).execute(code, merged);
  return true;
}

/** Pull latest on app open and merge it in. No-op when unpaired or sync is off;
 *  best-effort, so a network failure leaves local state untouched. Returns true
 *  when something was applied (the caller can refresh its view). */
export async function syncPull(): Promise<boolean> {
  const code = getSyncCode();
  if (remote === null || code === null) {
    return false;
  }
  try {
    const merged = await new PullProgressUseCase(remote).execute(
      code,
      await currentSnapshot(),
    );
    await applySnapshot(merged);
    return true;
  } catch (err) {
    log.warn("sync", "pull failed; staying on local state", { err });
    return false;
  }
}

/** Push this device's progress on game complete. No-op when unpaired or sync is
 *  off; best-effort, so a failed push simply retries on the next app open. */
export async function syncPush(): Promise<void> {
  const code = getSyncCode();
  if (remote === null || code === null) {
    return;
  }
  try {
    await new PushProgressUseCase(remote).execute(code, await currentSnapshot());
  } catch (err) {
    log.warn("sync", "push failed; will retry on next open", { err });
  }
}
