// app/api/admin/payout-requests/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Simple header-key auth for admin endpoints */
function isAdmin(req: Request) {
  const adminKey = process.env.ADMIN_API_KEY || "";
  const got = req.headers.get("x-admin-key") || "";
  return adminKey && got && got === adminKey;
}

export async function GET(req: Request) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined; // PENDING | PROCESSING | PAID | FAILED
    const from = url.searchParams.get("from") || undefined;     // YYYY-MM-DD
    const to = url.searchParams.get("to") || undefined;         // YYYY-MM-DD
    const take = Math.min(Number(url.searchParams.get("take") || "100"), 1000);
    const skip = Math.max(Number(url.searchParams.get("skip") || "0"), 0);
    const format = (url.searchParams.get("format") || "json").toLowerCase();

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (from || to) {
      where.requestedAt = {};
      if (from) where.requestedAt.gte = new Date(`${from}T00:00:00Z`);
      if (to) where.requestedAt.lte = new Date(`${to}T23:59:59Z`);
    }

    const [total, rows] = await Promise.all([
      prisma.payoutRequest.count({ where }),
      prisma.payoutRequest.findMany({
        where,
        orderBy: { requestedAt: "desc" },
        take,
        skip,
        include: {
          user: { select: { email: true } },
        },
      }),
    ]);

    // CSV export
    if (format === "csv") {
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
        "gcashNumber",
        "bankName",
        "bankAccountNumber",
        "processorNote",
      ];

      const escape = (v: any) => {
        if (v === null || v === undefined) return "";
        const s = String(v);
        // Quote if contains comma/quote/newline
        if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };

      const lines = [
        headers.join(","), // header row
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
            r.gcashNumber ?? "",
            r.bankName ?? "",
            r.bankAccountNumber ?? "",
            r.processorNote ?? "",
          ].map(escape).join(",")
        ),
      ];

      const csv = lines.join("\r\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="payout_requests.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // JSON (default)
    return NextResponse.json({
      ok: true,
      total,
      rows: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        user: { email: r.user?.email ?? null },
        amountPhp: r.amountPhp,
        method: r.method,
        provider: r.provider,
        status: r.status,
        requestedAt: r.requestedAt?.toISOString() ?? null,
        processedAt: r.processedAt?.toISOString() ?? null,
        processorNote: r.processorNote ?? null,
        gcashNumber: r.gcashNumber ?? null,
        bankName: r.bankName ?? null,
        bankAccountNumber: r.bankAccountNumber ?? null,
      })),
    });
  } catch (err: any) {
    console.error("GET /api/admin/payout-requests/list error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
