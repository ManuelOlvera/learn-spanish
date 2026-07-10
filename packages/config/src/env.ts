import { z } from "zod";

/**
 * The only module in the repo allowed to read `process.env`.
 * Every variable the app needs is declared here and zod-validated once,
 * at first access — a missing or malformed value fails loudly at boot,
 * not deep inside a request.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}

export function isProduction(): boolean {
  return env().NODE_ENV === "production";
}

export function isTest(): boolean {
  return env().NODE_ENV === "test";
}

export function isDevelopment(): boolean {
  return env().NODE_ENV === "development";
}
