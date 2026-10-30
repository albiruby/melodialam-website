import { defineConfig, devices } from "@playwright/test";

/**
 * Browser checks for the parts that only exist after hydration: the Discover
 * filter, the search, and the legacy redirect. The unit tests and the smoke
 * script cover the server output; this covers what a visitor actually clicks.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
