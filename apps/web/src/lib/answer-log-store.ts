"use client";

import type { AnswerEvent, AnswerLog, AnswerLogStore, KidId } from "@learn-spanish/core";
import { log as logger } from "@learn-spanish/config";
import { readDoc, writeDoc } from "./economy-store";

/** Never synced, on purpose (ADR 013) — this key is the one place the app
 *  records when a child answered and in which game, and it stays on the
 *  device that recorded it. It is absent from `ProgressSnapshot` by design;
 *  adding it there reopens ADR 004 and ADR 013 together. */
const LOG_KEY = "palabras.answer-log.v1";

function isEvent(value: unknown): value is AnswerEvent {
  const e = value as AnswerEvent;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof e.at === "number" &&
    typeof e.activity === "string" &&
    typeof e.cardId === "string" &&
    typeof e.correct === "boolean"
  );
}

/** On-device answer history; unreadable storage means an empty log, never a
 *  thrown error — the games write through here on every answer. */
export class LocalStorageAnswerLogStore implements AnswerLogStore {
  load(kid: KidId): AnswerLog {
    try {
      const stored = readDoc<AnswerLog>(LOG_KEY)[kid];
      return Array.isArray(stored) ? stored.filter(isEvent) : [];
    } catch (err) {
      logger.warn("answer-log", "log unreadable", { err });
      return [];
    }
  }

  save(kid: KidId, entries: AnswerLog): void {
    try {
      writeDoc(LOG_KEY, kid, entries);
    } catch (err) {
      // Quota or a locked-down browser: the report loses detail, the game
      // does not lose the answer (word stats are saved separately).
      logger.warn("answer-log", "could not persist the log", { err });
    }
  }
}
