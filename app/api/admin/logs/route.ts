// app/api/admin/logs/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "clwzud5zr0000v4l5gnkz1oz3";

type AdminSession =
  | { user?: { id?: string; role?: string; email?: string | null } | null }
  | null;

async function requireAdmin() {
  const session = (await getServerSession(authOptions as any)) as AdminSession;
  const uid = session?.user?.id;
  const role = session?.user?.role;
  if (uid && (uid === ADMIN_USER_ID || role === "admin")) return true;
  return false;
}

// GET /api/admin/logs?action=...&email=...&targetId=...&page=1&limit=20&from=YYYY-MM-DD|MM/DD/YYYY&to=YYYY-MM-DD|MM/DD/YYYY
export async function GET(req: Request) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || undefined;
  const email = searchParams.get("email") || undefined; // actorEmail exact match
  const targetId = searchParams.get("targetId") || undefined;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (action) where.action = action;
  if (email) where.actorEmail = email;
  if (targetId) where.targetId = targetId;

  // ----- Robust LOCAL-day parsing (supports YYYY-MM-DD and MM/DD/YYYY) -----
  function parseLocalDay(d: string): { start: Date; end: Date } | null {
    // 1) YYYY-MM-DD
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (iso) {
      const [, Y, M, D] = iso;
      const start = new Date(Number(Y), Number(M) - 1, Number(D), 0, 0, 0, 0);
      const end = new Date(Number(Y), Number(M) - 1, Number(D), 23, 59, 59, 999);
      return { start, end };
    }
    // 2) MM/DD/YYYY
    const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
    if (us) {
      const [, m, dd, y] = us;
      const Y = Number(y), M = Number(m) - 1, D = Number(dd);
      const start = new Date(Y, M, D, 0, 0, 0, 0);
      const end = new Date(Y, M, D, 23, 59, 59, 999);
      return { start, end };
    }
    // 3) Fallback native Date (local)
    const t = new Date(d);
    if (!isNaN(+t)) {
      const Y = t.getFullYear(), M = t.getMonth(), D = t.getDate();
      const start = new Date(Y, M, D, 0, 0, 0, 0);
      const end = new Date(Y, M, D, 23, 59, 59, 999);
      return { start, end };
    }
    return null;
  }

  if (from || to) {
    const fromSpan = from ? parseLocalDay(from) : null;
    const toSpan = to ? parseLocalDay(to) : null;

    // If only one bound provided, use that day's start or end
    const gte = fromSpan ? fromSpan.start : toSpan ? toSpan.start : null;
    const lte = toSpan ? toSpan.end : fromSpan ? fromSpan.end : null;

    if (gte || lte) {
      where.createdAt = {};
      if (gte) where.createdAt.gte = gte;
      if (lte) where.createdAt.lte = lte;
    }
  }
  // ------------------------------------------------------------------------

  const total = await prisma.adminActionLog.count({ where });
  const rows = await prisma.adminActionLog.findMany({
    where,
    orderBy: { createdAt: "desc" as const },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      createdAt: true,
      actorId: true,
      actorEmail: true,
      action: true,
      targetType: true,
      targetId: true,
      details: true,
    },
  });

  return NextResponse.json({ ok: true, total, page, limit, rows });
}
