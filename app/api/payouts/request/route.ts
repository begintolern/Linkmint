// app/api/payouts/request/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type PayoutMethod = "GCASH" | "BANK";
type PayoutProvider = "PAYPAL" | "PAYONEER" | "MANUAL" | "XENDIT" | "PAYMONGO" | "WISE" | "GCASHBIZ";

function toInt(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}
function digitsOnly(s?: string | null) {
  return (s || "").replace(/[^\d]/g, "");
}
// Use MANUAL until enum supports GCASHBIZ in Prisma schema
function defaultProvider(_method: PayoutMethod): PayoutProvider {
  return "MANUAL";
}

// Dev-only auth fallback (header/body/query/env)
async function getDevUserId(req: Request): Promise<string | undefined> {
  // allow in non-prod OR when explicitly enabled
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_PAYOUTS_REQUEST !== "1") return undefined;

  const h = req.headers.get("x-linkmint-dev-user") ?? req.headers.get("x-dev-user-id");
  if (h && h.trim()) return h.trim();

  try {
    const body = await req.clone().json().catch(() => ({} as any));
    if (typeof body?.devUserId === "string" && body.devUserId.trim()) return body.devUserId.trim();
  } catch {}

  try {
    const url = new URL(req.url);
    const qp = url.searchParams.get("devUserId");
    if (qp && qp.trim()) return qp.trim();
  } catch {}

  const envId = process.env.DEV_USER_ID;
  if (envId && envId.trim()) return envId.trim();
  return undefined;
}

export async function POST(req: Request) {
  try {
    // 1) Auth (session or dev bypass)
    const session: any = await getServerSession(authOptions);
    let userId: string | undefined = session?.user?.id;
    if (!userId) userId = await getDevUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });

    // 2) Parse input
    const body = (await req.json().catch(() => ({}))) as any;
    const amountPhp = toInt(body?.amountPhp);
    const method = String(body?.method || "").toUpperCase() as PayoutMethod;

    const gcashNumberRaw = digitsOnly(body?.gcashNumber);
    const bankName = typeof body?.bankName === "string" ? body.bankName.trim() : undefined;
    const bankAccountNumberRaw = digitsOnly(body?.bankAccountNumber);

    if (!amountPhp || amountPhp <= 0) {
      return NextResponse.json({ success: false, error: "INVALID_AMOUNT" }, { status: 400 });
    }
    if (method !== "GCASH" && method !== "BANK") {
      return NextResponse.json({ success: false, error: "UNSUPPORTED_METHOD" }, { status: 400 });
    }

    // 3) DEV BYPASS? If yes, ensure a dev user row exists to satisfy FK, then create request
    const bypass = process.env.ALLOW_DEV_PAYOUTS_REQUEST_BYPASS === "1" || process.env.NODE_ENV !== "production";
    if (bypass) {
      // auto-create minimal user if missing (prevents FK errors)
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) {
        await prisma.user.create({
          data: {
            id: userId,
            email: `${userId}@dev.local`,
            name: "Dev User",
            createdAt: new Date("2024-01-01T00:00:00Z"),
            defaultGcashNumber: "09171234567",
          },
        });
      }

      // minimal method validation
      if (method === "GCASH") {
        if (!gcashNumberRaw || gcashNumberRaw.length < 10 || gcashNumberRaw.length > 13) {
          return NextResponse.json({ success: false, error: "INVALID_GCASH_NUMBER" }, { status: 400 });
        }
      } else {
        if (!bankName || bankName.length < 2) {
          return NextResponse.json({ success: false, error: "INVALID_BANK_NAME" }, { status: 400 });
        }
        if (!bankAccountNumberRaw || bankAccountNumberRaw.length < 6) {
          return NextResponse.json({ success: false, error: "INVALID_BANK_ACCOUNT" }, { status: 400 });
        }
      }

      const created = await prisma.payoutRequest.create({
        data: {
          userId,
          amountPhp,
          method,
          provider: defaultProvider(method),
          gcashNumber: method === "GCASH" ? gcashNumberRaw : null,
          bankName: method === "BANK" ? bankName ?? null : null,
          bankAccountNumber: method === "BANK" ? bankAccountNumberRaw ?? null : null,
        },
        select: {
          id: true,
          userId: true,
          amountPhp: true,
          method: true,
          provider: true,
          status: true,
          gcashNumber: true,
          bankName: true,
          bankAccountNumber: true,
          requestedAt: true,
          createdAt: true,
        },
      });

      // best-effort log
      try {
        await prisma.systemLog.create({
          data: {
            id: `payout_req_${created.id}`,
            type: "PAYOUT_REQUEST_DEV",
            message: `DEV bypass payout request (${method}/${created.provider})`,
            json: JSON.stringify({ userId, amountPhp, method }),
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        request: created,
        note: "DEV BYPASS: eligibility checks skipped; dev user auto-created if missing.",
      });
    }

    // 4) PROD path (kept minimal here; your earlier gates can be re-enabled when ready)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        defaultGcashNumber: true,
        defaultBankName: true,
        defaultBankAccountNumber: true,
        disabled: true,
        deletedAt: true,
      },
    });
    if (!user || user.deletedAt || user.disabled) {
      return NextResponse.json({ success: false, error: "ACCOUNT_DISABLED" }, { status: 403 });
    }

    const created = await prisma.payoutRequest.create({
      data: {
        userId,
        amountPhp,
        method,
        provider: defaultProvider(method),
        gcashNumber: method === "GCASH" ? (gcashNumberRaw || digitsOnly(user.defaultGcashNumber)) : null,
        bankName: method === "BANK" ? (bankName || user.defaultBankName || null) : null,
        bankAccountNumber: method === "BANK"
          ? (bankAccountNumberRaw || digitsOnly(user.defaultBankAccountNumber) || null)
          : null,
      },
      select: {
        id: true,
        userId: true,
        amountPhp: true,
        method: true,
        provider: true,
        status: true,
        gcashNumber: true,
        bankName: true,
        bankAccountNumber: true,
        requestedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, request: created });
  } catch (err: any) {
    console.error("Payout request error:", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", detail: err?.message || "unknown" },
      { status: 500 }
    );
  }
}
