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

/**
 * Optional cross-device sync config (ADR 004). Both are browser-public
 * (`NEXT_PUBLIC_`), so security rests on the capability-code RPCs and RLS, not
 * on secrecy of the anon key. They are read as explicit member expressions so
 * Next.js can statically inline them into the client bundle; passing the whole
 * `process.env` object (as `env()` does) would defeat that inlining.
 */
const supabaseSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
});

export interface SupabaseConfig {
  readonly url: string;
  readonly anonKey: string;
}

let supabaseCached: SupabaseConfig | null | undefined;

/** The Supabase sync config, or null when unset — in which case the app runs
 *  fully local, exactly as before ADR 004. Malformed (partial) config fails
 *  loudly rather than half-enabling sync. */
export function supabaseConfig(): SupabaseConfig | null {
  if (supabaseCached !== undefined) {
    return supabaseCached;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (
    (url === undefined || url === "") &&
    (anonKey === undefined || anonKey === "")
  ) {
    supabaseCached = null;
    return null;
  }
  supabaseCached = supabaseSchema.parse({ url, anonKey });
  return supabaseCached;
}

/** True when cross-device sync is configured for this deployment. */
export function isSyncEnabled(): boolean {
  return supabaseConfig() !== null;
}
