// app/api/payouts/quote/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

type Method = "GCASH" | "BANK";
type Provider = "PAYPAL" | "PAYONEER" | "MANUAL" | "XENDIT" | "PAYMONGO" | "WISE" | "GCASHBIZ";

// --- Dev-only auth fallback ----
async function getDevUserId(req: Request): Promise<string | undefined> {
  if (process.env.ALLOW_DEV_PAYOUTS_QUOTE !== "1") return undefined;

  // 1) Header
  const h =
    req.headers.get("x-linkmint-dev-user") ??
    req.headers.get("x-dev-user-id");
  if (h && h.trim()) return h.trim();

  // 2) Body
  try {
    const body = await req.clone().json().catch(() => ({} as any));
    if (typeof body?.devUserId === "string" && body.devUserId.trim()) {
      return body.devUserId.trim();
    }
  } catch {
    // ignore
  }

  // 3) Query param
  try {
    const url = new URL(req.url);
    const qp = url.searchParams.get("devUserId");
    if (qp && qp.trim()) return qp.trim();
  } catch {
    // ignore
  }

  // 4) .env fixed
  const envId = process.env.DEV_USER_ID;
  if (envId && envId.trim()) return envId.trim();

  return undefined;
}

function pickDefaults(method: Method) {
  const globalBps = Number(process.env.PAYOUT_FEE_BPS);
  const globalFixed = Number(process.env.PAYOUT_FEE_FIXED_PHP);

  if (method === "GCASH") {
    const bps = Number(process.env.PAYOUT_FEE_GCASH_BPS);
    const fixed = Number(process.env.PAYOUT_FEE_GCASH_FIXED);
    return {
      percentBps: Number.isFinite(bps) ? bps : Number.isFinite(globalBps) ? globalBps : 250, // 2.50%
      fixedPhp: Number.isFinite(fixed) ? fixed : Number.isFinite(globalFixed) ? globalFixed : 15, // ₱15
      provider: "GCASHBIZ" as Provider,
    };
  }

  const bps = Number(process.env.PAYOUT_FEE_BANK_BPS);
  const fixed = Number(process.env.PAYOUT_FEE_BANK_FIXED);
  return {
    percentBps: Number.isFinite(bps) ? bps : Number.isFinite(globalBps) ? globalBps : 300, // 3.00%
    fixedPhp: Number.isFinite(fixed) ? fixed : Number.isFinite(globalFixed) ? globalFixed : 25, // ₱25
    provider: "MANUAL" as Provider,
  };
}

export async function POST(req: Request) {
  try {
    // Require auth; allow dev bypass if enabled
    const session = await getServerSession(authOptions);
    let userId = (session as any)?.user?.id as string | undefined;
    if (!userId) userId = await getDevUserId(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const amountPhp = Number(body?.amountPhp);
    const methodRaw = String(body?.method || "").toUpperCase();
    const explicitProvider = (body?.provider as Provider | undefined) ?? undefined;

    if (!Number.isInteger(amountPhp) || amountPhp <= 0) {
      return NextResponse.json(
        { ok: false, error: "amountPhp must be a positive integer (whole pesos)." },
        { status: 400 }
      );
    }
    if (methodRaw !== "GCASH" && methodRaw !== "BANK") {
      return NextResponse.json({ ok: false, error: "method must be 'GCASH' or 'BANK'." }, { status: 400 });
    }

    const method = methodRaw as Method;
    const defaults = pickDefaults(method);
    const provider: Provider = explicitProvider ?? defaults.provider;

    const percentBps = defaults.percentBps;
    const fixedPhp = defaults.fixedPhp;

    const percentFeePhp = Math.floor((amountPhp * percentBps) / 10_000);
    const estFeePhp = percentFeePhp + fixedPhp;
    const netPhp = Math.max(0, amountPhp - estFeePhp);

    return NextResponse.json({
      ok: true,
      userId,
      input: { amountPhp, method, provider },
      fees: { percentBps, fixedPhp, percentFeePhp, estFeePhp },
      payout: { grossPhp: amountPhp, netPhp, currency: "PHP" },
    });
  } catch (e: any) {
    console.error("POST /api/payouts/quote error:", e);
    return NextResponse.json({ ok: false, error: "Server error", detail: e?.message ?? String(e) }, { status: 500 });
  }
}
