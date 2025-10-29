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

// GET /api/admin/logs?action=USER_DISABLE&email=...&page=1&limit=20&from=2025-10-01&to=2025-10-31
export async function GET(req: Request) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || undefined;
  const email = searchParams.get("email") || undefined; // actorEmail filter
  const targetId = searchParams.get("targetId") || undefined;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (action) where.action = action;
  if (email) where.actorEmail = email;
  if (targetId) where.targetId = targetId;

  // --- robust UTC day range parsing ---
  function ymdToUtcStart(d: string) {
    // Accept "YYYY-MM-DD" from <input type="date">
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (m) {
      const [, Y, M, D] = m;
      return new Date(Date.UTC(Number(Y), Number(M) - 1, Number(D), 0, 0, 0, 0));
    }
    const t = new Date(d);
    return isNaN(+t) ? null : new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 0, 0, 0, 0));
  }

  function ymdToUtcEnd(d: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (m) {
      const [, Y, M, D] = m;
      return new Date(Date.UTC(Number(Y), Number(M) - 1, Number(D), 23, 59, 59, 999));
    }
    const t = new Date(d);
    return isNaN(+t) ? null : new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 23, 59, 59, 999));
  }

  if (from || to) {
    const gte = from ? ymdToUtcStart(from) : null;
    const lte = to ? ymdToUtcEnd(to) : null;
    if (gte || lte) {
      where.createdAt = {};
      if (gte) where.createdAt.gte = gte;
      if (lte) where.createdAt.lte = lte;
    }
  }

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
