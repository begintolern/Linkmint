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

// GET /api/admin/logs?action=...&email=...&targetId=...&page=1&limit=20&from=YYYY-MM-DD&to=YYYY-MM-DD&tzOffset=420
export async function GET(req: Request) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || undefined;
  const email = searchParams.get("email") || undefined;
  const targetId = searchParams.get("targetId") || undefined;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const tzOffsetMin = Number(searchParams.get("tzOffset") ?? "0"); // minutes, e.g. 420 for PDT

  const where: any = {};
  if (action) where.action = action;
  if (email) where.actorEmail = email;
  if (targetId) where.targetId = targetId;

  // Parse YYYY-MM-DD as a LOCAL date (from the user's browser),
  // then convert to the correct UTC instants using tzOffset from the client.
  function parseYMDToUtcRange(ymd: string): { startUtc: Date; endUtc: Date } | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return null;
    const [, Y, M, D] = m;
    const y = Number(Y), mo = Number(M) - 1, d = Number(D);

    // Local midnight start/end expressed as UTC instants:
    // UTC = local + offset (offset is minutes behind UTC, e.g. 420)
    const startUtcMs = Date.UTC(y, mo, d, 0, 0, 0, 0) + tzOffsetMin * 60_000;
    const endUtcMs   = Date.UTC(y, mo, d, 23, 59, 59, 999) + tzOffsetMin * 60_000;

    return { startUtc: new Date(startUtcMs), endUtc: new Date(endUtcMs) };
  }

  if (from || to) {
    const fromSpan = from ? parseYMDToUtcRange(from) : null;
    const toSpan   = to   ? parseYMDToUtcRange(to)   : null;

    const gte = fromSpan ? fromSpan.startUtc : toSpan ? toSpan.startUtc : null;
    const lte = toSpan ? toSpan.endUtc : fromSpan ? fromSpan.endUtc : null;

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
