import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * Security headers (docs/fable-review/security.md #4). The app serves no
 * user-generated HTML and loads nothing from third parties, so the CSP is
 * strict: same-origin everything, except connect-src for the optional Supabase
 * sync (ADR 004 — *.supabase.co rather than an env-injected host keeps this
 * config env-free) and blob: media for say-it-back playback (ADR 003).
 * 'unsafe-inline' is required by Next's inline bootstrap scripts and inline
 * styles (next/font, style attributes) — there is no nonce infrastructure here.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

function securityHeaders(dev: boolean) {
  return [
    // Dev is exempt from CSP only: HMR needs eval and websockets.
    ...(dev ? [] : [{ key: "Content-Security-Policy", value: CSP }]),
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // The mic is the say-it-back recorder (ADR 003); nothing else is used.
    {
      key: "Permissions-Policy",
      value: "microphone=(self), camera=(), geolocation=(), payment=()",
    },
  ];
}

export default function nextConfig(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    transpilePackages: ["@learn-spanish/core", "@learn-spanish/config"],
    async headers() {
      return [{ source: "/(.*)", headers: securityHeaders(dev) }];
    },
  };
}
