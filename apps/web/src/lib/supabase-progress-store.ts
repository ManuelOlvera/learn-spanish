"use client";

import type { ProgressSnapshot, RemoteProgressStore } from "@learn-spanish/core";
import { isTimeoutError, sanitizeSnapshot, SyncTimeoutError } from "@learn-spanish/core";
import { supabaseConfig, log } from "@learn-spanish/config";

/**
 * Supabase-backed remote store (ADR 004), talking to two capability RPCs over
 * plain `fetch` — no SDK, so the bundle stays small and offline-first. Access
 * is gated entirely by the pairing code passed to each RPC; the anon key is
 * public by design (RLS denies direct table access, the RPCs require the code).
 *
 *   get_progress(p_code text) -> jsonb            (null when no row)
 *   put_progress(p_code text, p_snapshot jsonb)   (upsert; rejects malformed
 *                                                  codes and rows over 64 KB)
 *   delete_progress(p_code text)                  (remove the row)
 *
 * See docs/runbooks.md for the SQL migrations.
 */

/** The RPC caps rows at 64 KB on write; anything bigger in a response is not
 *  ours and gets dropped before JSON.parse can balloon it into memory. */
const MAX_RESPONSE_BYTES = 256 * 1024;

/**
 * Every request is bounded. Sync operations are serialized per device
 * (`lib/sync.ts`) and every one of them is best-effort background work, so a
 * request that never settles is not one slow pull — it silently ends sync for
 * the life of the tab, with nothing on screen to say so. A captive portal or a
 * dead cell edge is exactly that shape. Generous enough for a slow phone on a
 * weak connection, short enough that a stall costs one exchange instead of a
 * session; the next pull retries.
 */
const TIMEOUT_MS = 10_000;

export class SupabaseProgressStore implements RemoteProgressStore {
  private readonly base: string;
  private readonly anonKey: string;

  private constructor(url: string, anonKey: string) {
    this.base = `${url.replace(/\/$/, "")}/rest/v1/rpc`;
    this.anonKey = anonKey;
  }

  /** Null when sync is not configured for this deployment — callers no-op. */
  static fromEnv(): SupabaseProgressStore | null {
    const config = supabaseConfig();
    return config === null
      ? null
      : new SupabaseProgressStore(config.url, config.anonKey);
  }

  private async rpc(fn: string, body: unknown): Promise<unknown> {
    try {
      return await this.send(fn, body);
    } catch (err) {
      // A stall and an offline device both reject here; only the stall is
      // worth naming, so the sync log can tell "no network" from "wedged".
      throw isTimeoutError(err) ? new SyncTimeoutError(fn, TIMEOUT_MS) : err;
    }
  }

  private async send(fn: string, body: unknown): Promise<unknown> {
    const res = await fetch(`${this.base}/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
      },
      body: JSON.stringify(body),
      // Covers the body read as well, not just time-to-headers.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`supabase rpc ${fn} failed: ${res.status}`);
    }
    if (res.status === 204) {
      return null;
    }
    const text = await res.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      throw new Error(`supabase rpc ${fn} returned an oversized payload`);
    }
    return JSON.parse(text) as unknown;
  }

  async load(code: string): Promise<ProgressSnapshot | null> {
    const raw = await this.rpc("get_progress", { p_code: code });
    if (raw === null || typeof raw !== "object") {
      return null;
    }
    // Trust boundary: a remote row is as untrusted as a pasted code, so it
    // passes through the same sanitizer before it can reach mergeProgress.
    return sanitizeSnapshot(raw);
  }

  async save(code: string, snapshot: ProgressSnapshot): Promise<void> {
    await this.rpc("put_progress", { p_code: code, p_snapshot: snapshot });
    log.info("sync", "pushed snapshot", { stickers: snapshot.stickers.length });
  }

  async delete(code: string): Promise<void> {
    await this.rpc("delete_progress", { p_code: code });
    log.info("sync", "deleted cloud row");
  }
}
