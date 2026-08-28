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
 * Storage: the cache is capped at MAX_ENTRIES and trimmed oldest-first, so
 * assets left behind by past deploys cannot grow without bound.
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

/* Storage ceiling. Hashed asset URLs are immutable, so a redeploy mints a new
 * set and the previous one is never requested again — dead weight that would
 * otherwise accumulate one full set per deploy, forever, on a device a family
 * keeps installed for months. (Route visits and story art are self-limiting:
 * both are finite corpora. Deploys are the unbounded axis.)
 *
 * Deliberately NOT fixed by versioning CACHE per build. That empties the cache
 * on every deploy, and the offline launch is this app's whole point (ADR 005):
 * ship on Friday and a family driving on Saturday arrives with only the shell.
 * A cap keeps what was used recently and drops the oldest instead.
 *
 * cache.keys() resolves in insertion order, so "oldest" needs no bookkeeping —
 * FIFO, no timestamps, no IndexedDB alongside. Sized for roughly two full app
 * versions including all story art. */
const MAX_ENTRIES = 400;

/* A trim walks every key, so amortize it instead of paying on each request. */
const TRIM_EVERY = 25;
let writesSinceTrim = 0;

async function trimCache() {
  const cache = await caches.open(CACHE);
  const keys = await cache.keys();
  let excess = keys.length - MAX_ENTRIES;
  for (const key of keys) {
    if (excess <= 0) {
      break;
    }
    /* Never evict the shell: it is what makes a cold offline launch work, and
     * install only re-adds it when the worker itself updates. */
    if (SHELL.includes(new URL(key.url).pathname)) {
      continue;
    }
    void cache.delete(key);
    excess -= 1;
  }
}

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
      .then(() => trimCache())
      .then(() => self.clients.claim()),
  );
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok) {
    const copy = response.clone();
    const cache = await caches.open(CACHE);
    /* Fire-and-forget on purpose: the response must not wait on storage. */
    void cache.put(request, copy);
    writesSinceTrim += 1;
    if (writesSinceTrim >= TRIM_EVERY) {
      writesSinceTrim = 0;
      void trimCache();
    }
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
