import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 30_000,
  testDir: "tests",
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
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
});
