// app/api/debug/eventlog/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET /api/debug/eventlog?limit=10
 * Auth required. Returns the signed-in user's last N EventLog rows.
 */
export async function GET(req: NextRequest) {
  // resolve user id from session or JWT
  const session: any = await getServerSession(authOptions);
  let userId: string | undefined = session?.user?.id;

  if (!userId) {
    const token: any = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    userId = token?.sub || token?.id;
  }
  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const take = Math.max(1, Math.min(Number(limitRaw ?? 10) || 10, 50));

  // Latest rows for this user
  const rows = await prisma.eventLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({ ok: true, rows });
}
