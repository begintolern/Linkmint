// app/api/admin/payouts/ledger/export/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

type Status = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

function ok(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

function parseDate(d?: string | null) {
  if (!d) return undefined;
  const v = d.trim();
  // Accept yyyy-mm-dd or full ISO
  const iso = v.length === 10 ? `${v}T00:00:00.000Z` : v;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? undefined : dt;
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
    const status = (url.searchParams.get("status") || "").trim().toUpperCase() as Status | "";
    const fromParam = url.searchParams.get("from"); // yyyy-mm-dd or ISO
    const toParam = url.searchParams.get("to");     // yyyy-mm-dd or ISO

    if (!ok(userId)) {
      return new Response(JSON.stringify({ ok: false, error: "MISSING_USER_ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const from = parseDate(fromParam);
    const toRaw = parseDate(toParam);
    // make "to" inclusive by pushing to end-of-day if only date provided
    const to =
      toRaw && toParam && toParam.length === 10
        ? new Date(new Date(toRaw).setUTCHours(23, 59, 59, 999))
        : toRaw;

    const where: any = { userId };
    if (status && ["PENDING", "PROCESSING", "PAID", "FAILED"].includes(status)) {
      where.status = status;
    }
    if (from || to) {
      where.requestedAt = {};
      if (from) where.requestedAt.gte = from;
      if (to) where.requestedAt.lte = to;
    }

    const rows = await prisma.payoutRequest.findMany({
      where,
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

    // filename includes filters for easy auditing
    const parts = [
      `payouts_${userId}`,
      status ? `status-${status}` : "",
      from ? `from-${from.toISOString().slice(0, 10)}` : "",
      to ? `to-${to.toISOString().slice(0, 10)}` : "",
    ].filter(Boolean);

    const filename = `${parts.join("_") || `payouts_${userId}`}.csv`;
    const csv = lines.join("\r\n");

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
