"use client";

import type { KidId, TrendHistory, TrendSample, TrendStore } from "@learn-spanish/core";
import { readDoc, writeDoc } from "./economy-store";

const TREND_KEY = "palabras.trend.v1";

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
