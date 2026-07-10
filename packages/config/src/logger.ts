/**
 * Leveled JSON logger — one line per event to stdout/stderr (12-factor).
 * This module is the only permitted caller of `console.*` in the repo.
 *
 * Raw upstream error messages may be logged here (server-side) but must
 * never be returned to clients — surface a typed, user-safe error instead.
 */
type Level = "error" | "warn" | "info" | "debug";

type Fields = Record<string, unknown>;

function serializeError(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

function emit(level: Level, tag: string, msg: string, fields?: Fields): void {
  const line = JSON.stringify({
    level,
    tag,
    msg,
    ...(fields
      ? Object.fromEntries(
          Object.entries(fields).map(([k, v]) => [k, serializeError(v)]),
        )
      : {}),
    time: new Date().toISOString(),
  });
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const log = {
  error: (tag: string, msg: string, fields?: Fields) =>
    emit("error", tag, msg, fields),
  warn: (tag: string, msg: string, fields?: Fields) =>
    emit("warn", tag, msg, fields),
  info: (tag: string, msg: string, fields?: Fields) =>
    emit("info", tag, msg, fields),
  debug: (tag: string, msg: string, fields?: Fields) =>
    emit("debug", tag, msg, fields),
};
