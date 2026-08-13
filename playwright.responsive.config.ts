import { defineConfig, devices } from "@playwright/test";

const port = 3000;
const baseURL = `http://127.0.0.1:${port}`;

/**
 * The default E2E suite intentionally boots an empty catalogue. Responsive
 * hero coverage needs the real showcase product, so it owns a small isolated
 * config instead of weakening the empty-state tests.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "hero-responsive.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      CATALOG_BACKEND: "local-json",
      CATALOG_LOCAL_PATH: "data/showcase-catalog.json",
      COMMERCE_ENABLED: "false",
      DATABASE_URL: "",
      DEPLOYMENT_MODE: "catalog",
      E2E_TEST: "1",
      NEXT_PUBLIC_SITE_URL: baseURL,
      SQLITE_PATH: "",
    },
  },
});
