import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * The web layer's test harness. Deliberately jsdom + vitest rather than a
 * browser driver: what needs covering here is the localStorage adapters and
 * the migration registry — logic that `/verify` can only exercise on a healthy
 * device, and whose interesting cases are all unhealthy ones (a quota that
 * refuses writes, a corrupt document, a migration that throws). Component
 * rendering stays with `/verify`, which drives the real built app.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
