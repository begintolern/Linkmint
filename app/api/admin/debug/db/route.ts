export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

function redactDb(url?: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      protocol: u.protocol.replace(/:$/, ""),
      host: u.host,             // e.g. db.uficcvvkqabshrdfivni.supabase.co:5432
      database: u.pathname.slice(1), // e.g. postgres
      user: u.username ? "***" : null,
    };
  } catch {
    return { raw: "***" };
  }
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const me = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true },
    });
    if (!me || (me.role ?? "").toUpperCase() !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Read environment DB URL (redacted)
    const dbInfo = redactDb(process.env.DATABASE_URL);

    // Fetch a few recent payouts so we can see what DB this service is reading
    const recent = await prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, createdAt: true, statusEnum: true, provider: true, netCents: true },
    });

    return NextResponse.json({
      ok: true,
      db: dbInfo,
      payoutsCount: recent.length,
      recent,
    });
  } catch (e) {
    console.error("GET /api/admin/debug/db error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
