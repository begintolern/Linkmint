// app/api/admin/payouts/ledger/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Simple admin check via x-admin-key to match ADMIN_API_KEY */
function assertAdmin(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  const env = (process.env.ADMIN_API_KEY || "").trim();
  return !!env && key === env;
}

export async function GET(req: Request) {
  try {
    if (!assertAdmin(req)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || "";

    if (!userId) {
      return NextResponse.json({ ok: false, error: "MISSING_USER_ID" }, { status: 400 });
    }

    // Return the user’s payout *requests* as the “ledger” items (what your UI expects)
    // If you want paid payouts table instead, switch to prisma.payout.findMany(...) as needed.
    const items = await prisma.payoutRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        userId: true,
        amountPhp: true,
        method: true,
        provider: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        processorNote: true,
        gcashNumber: true,
        bankName: true,
        bankAccountNumber: true,
      },
    });

    return NextResponse.json({ ok: true, userId, items });
  } catch (e: any) {
    console.error("GET /api/admin/payouts/ledger error:", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", detail: e?.message }, { status: 500 });
  }
}
