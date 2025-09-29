// tests/merchant-rules.spec.ts
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

function expectHealth(json: any, arrayKey: "rules" | "merchants") {
  // Some endpoints return { ok: true }, others { success: true }, some omit both.
  if ("ok" in json) expect(json.ok).toBe(true);
  else if ("success" in json) expect(json.success).toBe(true);

  expect(json).toHaveProperty(arrayKey);
  expect(Array.isArray(json[arrayKey])).toBe(true);
}

test.describe("Merchant Rules API health", () => {
  test("GET /api/merchant-rules?activeOnly=true&market=PH returns rules array and ok/success", async ({ request }) => {
    const res = await request.get(`${BASE}/api/merchant-rules?activeOnly=true&market=PH`);
    expect(res.status(), "HTTP status").toBe(200);
    const json = await res.json();
    expectHealth(json, "rules");
  });

  test("GET /api/merchant-rules/list?activeOnly=true&market=PH returns merchants array and ok/success", async ({ request }) => {
    const res = await request.get(`${BASE}/api/merchant-rules/list?activeOnly=true&market=PH`);
    expect(res.status(), "HTTP status").toBe(200);
    const json = await res.json();
    expectHealth(json, "merchants");
  });

  test("GET /api/public/merchants?market=PH returns merchants array and ok/success", async ({ request }) => {
    const res = await request.get(`${BASE}/api/public/merchants?market=PH`);
    expect(res.status(), "HTTP status").toBe(200);
    const json = await res.json();
    expectHealth(json, "merchants");
  });
});
