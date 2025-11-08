// app/api/admin/payout-requests/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "no-store";
export const revalidate = 0;

type Status = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminKey = req.headers.get("x-admin-key") || "";

    if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const take = Math.min(Number(searchParams.get("take") || 100), 500);
    const status = (searchParams.get("status") || "").toUpperCase() as Status | "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (status && ["PENDING", "PROCESSING", "PAID", "FAILED"].includes(status)) {
      where.status = status;
    }
    if (from) {
      where.requestedAt = { ...(where.requestedAt || {}), gte: new Date(from) };
    }
    if (to) {
      // add 1 day to make "to" inclusive for date-only inputs
      const d = new Date(to);
      d.setDate(d.getDate() + 1);
      where.requestedAt = { ...(where.requestedAt || {}), lt: d };
    }

    const [total, rows] = await Promise.all([
      prisma.payoutRequest.count({ where }),
      prisma.payoutRequest.findMany({
        where,
        orderBy: { requestedAt: "desc" },
        take,
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
          user: {
            select: {
              email: true,
              createdAt: true, // <— for honeymoon/eligibility badge on admin UI
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ ok: true, total, rows });
  } catch (e: any) {
    console.error("GET /api/admin/payout-requests/list error", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
