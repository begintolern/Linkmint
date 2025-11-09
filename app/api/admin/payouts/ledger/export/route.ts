// app/api/admin/payouts/ledger/export/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

function ok(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

// Gate: allow either (a) logged-in admin session OR (b) x-admin-key header
async function isAuthorized(req: NextRequest) {
  // (a) admin session
  try {
    const session: any = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase?.() || "";
    const role = (session?.user?.role || session?.user?.Role || "").toString().toUpperCase();
    const admins =
      (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

    if (role === "ADMIN" || (email && admins.includes(email))) {
      return true;
    }
  } catch {
    // fall through to header check
  }

  // (b) x-admin-key header
  const adminKey = req.headers.get("x-admin-key") || "";
  if (ok(process.env.ADMIN_API_KEY) && adminKey === process.env.ADMIN_API_KEY) {
    return true;
  }

  return false;
}

function csvEscape(value: any): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Quote if contains comma, double quote, CR/LF
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  try {
    // auth
    if (!(await isAuthorized(req))) {
      return new Response(JSON.stringify({ ok: false, error: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const userId = (url.searchParams.get("userId") || "").trim();

    if (!ok(userId)) {
      return new Response(JSON.stringify({ ok: false, error: "MISSING_USER_ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rows = await prisma.payoutRequest.findMany({
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
      },
    });

    const header = [
      "id",
      "userId",
      "amountPhp",
      "method",
      "provider",
      "status",
      "requestedAt",
      "processedAt",
      "processorNote",
    ];

    const lines = [header.join(",")];

    for (const r of rows) {
      lines.push(
        [
          csvEscape(r.id),
          csvEscape(r.userId),
          csvEscape(r.amountPhp),
          csvEscape(r.method),
          csvEscape(r.provider),
          csvEscape(r.status),
          csvEscape(r.requestedAt?.toISOString?.() ?? ""),
          csvEscape(r.processedAt?.toISOString?.() ?? ""),
          csvEscape(r.processorNote ?? ""),
        ].join(","),
      );
    }

    const csv = lines.join("\r\n");
    const filename = `payouts_${userId}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("GET /api/admin/payouts/ledger/export error:", e);
    return new Response(JSON.stringify({ ok: false, error: "SERVER_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
