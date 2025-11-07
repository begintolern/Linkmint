// app/api/admin/payouts/user-summary/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function assertAdmin(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

export async function GET(req: Request) {
  try {
    if (!assertAdmin(req)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = (url.searchParams.get("userId") || "").trim();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "MISSING_USER_ID" }, { status: 400 });
    }

    // Fetch in parallel
    const [
      reqs,
      payouts,
      user
    ] = await Promise.all([
      prisma.payoutRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: "desc" },
        take: 100, // cap for safety
        select: {
          id: true, status: true, amountPhp: true, method: true, provider: true,
          requestedAt: true, processedAt: true, processorNote: true,
          gcashNumber: true, bankName: true, bankAccountNumber: true,
        },
      }),
      prisma.payout.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true, amount: true, statusEnum: true, provider: true,
          paypalBatchId: true, transactionId: true, createdAt: true, paidAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, createdAt: true, disabled: true, deletedAt: true }
      })
    ]);

    // Aggregate helpers
    const reqTotals: Record<string, { count: number; sum: number }> = {};
    let reqSumAll = 0;
    for (const r of reqs) {
      const k = r.status || "UNKNOWN";
      const amt = Number(r.amountPhp || 0);
      reqTotals[k] = reqTotals[k] || { count: 0, sum: 0 };
      reqTotals[k].count += 1;
      reqTotals[k].sum += amt;
      reqSumAll += amt;
    }

    const payTotals: Record<string, { count: number; sum: number }> = {};
    let paySumAll = 0;
    for (const p of payouts) {
      const k = String(p.statusEnum || "UNKNOWN");
      const amt = Number(p.amount || 0);
      payTotals[k] = payTotals[k] || { count: 0, sum: 0 };
      payTotals[k].count += 1;
      payTotals[k].sum += amt;
      paySumAll += amt;
    }

    return NextResponse.json({
      ok: true,
      user: user || { id: userId },
      payoutRequests: {
        totals: reqTotals,
        sumAll: reqSumAll,
        last10: reqs.slice(0, 10),
      },
      payouts: {
        totals: payTotals,
        sumAll: paySumAll,
        last10: payouts.slice(0, 10),
      },
    });
  } catch (e: any) {
    console.error("GET /admin/payouts/user-summary error:", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", detail: e?.message }, { status: 500 });
  }
}
