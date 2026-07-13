/*
 * Offline service worker (ADR 005) — hand-rolled, no build plugin.
 *
 * Strategy:
 *  - Navigations (HTML): network-first, so a deploy is picked up on the next
 *    online load; offline falls back to the last-seen copy of that page, then
 *    to the cached home shell.
 *  - Same-origin subresources (Next's hashed /_next/static, fonts, icons):
 *    cache-first — the hashed URLs are immutable, and fresh HTML references
 *    fresh hashes, so nothing stale is ever *served to* a fresh page.
 *  - Cross-origin (the optional Supabase sync) and non-GET: untouched. Sync
 *    RPCs are POSTs and must never be cached.
 *
 * Update semantics: skipWaiting + clients.claim — a new worker takes over on
 * the next load. Bump CACHE to invalidate everything (needed only if a
 * stable-URL shell asset like the icon changes shape).
 */
const CACHE = "palabras-v1";

/* Stable-URL shell, precached so the very first offline launch still boots.
 * Hashed assets can't be listed here (no build manifest) and don't need to
 * be — they're cached on first use below. */
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg", "/icon-maskable.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok) {
    const copy = response.clone();
    const cache = await caches.open(CACHE);
    void cache.put(request, copy);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetchAndCache(request).catch(
        async () =>
          (await caches.match(request)) ??
          (await caches.match("/")) ??
          Response.error(),
      ),
    );
    return;
  }

  event.respondWith(
    caches
      .match(request)
      .then((cached) => cached ?? fetchAndCache(request))
      .catch(() => Response.error()),
  );
});
