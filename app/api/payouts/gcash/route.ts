// app/api/payouts/gcash/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";

/**
 * GCash payout stub (pre-provisioned).
 * - Does NOT hit any external API.
 * - Returns SIMULATED until credentials are provided.
 * - Safe to deploy now; becomes plug-and-play later.
 *
 * When you’re ready to go live:
 *   - Set GCASH_CLIENT_ID / GCASH_SECRET (and whatever your partner requires)
 *   - Replace the SIMULATED branch with a real API call + DB logging
 */

const REQUIRED_VARS = [
  "GCASH_CLIENT_ID",
  "GCASH_SECRET",
  // Add more as your partner requires:
  // "GCASH_API_KEY",
  // "GCASH_WEBHOOK_SECRET",
];

function missingEnvVars(): string[] {
  return REQUIRED_VARS.filter((k) => !process.env[k] || !String(process.env[k]).trim());
}

// Accept POST as alias for PATCH (some callers use POST)
export async function POST(req: Request) {
  return PATCH(req);
}

// PATCH body example (future):
// { "amountPhp": 500.00, "gcashNumber": "09XXXXXXXXX", "note": "optional" }
export async function PATCH(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore; we'll validate below
  }

  const amountPhp = Number(body?.amountPhp ?? 0);
  const gcashNumber = String(body?.gcashNumber ?? "").trim();

  if (!amountPhp || amountPhp <= 0) {
    return NextResponse.json(
      { ok: false, error: "amountPhp must be a positive number" },
      { status: 400 }
    );
  }
  if (!gcashNumber || gcashNumber.length < 8) {
    return NextResponse.json(
      { ok: false, error: "gcashNumber is required" },
      { status: 400 }
    );
  }

  const missing = missingEnvVars();

  // Until credentials exist, we simulate success safely (no DB writes).
  if (missing.length > 0) {
    return NextResponse.json({
      ok: true,
      mode: "SIMULATED",
      provider: "PH_GCASH",
      message:
        "GCash payout pre-provisioned. Live transfer disabled until credentials are configured.",
      missingEnv: missing,
      echo: { amountPhp, gcashNumber },
    });
  }

  // ---------- LIVE BRANCH (future) ----------
  // Here is where you'll add the real call once credentials exist.
  // Example (pseudo):
  // const resp = await gcashClient.transfer({ amount: amountPhp, to: gcashNumber });
  // await prisma.payout.create({ ...log it... });
  // return NextResponse.json({ ok: true, mode: "LIVE", provider: "PH_GCASH", ref: resp.id });

  // For now, even with env present, keep it simulated to avoid accidental live hits:
  return NextResponse.json({
    ok: true,
    mode: "CREDENTIALS_PRESENT_BUT_SIMULATED",
    provider: "PH_GCASH",
    echo: { amountPhp, gcashNumber },
  });
}

// Basic GET for quick health check:
export async function GET() {
  const missing = missingEnvVars();
  return NextResponse.json({
    ok: true,
    provider: "PH_GCASH",
    ready: missing.length === 0,
    missingEnv: missing,
  });
}
