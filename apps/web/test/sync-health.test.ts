import { beforeEach, describe, expect, it, vi } from "vitest";
import { SnapshotTooLargeError } from "@learn-spanish/core";
import { installFakeStorage, type FakeStorage } from "./storage";

/**
 * Whether the parent is told that sync stopped working.
 *
 * Sync is best-effort by design (ADR 004) and a failed exchange is only
 * logged, so before this a device whose every push failed looked exactly like
 * one that worked. These pin what the panel is entitled to say.
 */

async function fresh() {
  vi.resetModules();
  return await import("@/lib/sync-health");
}

const HOUR = 3_600_000;
const NOW = Date.parse("2026-09-08T19:00:00Z");

let fake: FakeStorage;
beforeEach(() => {
  fake = installFakeStorage();
});

describe("recording an exchange", () => {
  it("keeps the last success", async () => {
    const { getSyncHealth, noteSyncOk } = await fresh();
    noteSyncOk(NOW);
    expect(getSyncHealth()).toEqual({ okAt: NOW });
  });

  it("clears a standing failure once an exchange gets through", async () => {
    // The record is the CURRENT state, not a history — a device that came
    // back must stop warning about the outage it recovered from.
    const { getSyncHealth, noteSyncOk, noteSyncFailed } = await fresh();
    noteSyncFailed(new Error("offline"), NOW);
    noteSyncOk(NOW + HOUR);
    expect(getSyncHealth().failAt).toBeUndefined();
  });

  it("keeps the last success time through a failure, so the panel can date it", async () => {
    const { getSyncHealth, noteSyncOk, noteSyncFailed } = await fresh();
    noteSyncOk(NOW);
    noteSyncFailed(new Error("offline"), NOW + HOUR);
    expect(getSyncHealth()).toEqual({
      okAt: NOW,
      failAt: NOW + HOUR,
      reason: "network",
    });
  });

  it("names the oversized snapshot apart from a bad network", async () => {
    const { getSyncHealth, noteSyncFailed } = await fresh();
    noteSyncFailed(new SnapshotTooLargeError(), NOW);
    expect(getSyncHealth().reason).toBe("too-big");
  });

  it("treats an unreadable record as no record, never as a failure", async () => {
    const { getSyncHealth } = await fresh();
    fake.data.set("palabras.sync-health.v1", "{not json");
    expect(getSyncHealth()).toEqual({});
  });
});

describe("syncNote", () => {
  it("says nothing when a device is paired but has not exchanged yet", async () => {
    const { syncNote } = await fresh();
    expect(syncNote({}, NOW)).toBeNull();
  });

  it("is quiet about a device that synced recently", async () => {
    const { syncNote } = await fresh();
    expect(syncNote({ okAt: NOW - HOUR }, NOW)).toMatchObject({
      tone: "ok",
      kind: "fresh",
    });
  });

  it("warns once a paired device has been silent for a day", async () => {
    // Sync runs on app open and every game completion, so a device in daily
    // use touches the server many times a day. A full day of silence is a
    // fact worth showing even when no exchange has actually errored.
    const { syncNote, STALE_SYNC_HOURS } = await fresh();
    expect(syncNote({ okAt: NOW - (STALE_SYNC_HOURS + 1) * HOUR }, NOW)).toMatchObject({
      tone: "warn",
      kind: "stale",
    });
  });

  it("reports a failure against the last success, not the failure itself", async () => {
    const { syncNote } = await fresh();
    const note = syncNote(
      { okAt: NOW - 50 * HOUR, failAt: NOW - HOUR, reason: "network" },
      NOW,
    );
    expect(note).toMatchObject({ tone: "warn", kind: "failing" });
    // "failing since Tuesday" is the useful number, not "failed an hour ago".
    expect(note?.age).toBe(50 * HOUR);
  });

  it("distinguishes a device that has never once connected", async () => {
    const { syncNote } = await fresh();
    expect(syncNote({ failAt: NOW, reason: "network" }, NOW)).toMatchObject({
      kind: "never-connected",
    });
  });

  it("escalates the oversized snapshot above every other failure", async () => {
    // The one failure that never clears on its own: the family outgrew the
    // server's per-row cap, so every push from here fails identically and
    // "check your wifi" is actively misleading.
    const { syncNote } = await fresh();
    expect(syncNote({ okAt: NOW - HOUR, failAt: NOW, reason: "too-big" }, NOW)).toEqual({
      tone: "bad",
      kind: "too-big",
    });
  });

  it("stops warning about an old failure once a later success lands", async () => {
    const { syncNote } = await fresh();
    expect(
      syncNote({ okAt: NOW, failAt: NOW - HOUR, reason: "too-big" }, NOW),
    ).toMatchObject({ tone: "ok" });
  });
});
