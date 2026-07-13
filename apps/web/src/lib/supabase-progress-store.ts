"use client";

import type { ProgressSnapshot, RemoteProgressStore } from "@learn-spanish/core";
import { sanitizeSnapshot } from "@learn-spanish/core";
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
    const res = await fetch(`${this.base}/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
      },
      body: JSON.stringify(body),
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
