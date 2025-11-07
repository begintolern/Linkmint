// app/admin/payouts/csv/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// NOTE: For local admin use only (no auth). For production, gate this behind admin auth.

function esc(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.toUpperCase();

    const where: any = {};
    if (status && ["PENDING", "PROCESSING", "PAID", "FAILED"].includes(status)) {
      where.status = status;
    }

    const rows = await prisma.payoutRequest.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      take: 2000,
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
        user: { select: { email: true } },
      },
    });

    const headers = [
      "id",
      "userEmail",
      "userId",
      "amountPhp",
      "method",
      "provider",
      "status",
      "requestedAt",
      "processedAt",
      "processorNote",
      "gcashNumber",
      "bankName",
      "bankAccountNumber",
    ];

    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.user?.email ?? "",
          r.userId,
          r.amountPhp,
          r.method,
          r.provider,
          r.status,
          r.requestedAt?.toISOString() ?? "",
          r.processedAt?.toISOString() ?? "",
          r.processorNote ?? "",
          r.gcashNumber ?? "",
          r.bankName ?? "",
          r.bankAccountNumber ?? "",
        ]
          .map(esc)
          .join(",")
      ),
    ];

    const csv = lines.join("\r\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payouts_${status || "ALL"}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Admin payouts CSV error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
