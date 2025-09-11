import { test, expect } from "@playwright/test";

test("authenticate and save storage state", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL!;
  const pass = process.env.ADMIN_PASS!;
  if (!email || !pass) throw new Error("ADMIN_EMAIL/ADMIN_PASS env not set");

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(pass);
  await page.getByRole("button", { name: "Login" }).click();

  // Accept either /admin or /admin/users depending on redirect timing
  await expect(page).toHaveURL(/\/admin(\/users)?$/);

  // Persist the logged-in session
  await page.context().storageState({ path: "storageState.json" });
});
