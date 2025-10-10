// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: isCI ? 2 : 0,
  forbidOnly: isCI,
  reporter: isCI ? [["list"]] : [["list"], ["html", { outputFolder: "playwright-report" }]],

  use: {
    baseURL,
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // 1) Auth setup runs first, saves session to storageState.json
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { storageState: undefined },
    },
    // 2) Actual tests run with the saved session
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },
  ],

  // If E2E_BASE_URL is provided (e.g., CI hitting a deployed URL), don't start a local server.
  // Otherwise, run the app locally on port 3000 for tests.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        port: 3000,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
