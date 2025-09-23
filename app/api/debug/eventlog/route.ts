import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET /api/debug/eventlog?limit=10
 * GET /api/debug/eventlog?all=1&limit=25  // admin-only: show all users' events
 */
export async function GET(req: NextRequest) {
  // resolve user id + role
  const session: any = await getServerSession(authOptions);
  let userId: string | undefined = session?.user?.id;
  let role: string | undefined = session?.user?.role;

  if (!userId) {
    const token: any = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    userId = token?.sub || token?.id;
    role = token?.role || role;
  }
  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const allRaw = url.searchParams.get("all");
  const take = Math.max(1, Math.min(Number(limitRaw ?? 10) || 10, 50));
  const wantAll = allRaw === "1";

  // If requesting all events, require admin
  const where = wantAll
    ? {} // admin view: everything
    : { userId }; // normal view: only your events

  if (wantAll && (role ?? "").toLowerCase() !== "admin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const rows = await prisma.eventLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({ ok: true, rows, scope: wantAll ? "all" : "user" });
}
