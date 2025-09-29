import { defineConfig } from "@playwright/test";

export default defineConfig({
  // Point to your local dev server; override with BASE_URL if needed
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
  },
  // Only run our API test file
  testMatch: /merchant-rules\.spec\.ts$/,
  // IMPORTANT: disable any global setup that requires admin creds
  globalSetup: undefined,
  // Keep it single-worker and quick
  workers: 1,
});
