"use client";

import {
  DeleteProgressUseCase,
  generatePairingCode,
  isPairingCode,
  mergeProgress,
  normalizePairingCode,
  PullProgressUseCase,
  PushProgressUseCase,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { remoteProgress } from "./client-container";
import { applySnapshot, currentSnapshot } from "./transfer";

/**
 * Cross-device sync orchestration (ADR 004). Local-first: reads stay on
 * localStorage; this layer pulls on app open and pushes on game complete, both
 * best-effort. The pairing code is the capability key and lives on-device here.
 */
const SYNC_KEY = "palabras.sync.v1";

// Wired in the client container; null keeps the whole app local (pre-ADR-004).
const remote = remoteProgress;

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
 *  with its progress. Returns the code for the parent to enter on device B.
 *  The code is persisted only after the seed push succeeds — a network failure
 *  must not leave the device "paired" to a row that was never created. */
export async function startHosting(): Promise<string> {
  if (remote === null) {
    throw new Error("sync not configured");
  }
  const code = getSyncCode() ?? generatePairingCode(cryptoByteSource());
  await new PushProgressUseCase(remote).execute(code, await currentSnapshot());
  setSyncCode(code);
  return code;
}

export type JoinResult = "joined" | "malformed" | "not-found";

/** Join an existing pairing: validate the code, require its cloud row to
 *  exist, merge the cloud state in, push the union back so the host also gains
 *  anything unique to this device, and only then store the code. Requiring an
 *  existing row means a mistyped-but-well-formed code can't silently create a
 *  fresh row and fork the family's progress; persisting the code last means a
 *  failed round-trip can't leave the device paired to an unverified code (the
 *  thrown network error reaches the caller either way). */
export async function joinWithCode(input: string): Promise<JoinResult> {
  if (remote === null) {
    throw new Error("sync not configured");
  }
  const code = normalizePairingCode(input);
  if (code === "") {
    return "malformed";
  }
  const cloud = await remote.load(code);
  if (cloud === null) {
    return "not-found";
  }
  const merged = mergeProgress(await currentSnapshot(), cloud);
  await applySnapshot(merged);
  await new PushProgressUseCase(remote).execute(code, merged);
  setSyncCode(code);
  return "joined";
}

/** Delete this pairing's cloud row, then unpair this device. Other devices
 *  keep their local progress (and would re-create the row on their next push
 *  unless they also unpair). Throws on network failure — the caller shows the
 *  error and nothing is unpaired, so the action is all-or-nothing. */
export async function deleteCloudProgress(): Promise<void> {
  const code = getSyncCode();
  if (remote === null || code === null) {
    return;
  }
  await new DeleteProgressUseCase(remote).execute(code);
  unpair();
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
