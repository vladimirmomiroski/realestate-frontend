import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "coverage/playwright-results",
  use: {
    baseURL,
    locale: "fr-FR",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node tests/fixtures/public-listings-api.mjs",
      url: "http://localhost:5231/api/listings?lang=mk&pageSize=20",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
      env: {
        API_BASE_URL: "http://localhost:5231",
        MEDIA_BASE_URL: "http://localhost:5231",
        SITE_URL: baseURL,
      },
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
