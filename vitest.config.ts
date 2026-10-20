import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit tests only (Vitest). Playwright is still on the ADR-0006 list.
 *
 * The `@/` alias mirrors tsconfig.json so a test can import the same modules
 * the app imports, and `environment: "node"` keeps the pure functions honest —
 * the read-time, date and taxonomy helpers are the parts worth pinning first.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
