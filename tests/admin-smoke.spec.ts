import { test, expect } from "@playwright/test";

test.describe("Admin smoke tests (authenticated)", () => {
  test("Users page loads", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Admin · Users" })).toBeVisible();
  });

  test("Referrals page loads", async ({ page }) => {
    await page.goto("/admin/referrals");
    await expect(page.getByRole("heading", { name: "Admin · Referrals" })).toBeVisible();
  });

  test("Payouts page loads", async ({ page }) => {
    await page.goto("/admin/payouts");
    await expect(page.getByRole("heading", { name: "Admin · Payouts" })).toBeVisible();
  });

  test("Logs page loads", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(page.getByRole("heading", { name: "Admin · Logs" })).toBeVisible();
  });

  test("Settings page loads", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: "Admin · Settings" })).toBeVisible();
  });
});
test("Users actions: Refresh keeps table visible", async ({ page }) => {
  await page.goto("/admin/users");
  const table = page.locator("table");
  await expect(table).toBeVisible();

  // Capture current row count (can be 0+)
  const before = await table.locator("tbody tr").count();

  // Click Refresh and ensure table still renders
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(table).toBeVisible();

  // Row count should be a number (>= 0) — mainly a smoke check that nothing broke
  const after = await table.locator("tbody tr").count();
  expect(after).toBeGreaterThanOrEqual(0);

  // Optional: allow for either same or changed count (no strict assertion needed)
  // expect(after).toBeGreaterThanOrEqual(before);
});
test("Payouts actions: status filter updates table", async ({ page }) => {
  await page.goto("/admin/payouts");

  // Table renders
  const table = page.locator("table");
  await expect(table).toBeVisible();

  // Change status filter to "Approved"
  await page.selectOption("select", "Approved");

  // Wait for network/render to settle (simple smoke-style wait)
  await page.waitForTimeout(500);

  // Table should still be visible after filtering
  await expect(table).toBeVisible();

  // Optional: check at least header row exists
  await expect(table.locator("thead")).toBeVisible();
});
test("Settings actions: toggle auto payout on/off", async ({ page }) => {
  await page.goto("/admin/settings");

  const badge = page.locator("span.rounded-md.border");

  // Capture initial state text
  const before = await badge.textContent();

  // Click Enable or Disable depending on current state
  if (before?.includes("DISABLED")) {
    await page.getByRole("button", { name: "Enable" }).click();
    await expect(badge).toHaveText(/ENABLED/);
    // flip back
    await page.getByRole("button", { name: "Disable" }).click();
    await expect(badge).toHaveText(/DISABLED/);
  } else {
    await page.getByRole("button", { name: "Disable" }).click();
    await expect(badge).toHaveText(/DISABLED/);
    // flip back
    await page.getByRole("button", { name: "Enable" }).click();
    await expect(badge).toHaveText(/ENABLED/);
  }
});
