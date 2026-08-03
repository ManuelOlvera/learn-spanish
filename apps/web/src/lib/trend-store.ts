"use client";

import type { KidId, TrendHistory, TrendSample, TrendStore } from "@learn-spanish/core";
import { readDoc, writeDoc } from "./economy-store";

/**
 * v2, and the v1 samples are deliberately left behind rather than migrated.
 *
 * A sample stores only a *count*, computed under whatever "learned" meant at
 * the time. Raising that bar (`LEARNED_MIN_RIGHT`) makes every v1 count mean
 * something else, and the raw tallies to recompute them from were never kept —
 * so drawing old and new bars in one chart would compare two different
 * measures and show a cliff that no kid ever experienced. The series restarts
 * instead; the v1 key stays readable for an older client, per the migration
 * rules in `storage-migrations.ts`.
 */
const TREND_KEY = "palabras.trend.v2";

function isSample(value: unknown): value is TrendSample {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TrendSample).week === "string" &&
    typeof (value as TrendSample).learned === "number" &&
    (value as TrendSample).learned >= 0
  );
}

/** localStorage adapter for the parent report's weekly trend samples. */
export class LocalStorageTrendStore implements TrendStore {
  load(kid: KidId): TrendHistory {
    const stored = readDoc<TrendHistory>(TREND_KEY)[kid];
    return Array.isArray(stored) ? stored.filter(isSample) : [];
  }
  save(kid: KidId, history: TrendHistory): void {
    writeDoc(TREND_KEY, kid, history);
  }
}
