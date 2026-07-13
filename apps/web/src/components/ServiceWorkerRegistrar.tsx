"use client";

import { useEffect } from "react";
import { isProductionBuild, log } from "@learn-spanish/config";

/** Registers the offline service worker (ADR 005). Production builds only —
 *  in dev a caching worker fights HMR and serves stale modules. Renders
 *  nothing; it exists to run once per page load. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!isProductionBuild() || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((err: unknown) => {
      // Offline support degrades to plain online-only — never user-fatal.
      log.warn("sw", "service worker registration failed", { err });
    });
  }, []);
  return null;
}
